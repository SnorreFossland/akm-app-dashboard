/**
 * Document refinement templates for AI processing
 * These templates are used to guide the AI in different document refinement tasks
 */

export const REFINE_TEMPLATES = {
    "Summarize Document": `Please provide a summary of current document.
Highlight any conclusions or recommendations presented in the document.\n\n
`,

    "Elaborate and Expand Document": `Please expand and elaborate the content below while preserving its original meaning and factual accuracy. Produce a single, ready-to-use revised document and a short change-log. Follow these rules:
- Preserve all facts; do not invent new information, but incorporate new facts if available in the additional context. If you must infer something, wrap it in [ASSUMPTION].
- Keep the original tone unless instructed otherwise. If you change tone, state the new tone.
- Improve clarity, flow, logical structure, and completeness. Add details, examples, and transitions where they make the argument easier to follow.
- Break long sections into clear headings and subheadings, and add concise introductory and concluding paragraphs if helpful.
- Keep lists, bullet points, and formatting consistent and readable.
- Output exactly two sections separated by a blank line:
    1) REVISED DOCUMENT: the full revised text only (no commentary inline).
    2) CHANGE SUMMARY: a brief bullet list of the main edits (what you added, reorganized, shortened, or clarified).
- Target expanded length: roughly 1.5× to 2× the original, unless that would require inventing facts.

Please refine the content below accordingly and return the revised document followed by the change summary.
\n\n
`,
    "AI Suggested additional items/facts": `Please suggest and add new items or facts that are relevant to the document.
Ensure that the additions are inserted in appropriate places and are accurate and enhance the overall quality of the content.
Focus on providing value and clarity to the reader by including pertinent information that complements the existing content.
\n\n
`,
    "Add new items/facts suggested by the user": `Please add the following items or facts to the document. 
[user suggestions]
Ensure that the additions are inserted in appropriate places and enhance the overall quality of the content.    
Focus on providing value and clarity to the reader by including pertinent information that complements the existing content.
\n\n
`,

    "Translate Document": `Please translate the content below accurately while preserving the meaning, tone, and format.
Maintain all original paragraph breaks, bullet points, and document structure.
Keep specialized terminology intact or provide appropriate equivalents in the target language.
If you encounter culturally specific references, provide appropriate context or alternatives. 
Target language: [specify language here]\n\n
    `,
    "Check Grammar & Spelling": `Revise the content below. Focus only on correcting grammar, spelling, and punctuation errors in the text below.
Do not alter the content, structure, or meaning of the text.
Just fix linguistic errors and improve readability where necessary.\n\n
`,
    "Concise Refinement": `Please refine the content below to make it more concise and clear.
Focus on removing unnecessary words, simplifying complex sentences, and enhancing readability.  
Ensure the main ideas are preserved and the text flows logically.\n\n
`,
    //     "General Refinement": `Please revise the content below for clarity, style, and grammar.
    // Your task is to improve and refine the text, not to analyze it.
    // Do not use its contents as contextual input for other questions--I want it improved not analyzed:
    // `,
    //     "Technical Documentation": `Transform this content below into professional technical documentation.
    // Improve clarity, use consistent terminology, add proper headings and structure.
    // Make sure explanations are precise and easy to follow for technical readers.
    // `,
    //     "Marketing Copy": `Revise this content below to be more persuasive and engaging marketing copy.
    // Enhance customer benefits, use action-oriented language, create emotional appeal.
    // Make it more concise and impactful for potential customers.
    // `,

};

// For backwards compatibility if needed
export default REFINE_TEMPLATES;