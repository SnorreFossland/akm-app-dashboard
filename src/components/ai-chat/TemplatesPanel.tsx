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
            category: "Planning",
            title: "Domain/Topic Scoping",
            usage: "Business",
            content:
                `
Help me define and scope the following domain/topic:
Domain Identification:
	•	Domain Name: [Insert concise and specific name]
	•	Domain Description: [Provide a clear, concise summary (2-3 sentences) that captures the essence and significance of the domain.]
Domain scope: 
	•	In-Scope: [Explicitly list the elements, activities, or areas included within the domain.]
	•	Out-of-Scope: [Clearly specify what aspects are explicitly excluded from the domain.]
Key Domain Concepts and Terms
	•	Core Concepts: [List critical concepts fundamental to understanding the domain.]
	•	Relevant Keywords: [Provide key terminologies, acronyms, and types relevant to the domain.]
Primary objectives: [Clearly define the main goals or outcomes this domain aims to achieve]
Key stakeholders:
Identify and categorize stakeholders by their roles or involvement:
	•	Primary Stakeholders: [Directly involved individuals or groups]
	•	Secondary Stakeholders: [Indirectly impacted individuals or groups]
Current limitations and Boundaries:
Outline existing constraints, limitations, and boundaries (technical, organizational, financial, regulatory, or operational)
    •	Constraint/Boundary 1
	•	Constraint/Boundary 2
Success criteria: 
Define clear, measurable, and achievable indicators of success:
	•	[Success Criterion 1] (Measurable)
	•	[Success Criterion 2] (Measurable)
`
        },
        { category: "Brainstorming", title: "Brainstorming Ideas", usage: "Personal", content: "Generate ideas for the following topic:\n\n[Describe topic here]" },
        {
            category: "Planning",
            title: "Project Plan",
            usage: "Business",
            content:
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

## Example:

\`\`\`mermaid
gantt
    title Product Plan
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2025-01-01, 30d
    Task 2 :after a1, 20d
    section Phase 2
    Task 3 :2025-11-01, 12d
\`\`\`

        `},
        {
            category: "Planning",
            title: "Product Roadmap",
            usage: "Business",
            content:
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
## Example:

\`\`\`mermaid
gantt
    title Product Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2025-01-01, 30d
    Task 2 :after a1, 20d
    section Phase 2
    Task 3 :2025-11-01, 12d
\`\`\`
Make sur to include the backticks in the output.
            ` },
        { category: "Learning", title: "Learning Plan", usage: "Personal", content: "Create a learning plan for the following topic:\n\n[Describe topic here]\n\n Add a mermaid gantt diagram." },
        { category: "Feedback", title: "Feedback Request", usage: "Business", content: "Request feedback on the following topic:\n\n[Describe topic here]" },
        { category: "Task Management", title: "Task List", usage: "Personal", content: "Create a task list for the following project:\n\n[Describe project here]" },
        { category: "Meetings", title: "Meeting Agenda", usage: "Business", content: "Create an agenda for the following meeting:\n\n[Describe meeting here]" },
        { category: "Meetings", title: "Meeting Summary", usage: "Business", content: "Summarize the following meeting:\n\n[Describe meeting here]" },
        { category: "Meetings", title: "Meeting Notes", usage: "Business", content: "Summarize the following meeting notes into key points:\n\n[Paste meeting notes here]" },
        { category: "Content Creation", title: "Content Outline", usage: "Business", content: "Create an outline for the following content:\n\n[Describe content here]" },
        { category: "Content Creation", title: "Presentation Slides", usage: "Business", content: "Create a slide deck for the following topic:\n\n[Describe topic here]" },
        { category: "Content Creation", title: "Social Media Post", usage: "Personal", content: "Create a social media post for the following topic:\n\n[Describe topic here]" },
        { category: "Content Creation", title: "Blog Post", usage: "Personal", content: "Write a blog post on the following topic:\n\n[Describe topic here]" },
        { category: "Marketing", title: "Marketing Strategy", usage: "Business", content: "Outline a marketing strategy for the following product:\n\n[Describe product here]" },
        { category: "Marketing", title: "Press Release", usage: "Business", content: "Draft a press release for the following event:\n\n[Describe event here]" },
        { category: "User Research", title: "User Persona", usage: "Business", content: "Create a user persona for the following target audience:\n\n[Describe target audience here]" },
        { category: "User Research", title: "User Journey Map", usage: "Business", content: "Create a user journey map for the following user experience:\n\n[Describe user experience here]" },
        { category: "Analysis", title: "SWOT Analysis", usage: "Business", content: "Conduct a SWOT analysis for the following business:\n\n[Describe business here]" },
        { category: "Analysis", title: "Competitive Analysis", usage: "Business", content: "Conduct a competitive analysis for the following market:\n\n[Describe market here]" },
        { category: "Feedback", title: "Customer Feedback", usage: "Business", content: "Summarize the following customer feedback:\n\n[Paste customer feedback here]" },
        { category: "Communication", title: "Email Response", usage: "Business", content: "Draft a response to the following email:\n\n[Paste email here]" },
        { category: "Communication", title: "Email Draft", usage: "Business", content: "Draft a professional email for the following purpose:\n\n[Describe purpose here]" },
        { category: "Summarization", title: "Research Summary", usage: "Business", content: "Summarize the following research findings:\n\n[Paste research findings here]" },
        { category: "Summarization", title: "Report Summary", usage: "Business", content: "Summarize the following report into a concise overview:\n\n[Paste report content here]" },
        { category: "Documentation", title: "Technical Documentation", usage: "Business", content: "Create technical documentation for the following software:\n\n[Describe software here]" },
        { category: "Documentation", title: "User Guide", usage: "Business", content: "Create a user guide for the following product:\n\n[Describe product here]" },
        { category: "Documentation", title: "FAQ Section", usage: "Business", content: "Create a FAQ section for the following product:\n\n[Describe product here]" },
        { category: "Case Studies", title: "Case Study", usage: "Business", content: "Create a case study for the following project:\n\n[Describe project here]" },
        { category: "Proposals", title: "Business Proposal", usage: "Business", content: "Draft a business proposal for the following project:\n\n[Describe project here]" },
        { category: "Proposals", title: "Grant Application", usage: "Business", content: "Draft a grant application for the following project:\n\n[Describe project here]" },
        { category: "Proposals", title: "Proposal Outline", usage: "Business", content: "Create an outline for a proposal on the following topic:\n\n[Describe topic here]" },
        { category: "Research", title: "Research Paper", usage: "Business", content: "Outline a research paper on the following topic:\n\n[Describe topic here]" },
        { category: "Code Review", title: "Code Review", usage: "Business", content: "Please review the following code and provide feedback:\n\n[Paste code here]" },
        { category: "Custom", title: "Custom", usage: "Personal", content: "" },
    ];
    const isMounted = useRef(true);

    const CATEGORIES = ["All", "Planning", "Brainstorming", "Summarization", "Learning", "Feedback", "Task Management", "Meetings", "Content Creation", "Marketing", "User Research", "Analysis", "Documentation", "Case Studies", "Proposals", "Research", "Communication", "Code Review", "Custom"];

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
You are an expert consultant specializing in the following domain. 
Leverage your extensive knowledge to help comprehensively define and scope the domain clearly and precisely.
If placeholders are present, please replace them with the most relevant information.

${editableContent.trim()} 

Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate
Do not wrap your entire response in triple backticks.
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
        <div className="px-3 h-[92vh] flex flex-col gap-4 overflow-hidden bg-gray-900 text-gray-100 shadow-lg">
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
            <div className="flex h-80 overflow-y-auto" id="templates-container">
                {/* Business Templates Column */}
                <div className="w-1/2 pr-2">
                    <h3 className="text-sm font-semibold mb-2">Business</h3>
                    <div className="flex flex-col gap-2">
                        {filteredTemplates
                            .filter(template => template.usage === "Business")
                            .map((template, index) => {
                                const actualIndex = filteredTemplates.findIndex(t => t === template);
                                return (
                                    <button
                                        key={actualIndex}
                                        onClick={() => handleTemplateSelect(actualIndex)}
                                        className={`w-full text-left p-2 rounded-md ${selectedTemplate === actualIndex
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-100'
                                            }`}
                                    >
                                        {template.title}
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* Personal Templates Column */}
                <div className="w-1/2 pl-2">
                    <h3 className="text-sm font-semibold mb-2">Personal</h3>
                    <div className="flex flex-col gap-2">
                        {filteredTemplates
                            .filter(template => template.usage === "Personal")
                            .map((template, index) => {
                                const actualIndex = filteredTemplates.findIndex(t => t === template);
                                return (
                                    <button
                                        key={actualIndex}
                                        onClick={() => handleTemplateSelect(actualIndex)}
                                        className={`w-full text-left p-2 rounded-md ${selectedTemplate === actualIndex
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-100'
                                            }`}
                                    >
                                        {template.title}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>
            {/* Horizontal Draggable Bar */}
            <div
                className="h-2 bg-gray-700 cursor-row-resize relative my-2"
                onMouseDown={(e) => {
                    const startY = e.clientY;
                    const startHeight = document.querySelector('.overflow-y-auto')?.clientHeight || 0;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaY = moveEvent.clientY - startY;
                        const newHeight = Math.max(100, startHeight + deltaY);
                        const container = document.querySelector('.overflow-y-auto') as HTMLElement;
                        if (container) {
                            container.style.height = `${newHeight}px`;
                        }
                    };

                    const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }}
            >
                <div className="absolute left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-500"></div>
            </div>
            {/* Custom Template Section */}

            <div className="flex-1 overflow-y-auto pt-4 bg-gray-900 border-t border-gray-700">
                <h3 className="text-md font-semibold mb-2">
                    {selectedTemplate === null
                        ? 'Select a template'
                        : selectedTemplate === PROMPT_TEMPLATES.length - 1
                            ? 'Custom Template'
                            : 'Prompt for: ' + filteredTemplates[selectedTemplate]?.title}
                </h3>
                <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 overflow-y-auto"
                    style={{ height: 'calc(100% - 80px)', minHeight: '100px', transition: 'height 0.05s ease' }}
                    placeholder="Edit the content here before inserting..."
                    id="editable-content-textarea"
                />
                <div className="flex gap-4 mt-2">
                    <button
                        onClick={handleGeneratePrompt}
                        className={`bg-gray-600 text-gray-100 px-4 py-2 rounded-md hover:bg-gray-700 ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isRefining}
                    >
                        {isRefining ? 'Generating...' : 'Refine Prompt'}
                    </button>
                    <button
                        onClick={handleInsertTemplate}
                        className="bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Insert into Chat →
                    </button>
                </div>
            </div>

        </div>
    );
}


