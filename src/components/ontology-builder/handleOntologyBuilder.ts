import {
    ontologySystemPrompt,
    ontologySystemBehaviorGuidelines,
    ontologyExistingOntology,
    ontologyUserPrompt,
    ontologyUserInput,
    ontologyExistingContext,
    ontologyMetamodelPrompt
} from '@/app/ontology-builder/prompts';

interface Concept {
    name: string;
    description: string;
}

interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
    description: string;
}

interface OntologyData {
    name?: string;
    description?: string;
    presentation?: string;
    concepts: Concept[];
    relationships: Relationship[];
}

export interface HandleOntologyBuilderParams {
    setStep: (n: number) => void;
    dispatch: any;
    addMessage: any;
    setIsLoading: (b: boolean) => void;
    setActiveTab: (s: string) => void;
    descrString: string;
    systemPrompt?: string;
    systemBehaviorGuidelines?: string;
    userPrompt?: string;
    userInput?: string;
    contextItems?: string;
    contextOntology?: string;
    contextMetamodel?: string;
    suggestedOntologyData: OntologyData | null;
    setSuggestedOntologyData: (data: OntologyData | null) => void;
    debug?: boolean;
}

/**
 * Runs the ontology builder flow and returns a string that can be safely rendered
 * (formatted assistant markdown or diagnostic/raw text). Structured data is still
 * passed back via `setSuggestedOntologyData`.
 */
export async function handleOntologyBuilder(params: HandleOntologyBuilderParams): Promise<string | undefined> {
    const {
        setIsLoading,
        dispatch,
        addMessage,
        setStep,
        setActiveTab,
        descrString,
        systemPrompt,
        systemBehaviorGuidelines,
        userPrompt,
        userInput,
        contextItems,
        contextOntology,
        contextMetamodel,
        suggestedOntologyData,
        setSuggestedOntologyData,
        debug
    } = params;

    // Resolve final prompt values (use defaults when caller omitted them)
    const finalSystemPrompt = (systemPrompt && systemPrompt.trim() !== '') ? systemPrompt : ontologySystemPrompt;
    const finalSystemBehaviorGuidelines = (systemBehaviorGuidelines && systemBehaviorGuidelines.trim() !== '') ? systemBehaviorGuidelines : ontologySystemBehaviorGuidelines;
    const finalUserPrompt = (userPrompt && userPrompt.trim() !== '') ? userPrompt : ontologyUserPrompt;
    const finalUserInput = (userInput && userInput.trim() !== '') ? userInput : ontologyUserInput || '';
    const finalContextItems = (contextItems && contextItems.trim() !== '') ? contextItems : ontologyExistingContext || '';
    const finalContextOntology = (contextOntology && contextOntology.trim() !== '') ? contextOntology : (ontologyExistingOntology || '');
    const finalContextMetamodel = (contextMetamodel && contextMetamodel.trim() !== '') ? contextMetamodel : (ontologyMetamodelPrompt || '');

    setIsLoading(true);
    setStep(1);
    setActiveTab('suggested-concepts');

    if (!descrString || descrString === '') {
        const msg = `Please generate a Domain Description before generating ontology concepts.`;
        alert(msg);
        setIsLoading(false);
        return msg;
    }

    // Now final prompts are available; if finalUserPrompt is still empty we cannot proceed
    if (!finalSystemPrompt || !finalUserPrompt) {
        console.error("Missing required prompt data:", {
            systemPrompt: !!finalSystemPrompt,
            userPrompt: !!finalUserPrompt,
            userInput: !!finalUserInput,
        });
        const msg = "Required prompt data is missing. Please wait for the prompts to load.";
        alert(msg);
        setIsLoading(false);
        return msg;
    }

    if (debug) console.log("Sending request with data:", {
        aiModelName: "gpt-4o",
        schemaName: 'OntologySchema',
        systemPrompt: finalSystemPrompt?.substring(0, 100) + "...",
        systemBehaviorGuidelines: !!finalSystemBehaviorGuidelines,
        userPrompt: finalUserPrompt?.substring(0, 100) + "...",
        userInput: finalUserInput?.substring(0, 100) + "...",
        contextItems: !!finalContextItems,
        contextOntology: !!finalContextOntology,
        contextMetamodel: !!finalContextMetamodel
    });

    try {
        // Post chat messages for visibility in UI (if addMessage provided)
        try {
            if (addMessage) {
                if (finalSystemPrompt) addMessage({ role: 'system', content: finalSystemPrompt });
                const userContent = `${finalUserPrompt || ''}\n\n${finalUserInput || ''}`.trim();
                if (userContent) addMessage({ role: 'user', content: userContent });
            }
        } catch (msgErr) {
            if (debug) console.warn('addMessage failed', msgErr);
        }

        const res = await fetch("/api/genmodel", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                aiModelName: "gpt-4o",
                schemaName: 'OntologySchema',
                systemPrompt: finalSystemPrompt || "",
                systemBehaviorGuidelines: finalSystemBehaviorGuidelines || "",
                userPrompt: finalUserPrompt || "",
                userInput: finalUserInput || "",
                contextItems: finalContextItems || "",
                contextOntology: finalContextOntology || "",
                contextMetamodel: finalContextMetamodel || ""
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error Response:", {
                status: res.status,
                statusText: res.statusText,
                body: errorText
            });
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let data = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            data += decoder.decode(value, { stream: true });
        }
        // Try to parse JSON; if parse fails, fall back to raw text
        let parsed: any = null;
        try {
            parsed = JSON.parse(data);
        } catch (jsonErr) {
            // Not JSON - construct a fallback
            parsed = { raw: data };
            if (debug) console.warn('Response was not JSON, storing raw text');
        }

        if (debug) console.log("Parsed API Response:", parsed);

        // Normalize shape: look for ontologyData, ontology, or top-level concepts
        const ontologyResult = parsed?.ontologyData || parsed?.ontology || (parsed?.concepts ? parsed : null);

        if (ontologyResult && ((Array.isArray(ontologyResult.concepts) && ontologyResult.concepts.length) || parsed?.raw)) {
            // set suggested data if we have concepts array
            if (ontologyResult.concepts && Array.isArray(ontologyResult.concepts)) {
                // Ensure we're passing a clean, properly structured object
                const cleanOntologyData: OntologyData = {
                    name: ontologyResult.name || '',
                    description: ontologyResult.description || '',
                    presentation: ontologyResult.presentation || '',
                    concepts: ontologyResult.concepts || [],
                    relationships: ontologyResult.relationships || []
                };
                setSuggestedOntologyData(cleanOntologyData);
            }

            // Format assistant message
            const assistantContent = formatOntologyToMarkdown(ontologyResult, parsed?.raw);
            try {
                if (addMessage) addMessage({ role: 'assistant', content: assistantContent });
            } catch (msgErr) {
                if (debug) console.warn('addMessage (assistant) failed', msgErr);
            }

            setIsLoading(false);
            setStep(0);
            // Return a string that callers can render directly
            return assistantContent;
        } else {
            console.error("Parsed data does not contain concepts or concepts is not an array:", parsed);
            setStep(0);
            // also add assistant message indicating failure
            const failureMsg = `AI returned an unexpected response:\n\n${JSON.stringify(parsed).slice(0, 1000)}`;
            try {
                if (addMessage) addMessage({ role: 'assistant', content: failureMsg });
            } catch (msgErr) {
                if (debug) console.warn('addMessage (failure) failed', msgErr);
            }
            return failureMsg;
        }
    } catch (e) {
        console.error("Validation failed:", e instanceof Error ? e.message : e);
        const errMsg = `Error: ${e instanceof Error ? e.message : 'Unknown error occurred'}`;
        alert(errMsg);
        setStep(0);
        return errMsg;
    } finally {
        setIsLoading(false);
    }
}

function formatOntologyToMarkdown(ontology: any, rawText?: string) {
    if (!ontology) {
        return rawText || 'No content returned from AI.';
    }

    // If raw text present and no structured ontology, return raw
    if (!ontology.concepts && rawText) return rawText;

    const parts: string[] = [];
    if (ontology.name) parts.push(`# ${ontology.name}`);
    if (ontology.description) parts.push(`**Description:** ${ontology.description}`);
    if (ontology.presentation) parts.push(ontology.presentation);

    if (Array.isArray(ontology.concepts) && ontology.concepts.length) {
        parts.push('## Concepts');
        ontology.concepts.forEach((c: any) => {
            parts.push(`- **${c.name}**: ${c.description || ''}`);
        });
    }

    if (Array.isArray(ontology.relationships) && ontology.relationships.length) {
        parts.push('## Relationships');
        ontology.relationships.forEach((r: any) => {
            const from = r.source || r.nameFrom || r.from || '';
            const to = r.target || r.nameTo || r.to || '';
            parts.push(`- **${r.name}**: ${r.description || ''} (${from} -> ${to})`);
        });
    }

    return parts.join('\n\n');
}

export default handleOntologyBuilder;
