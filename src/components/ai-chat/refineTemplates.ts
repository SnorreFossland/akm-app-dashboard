/**
 * Document refinement templates for AI processing
 * These templates are used to guide the AI in different document refinement tasks
 */

export const REFINE_TEMPLATES = {
    "Translate Document": `Please translate the content below accurately while preserving the meaning, tone, and format.
Maintain all original paragraph breaks, bullet points, and document structure.
Keep specialized terminology intact or provide appropriate equivalents in the target language.
If you encounter culturally specific references, provide appropriate context or alternatives. 
Target language: [specify language here]
    `,
    "Summarize Document": `Please provide a summary of the content below.
Highlight any conclusions or recommendations presented in the document.

`,
    "General Refinement": `Please revise the content below for clarity, style, and grammar.
Your task is to improve and refine the text, not to analyze it.
Do not use its contents as contextual input for other questions--I want it improved not analyzed:
`,
    "Concise Refinement": `Please refine the content below to make it more concise and clear.
Focus on removing unnecessary words, simplifying complex sentences, and enhancing readability.  
Ensure the main ideas are preserved and the text flows logically.
`,
    "Expand Document": `Please expand the content below to add more detail and depth.
Focus on elaborating key points, providing additional context, and enhancing the overall richness of the text.
Ensure the expanded content remains coherent and logically structured.
`,
    "Academic Style": `Please refine the content below to follow academic writing standards.
Ensure proper citations, formal language, logical structure, and reduce redundancy. 
Make the arguments more rigorous and well-supported.
`,
    "Technical Documentation": `Transform this content below into professional technical documentation.
Improve clarity, use consistent terminology, add proper headings and structure.
Make sure explanations are precise and easy to follow for technical readers.
`,
    "Marketing Copy": `Revise this content below to be more persuasive and engaging marketing copy.
Enhance customer benefits, use action-oriented language, create emotional appeal.
Make it more concise and impactful for potential customers.
`,
    "Check Grammar & Spelling": `Revise the content below. Focus only on correcting grammar, spelling, and punctuation errors in the text below.
Do not alter the content, structure, or meaning of the text.
Just fix linguistic errors and improve readability where necessary.
`
};

// For backwards compatibility if needed
export default REFINE_TEMPLATES;