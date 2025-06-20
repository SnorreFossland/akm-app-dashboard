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
        title: "Add Information Objects",
        category: "Business",
        usage: "Business",
        content: "Add information objects for the following concepts:\n[concepts]."
    },

    {
        title: "Add Information Objects with Views and Tasks",
        category: "Business",
        usage: "Business",
        content: "Add information objects with views and tasks for the following concepts:\n[concepts]."
    },

    {
        title: "Add Information Objects, Views, Tasks and Roles",
        category: "Business",
        usage: "Business",
        content: "Add information objects with views, tasks and roles for the following concepts:\n[concepts]."
    }
];