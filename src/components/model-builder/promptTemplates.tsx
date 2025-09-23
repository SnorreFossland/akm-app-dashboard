//Define the prompt templates for the IRTV Builder component
export interface PromptTemplate {
    title: string;
    category: string;
    usage: "Personal" | "Business" | string;
    content: string;
}
// Export the templates array
export const PROMPT_TEMPLATES: PromptTemplate[] = [

    {
        title: "Add Object types",
        category: "Business",
        usage: "Business",
        content: "Add object types:"
    }
];