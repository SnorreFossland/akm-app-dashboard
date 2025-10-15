import type { PromptTemplate } from '@/components/ai-chat/promptTemplates';
import type { DomainCategory } from '@/features/model-universe/modelSlice';

export interface TemplateSelectionCriteria {
    documentType?: string;
    domainCategory?: DomainCategory | string;
    usage?: string; // optional usage filter (e.g., 'refine' or category)
    includeDomainContext?: boolean;
    textContent?: string; // optional text for heuristics
}

export interface TemplateSelectionOptions {
    limit?: number;
    allowFallback?: boolean;
}

// New: lightweight cache to avoid repeated work
const _selectionCache = new Map<string, PromptTemplate[]>();
const CACHE_MAX = 128;

function _makeTemplatesSig(templates: PromptTemplate[]) {
    // Try to create a stable-ish signature of the templates list so cache invalidates if templates change.
    return templates.map(t => {
        const anyT = t as any;
        return `${anyT.id ?? anyT.name ?? ''}:${(anyT.updatedAt ?? anyT.createdAt ?? '').toString().slice(0, 24)}`;
    }).join('|');
}

function _normalizeListField(field?: unknown): string[] {
    if (!field) return [];
    if (Array.isArray(field)) return field.map(s => String(s).trim().toLowerCase());
    return String(field).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function _tokenize(text?: string): string[] {
    if (!text) return [];
    return text
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map(t => t.trim())
        .filter(Boolean);
}

function _overlapCount(a: string[], b: string[]) {
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    let n = 0;
    for (const item of a) if (setB.has(item)) n++;
    return n;
}

/*
  Selection strategy implemented:
  - Strict filter: templates that are compatible with BOTH documentType and domainCategory (wildcard = undefined or 'any').
  - Score by: priority, exact matches, usage match, tag/text heuristics, optional template weight, recency tiebreak.
  - Fallback flow (if allowFallback):
      1) Relax to union (docType OR domainCategory)
      2) Then generic templates (those with 'any' or no constraints)
*/
export function selectPromptTemplates(
    templates: PromptTemplate[],
    criteria: TemplateSelectionCriteria,
    options?: TemplateSelectionOptions
): PromptTemplate[] {
    const limit = options?.limit ?? 10;
    const allowFallback = options?.allowFallback ?? true;

    if (!templates || templates.length === 0) return [];

    const critDoc = (criteria.documentType ?? '').toString().trim().toLowerCase() || undefined;
    const critDomain = (criteria.domainCategory ?? '').toString().trim().toLowerCase() || undefined;
    const critUsage = (criteria.usage ?? '').toString().trim().toLowerCase() || undefined;
    const critTokens = _tokenize(criteria.textContent);

    // Create cache key
    const cacheKey = JSON.stringify({
        sig: _makeTemplatesSig(templates),
        doc: critDoc,
        domain: critDomain,
        usage: critUsage,
        text: critTokens.slice(0, 10),
        limit,
        allowFallback
    });
    if (_selectionCache.has(cacheKey)) {
        return _selectionCache.get(cacheKey)!.slice(0, limit);
    }

    // constants for scoring
    const WEIGHTS = {
        priorityScale: 10,
        docExact: 50,
        domainExact: 45,
        docAny: 4,
        domainAny: 4,
        usageMatch: 18,
        tagMatch: 6,
        textMatchPerToken: 3,
        recencyMaxBoostDays: 30,
        weightMultiplierDefault: 1
    };

    // helper to compute match info and score
    function scoreTemplate(t: PromptTemplate) {
        const anyT = t as any;

        const docList = _normalizeListField(anyT.applicableDocumentTypes);
        const domainList = _normalizeListField(anyT.applicableDomainCategories);
        const tags = _normalizeListField(anyT.tags);

        let score = 0;

        const priority = typeof anyT.priority === 'number' ? anyT.priority : 0;
        score += priority * WEIGHTS.priorityScale;

        // document type match (exact or 'any')
        if (critDoc) {
            if (docList.includes(critDoc)) score += WEIGHTS.docExact;
            else if (docList.includes('any') || docList.length === 0) score += WEIGHTS.docAny;
        } else {
            // no document type constraint: treat as 'any'
            score += WEIGHTS.docAny;
        }

        // domain category match (exact or 'any')
        if (critDomain) {
            if (domainList.includes(critDomain)) score += WEIGHTS.domainExact;
            else if (domainList.includes('any') || domainList.length === 0) score += WEIGHTS.domainAny;
        } else {
            score += WEIGHTS.domainAny;
        }

        // usage match
        if (critUsage && typeof anyT.usage === 'string') {
            if (anyT.usage.toLowerCase() === critUsage) score += WEIGHTS.usageMatch;
        }

        // tag vs text token overlap
        const tagOverlap = _overlapCount(tags, critTokens);
        score += tagOverlap * WEIGHTS.tagMatch;

        // check prompt/name content against tokens
        const promptText = (String(anyT.prompt ?? anyT.name ?? '')).toLowerCase();
        let textMatches = 0;
        for (const tok of critTokens.slice(0, 10)) {
            if (promptText.includes(tok)) {
                textMatches++;
            }
        }
        score += textMatches * WEIGHTS.textMatchPerToken;

        // small recency boost (newer templates slightly favored)
        const createdAt = anyT.createdAt ?? anyT.updatedAt;
        if (createdAt) {
            const createdMs = (+new Date(createdAt));
            if (!Number.isNaN(createdMs)) {
                const ageDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
                const recencyBoost = Math.max(0, WEIGHTS.recencyMaxBoostDays - Math.min(ageDays, WEIGHTS.recencyMaxBoostDays));
                score += recencyBoost * 0.1; // small boost per day within recency window
            }
        }

        // apply template-specific multiplier if provided
        const multiplier = (typeof anyT.weight === 'number' && anyT.weight > 0) ? anyT.weight : WEIGHTS.weightMultiplierDefault;
        score *= multiplier;

        return {
            template: t,
            score,
            priority
        };
    }

    // strict filter BOTH doc and domain must be compatible (wildcard 'any' or undefined counts as compatible)
    function isCompatibleBoth(t: PromptTemplate) {
        const anyT = t as any;
        const docList = _normalizeListField(anyT.applicableDocumentTypes);
        const domainList = _normalizeListField(anyT.applicableDomainCategories);

        const docCompatible = !critDoc || docList.length === 0 || docList.includes('any') || docList.includes(critDoc);
        const domainCompatible = !critDomain || domainList.length === 0 || domainList.includes('any') || domainList.includes(critDomain);

        return docCompatible && domainCompatible;
    }

    const strictCandidates = templates.filter(isCompatibleBoth);

    let scored: { template: PromptTemplate; score: number; priority: number }[] = strictCandidates.map(scoreTemplate);

    // sort by score desc, then priority desc, then createdAt desc
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.priority !== a.priority) return b.priority - a.priority;
        const aDate = +new Date((a.template as any).createdAt ?? (a.template as any).updatedAt ?? 0);
        const bDate = +new Date((b.template as any).createdAt ?? (b.template as any).updatedAt ?? 0);
        return bDate - aDate;
    });

    let result = scored.map(s => s.template).slice(0, limit);

    // Fallbacks: union (doc OR domain), then generic 'any' templates
    if (result.length === 0 && allowFallback) {
        // union candidates
        const unionCandidates = templates.filter(t => {
            const anyT = t as any;
            const docList = _normalizeListField(anyT.applicableDocumentTypes);
            const domainList = _normalizeListField(anyT.applicableDomainCategories);

            const docMatch = !critDoc || docList.length === 0 || docList.includes('any') || docList.includes(critDoc);
            const domainMatch = !critDomain || domainList.length === 0 || domainList.includes('any') || domainList.includes(critDomain);

            // union => at least one side compatible
            return docMatch || domainMatch;
        });

        if (unionCandidates.length > 0) {
            scored = unionCandidates.map(scoreTemplate).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.priority !== a.priority) return b.priority - a.priority;
                const aDate = +new Date((a.template as any).createdAt ?? (a.template as any).updatedAt ?? 0);
                const bDate = +new Date((b.template as any).createdAt ?? (b.template as any).updatedAt ?? 0);
                return bDate - aDate;
            });
            result = scored.map(s => s.template).slice(0, limit);
        }
    }

    if (result.length === 0 && allowFallback) {
        // last resort: generic templates (no constraints or explicit 'any')
        const generic = templates.filter(t => {
            const anyT = t as any;
            const docList = _normalizeListField(anyT.applicableDocumentTypes);
            const domainList = _normalizeListField(anyT.applicableDomainCategories);
            const docGeneric = docList.length === 0 || docList.includes('any');
            const domainGeneric = domainList.length === 0 || domainList.includes('any');
            return docGeneric && domainGeneric;
        });

        if (generic.length > 0) {
            scored = generic.map(scoreTemplate).sort((a, b) => b.score - a.score);
            result = scored.map(s => s.template).slice(0, limit);
        }
    }

    // store in cache (simple pruning)
    _selectionCache.set(cacheKey, result.slice(0, limit));
    if (_selectionCache.size > CACHE_MAX) {
        const firstKey = _selectionCache.keys().next().value;
        if (typeof firstKey === 'string') {
            _selectionCache.delete(firstKey);
        }
    }

    return result.slice(0, limit);
}
