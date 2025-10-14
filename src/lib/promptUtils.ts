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

/*
  selectPromptTemplates
  - Inputs: templates array, criteria, options
  - Behavior (plan):
    1) Filter templates that are compatible:
       - Keep templates where applicableDocumentTypes is undefined OR includes documentType OR includes 'any'
       - AND applicableDomainCategories is undefined OR includes domainCategory OR includes 'any'
    2) Score templates:
       - base score = priority || 0
       - +docTypeMatchWeight if exact match
       - +domainCategoryMatchWeight if exact match
       - +usageMatchWeight if criteria.usage matches template.usage
       - +tag/content heuristics if template.tags match textContent tokens
       - multiply by weight if provided
    3) Sort by score desc, then priority desc, then createdAt desc
    4) If none match and allowFallback=true: return templates marked as generic (applicableDocumentTypes includes 'any') or usage-less generic templates
    5) Return top 'limit' entries
  - Note: implement memoization and optional in-memory indices for performance.
*/
export function selectPromptTemplates(
    templates: PromptTemplate[],
    criteria: TemplateSelectionCriteria,
    options?: TemplateSelectionOptions
): PromptTemplate[] {
    // TODO: implement filtering, scoring and caching
    // This placeholder returns a deterministic subset (implementation deferred)
    return templates.slice(0, options?.limit ?? 10);
}
