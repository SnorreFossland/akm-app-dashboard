'use client';

import { useRef, useEffect, useState } from 'react';


interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
    selectedModel: string; // Add selectedModel to props
}
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TemplatesPanel({ onApplyTemplate, selectedModel }: TemplatesPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');
    const [editableContent, setEditableContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // State for selected category
    const [isRefining, setIsRefining] = useState(false); // Loading state for refining
    const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);

    const PROMPT_TEMPLATES = [
        {
            category: "Planning", title: "Domain/Topic Scoping", content:
`
Help me define and scope the following domain/topic:
Domain name: [Insert name]
Domain description: [Insert description]
Domain scope: [Insert scope]
Domain concepts: [List of terms, concepts, types and keywords]
Primary objectives: [Describe main goals]
Key stakeholders: [List stakeholders]
Current limitations/boundaries: [Describe constraints]
Success criteria: [Define what success looks like]
`
        },
        { category: "Help", title: "Help", content: "Help" },
        { category: "Planning", title: "Project Plan", content: 
`Make a project plan for the following project:
[Describe project here]
Include the following sections:
1. Project Overview
2. Scope Domain
3. Key Stakeholders
4. Objectives
5. Timeline (phases and milestones as Mermaid diagram)
6. Resources
7. Risks and Mitigation Strategies
8. Success Criteria
9. Budget
10. Communication Plan
11. Evaluation and Reporting
12. Conclusion
13. Appendix
14. References
15. Glossary of Terms
16. Acknowledgments
17. Additional Notes

Make the Mermaid diagram in the following format:

\`\`\`mermaid
gantt
    title Product Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2023-10-01, 30d
    Task 2 :after a1, 20d
    section Phase 2
    Task 3 :2023-11-01, 12d
\`\`\`

        `},
        { category: "Planning", title: "Product Roadmap", content: 
            `Create a product roadmap for the following product:
[Describe product here]
Include the following sections:
1. Product Vision
2. Goals and Objectives
3. Target Audience
4. Key Features
5. Timeline (phases and milestones as Mermaid diagram)
6. Milestones
7. Dependencies
8. Risks and Mitigation Strategies
9. Success Metrics
10. Communication Plan
11. Evaluation and Reporting
12. Conclusion
13. Appendix
14. References
15. Glossary of Terms
16. Acknowledgments
17. Additional Notes

Make the Mermaid diagram in the following format:
\`\`\`mermaid
gantt
    title Product Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2023-10-01, 30d
    Task 2 :after a1, 20d
    section Phase 2
    Task 3 :2023-11-01, 12d
\`\`\`
            ` },
        { category: "Brainstorming", title: "Brainstorming Ideas", content: "Generate ideas for the following topic:\n\n[Describe topic here]" },
        { category: "Learning", title: "Learning Plan", content: "Create a learning plan for the following topic:\n\n[Describe topic here]" },
        { category: "Feedback", title: "Feedback Request", content: "Request feedback on the following topic:\n\n[Describe topic here]" },
        { category: "Task Management", title: "Task List", content: "Create a task list for the following project:\n\n[Describe project here]" },
        { category: "Meetings", title: "Meeting Agenda", content: "Create an agenda for the following meeting:\n\n[Describe meeting here]" },
        { category: "Meetings", title: "Meeting Summary", content: "Summarize the following meeting:\n\n[Describe meeting here]" },
        { category: "Meetings", title: "Meeting Notes", content: "Summarize the following meeting notes into key points:\n\n[Paste meeting notes here]" },
        { category: "Content Creation", title: "Content Outline", content: "Create an outline for the following content:\n\n[Describe content here]" },
        { category: "Content Creation", title: "Presentation Slides", content: "Create a slide deck for the following topic:\n\n[Describe topic here]" },
        { category: "Content Creation", title: "Social Media Post", content: "Create a social media post for the following topic:\n\n[Describe topic here]" },
        { category: "Content Creation", title: "Blog Post", content: "Write a blog post on the following topic:\n\n[Describe topic here]" },
        { category: "Marketing", title: "Marketing Strategy", content: "Outline a marketing strategy for the following product:\n\n[Describe product here]" },
        { category: "Marketing", title: "Press Release", content: "Draft a press release for the following event:\n\n[Describe event here]" },
        { category: "User Research", title: "User Persona", content: "Create a user persona for the following target audience:\n\n[Describe target audience here]" },
        { category: "User Research", title: "User Journey Map", content: "Create a user journey map for the following user experience:\n\n[Describe user experience here]" },
        { category: "Analysis", title: "SWOT Analysis", content: "Conduct a SWOT analysis for the following business:\n\n[Describe business here]" },
        { category: "Analysis", title: "Competitive Analysis", content: "Conduct a competitive analysis for the following market:\n\n[Describe market here]" },
        { category: "Feedback", title: "Customer Feedback", content: "Summarize the following customer feedback:\n\n[Paste customer feedback here]" },
        { category: "Communication", title: "Email Response", content: "Draft a response to the following email:\n\n[Paste email here]" },
        { category: "Communication", title: "Email Draft", content: "Draft a professional email for the following purpose:\n\n[Describe purpose here]" },
        { category: "Summarization", title: "Research Summary", content: "Summarize the following research findings:\n\n[Paste research findings here]" },
        { category: "Summarization", title: "Report Summary", content: "Summarize the following report into a concise overview:\n\n[Paste report content here]" },
        { category: "Documentation", title: "Technical Documentation", content: "Create technical documentation for the following software:\n\n[Describe software here]" },
        { category: "Documentation", title: "User Guide", content: "Create a user guide for the following product:\n\n[Describe product here]" },
        { category: "Documentation", title: "FAQ Section", content: "Create a FAQ section for the following product:\n\n[Describe product here]" },
        { category: "Case Studies", title: "Case Study", content: "Create a case study for the following project:\n\n[Describe project here]" },
        { category: "Proposals", title: "Business Proposal", content: "Draft a business proposal for the following project:\n\n[Describe project here]" },
        { category: "Proposals", title: "Grant Application", content: "Draft a grant application for the following project:\n\n[Describe project here]" },
        { category: "Proposals", title: "Proposal Outline", content: "Create an outline for a proposal on the following topic:\n\n[Describe topic here]" },
        { category: "Research", title: "Research Paper", content: "Outline a research paper on the following topic:\n\n[Describe topic here]" },
        { category: "Code Review", title: "Code Review", content: "Please review the following code and provide feedback:\n\n[Paste code here]" },
        { category: "Custom", title: "Custom", content: "" },
    ];
    const isMounted = useRef(true);

    const CATEGORIES = ["All", "Help", "Planning", "Brainstorming", "Summarization", "Learning", "Feedback", "Task Management", "Meetings", "Content Creation", "Marketing", "User Research", "Analysis", "Documentation", "Case Studies", "Proposals", "Research", "Communication", "Code Review", "Custom"];

    const filteredTemplates = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.category === selectedCategory);


    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleTemplateSelect = (index: number) => {
        setSelectedTemplate(index);
        if (index === PROMPT_TEMPLATES.length - 1) {
            setEditableContent(customTemplate);
        } else {
            setEditableContent(filteredTemplates[index].content);
        }
    };

    const handleInsertTemplate = () => {
        console.log('Inserting content:', editableContent);
        const trimmedContent = `
You are a domain expert in the following area: ${editableContent.trim()} 
Make the output in Markdown.
`;
        onApplyTemplate(trimmedContent);
    };

    // const handleRefinePrompt = async () => {
    //     setIsRefining(true); // Set loading state

    //     try {
    //         // In a real implementation, you would call an API to refine the prompt
    //         // For now, we're simulating a refined result after a delay
    //         const systemPrompt = "You are a prompt expert and you will refine the user prompt. If placeholders are present, please replace them with the most relevant information.";

    //         // This is where you would call your API
    //         // const refinedContent = await yourApiCall(editableContent);

    //         // For demonstration, just adding a prefix after a simulated delay
    //         await new Promise(resolve => setTimeout(resolve, 1000));
    //         const refinedContent = `${systemPrompt} \n\n${editableContent}`;

    //         // Update the field directly
    //         setEditableContent(refinedContent);
    //     } catch (error) {
    //         console.error("Error refining prompt:", error);
    //     } finally {
    //         setIsRefining(false); // Reset loading state
    //     }
    // };

    const handleGeneratePrompt = async () => {
        setIsRefining(true); // Set loading state
        const systemPrompt: Message = {
            role: 'assistant',
            content: `
You are a prompt refinement expert. Your task is to take the user's input and transform it into the most effective and complete prompt possible for an AI system. 
Your output must strictly be a refined prompt, not a response or result to the user's input.

# Instructions:
1. Analyze the user's input to understand the context, objectives, and requirements.
2. Identify any missing details or placeholders and replace them with relevant suggestions or examples.
3. Ensure the refined prompt is clear, concise, and actionable.
4. Use Markdown formatting for the output.

# Example:
**User Input:** "Help me write a blog post about AI."
**Refined Prompt:** "Write a detailed blog post about the advancements in artificial intelligence, focusing on recent breakthroughs, applications in various industries, and potential future trends. Include examples and references to credible sources."

Now, refine the following user input into an exceptional prompt:
`
        };
        const userMessage: Message = { role: 'user', content: editableContent };
        const model = selectedModel || 'gpt-4'; // Default to 'gpt-4' if no model is selected

        try {
            if (!editableContent || typeof editableContent !== 'string') {
                throw new Error('Invalid editableContent');
            }

            console.log("Generating prompt with content:", editableContent);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [systemPrompt, userMessage],
                    model: model
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error && errorData.error.code === 'model_not_found') {
                    alert('The selected AI model is not available. Please choose a different model.');
                }
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();

            console.log("Response from server:", data.message);

            if (data && data.message) {
                if (isMounted.current) {
                    setEditableContent(data.message);
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error generating prompt:", error);
        } finally {
            if (isMounted.current) {
                setIsRefining(false); // Reset loading state
            }
        }
    };

    return (
        <div className="px-3 h-[90vh] flex flex-col gap-4 overflow-hidden bg-gray-900 text-gray-100 shadow-lg">
            <h2 className="text-lg font-bold">Prompt Templates</h2>
            <div className="">
                <label htmlFor="category" className="block text-sm font-medium mb-2">Filter by Category:</label>
                <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100"
                >
                    {CATEGORIES.map((category, index) => (
                        <option key={index} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4 h-100 overflow-y-auto">
                {filteredTemplates.map((template, index) => (
                    <button
                        key={index}
                        onClick={() => handleTemplateSelect(index)}
                        className={`w-full text-left p-2 rounded-md ${selectedTemplate === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                            }`}
                    >
                        {template.title}
                    </button>
                ))}
            </div>
            { (
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">
                        {selectedTemplate === null
                            ? 'Select a template'
                            : selectedTemplate === PROMPT_TEMPLATES.length - 1
                                ? 'Custom Template'
                                : 'Prompt for: '+filteredTemplates[selectedTemplate]?.title}
                    </h3>
                    <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 overflow-y-auto"
                        rows={Math.min(10, Math.max(22, (editableContent.match(/\n/g) || []).length + 2))}
                        placeholder="Edit the content here before inserting..."
                        style={{ maxHeight: '30vh' }}
                    />
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={handleInsertTemplate}
                            className="bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            ← Insert into Chat 
                        </button>
                        {/* <button
                            onClick={handleRefinePrompt}
                            className={`bg-green-600 text-gray-100 px-4 py-2 rounded-md hover:bg-green-700 ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isRefining}
                        >
                            {isRefining ? 'Refining...' : 'Refine with AI'}
                        </button> */}
                        <button
                            onClick={handleGeneratePrompt}
                            className={`bg-purple-600 text-gray-100 px-4 py-2 rounded-md hover:bg-purple-700 ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isRefining}
                        >
                            {isRefining ? 'Generating...' : 'Enhance Prompt'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


