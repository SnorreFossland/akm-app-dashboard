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
        title: "Add Information Objects (Concepts, Terms, etc.)",
        category: "Business",
        usage: "Business",
        content: "Generate Information Objects (IOs) that represent concepts, terms, or other relevant entities in the IRTV model. Each IO should include a unique identifier, a name, and a description. Ensure that the IOs are well-defined and relevant to the context of the IRTV model."
    }
];