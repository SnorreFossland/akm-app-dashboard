'use client';

import { useState } from 'react';

interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
}

export default function TemplatesPanel({ onApplyTemplate }: TemplatesPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');
    const [editableContent, setEditableContent] = useState(''); // New state for editable content

    const PROMPT_TEMPLATES = [
        {
            title: "Domain/Topic Scoping",
            content: "Help me define and scope the following domain/topic:\n\n1. Domain/Topic name: [Insert name]\n2. Primary objectives: [Describe main goals]\n3. Key stakeholders: [List stakeholders]\n4. Current limitations/boundaries: [Describe constraints]\n5. Success criteria: [Define what success looks like]"
        },
        {
            title: "Brainstorming Ideas",
            content: "Generate ideas for the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Project Plan",
            content: "Outline a project plan for the following project:\n\n[Describe project here]"
        },
        {
            title: "Research Summary",
            content: "Summarize the following research findings:\n\n[Paste research findings here]"
        },
        {
            title: "Learning Plan",
            content: "Create a learning plan for the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Feedback Request",
            content: "Request feedback on the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Task List",
            content: "Create a task list for the following project:\n\n[Describe project here]"
        },
        {
            title: "Meeting Agenda",
            content: "Create an agenda for the following meeting:\n\n[Describe meeting here]"
        },
        {
            title: "Content Outline",
            content: "Create an outline for the following content:\n\n[Describe content here]"
        },
        {
            title: "Presentation Slides",
            content: "Create a slide deck for the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Marketing Strategy",
            content: "Outline a marketing strategy for the following product:\n\n[Describe product here]"
        },
        {
            title: "User Persona",
            content: "Create a user persona for the following target audience:\n\n[Describe target audience here]"
        },
        {
            title: "SWOT Analysis",
            content: "Conduct a SWOT analysis for the following business:\n\n[Describe business here]"
        },
        {
            title: "Competitive Analysis",
            content: "Conduct a competitive analysis for the following market:\n\n[Describe market here]"
        },
        {
            title: "Product Roadmap",
            content: "Create a product roadmap for the following product:\n\n[Describe product here]"
        },
        {
            title: "User Journey Map",
            content: "Create a user journey map for the following user experience:\n\n[Describe user experience here]"
        },
        {
            title: "Customer Feedback",
            content: "Summarize the following customer feedback:\n\n[Paste customer feedback here]"
        },
        {
            title: "Social Media Post",
            content: "Create a social media post for the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Blog Post",
            content: "Write a blog post on the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Email Response",
            content: "Draft a response to the following email:\n\n[Paste email here]"
        },
        {
            title: "Meeting Summary",
            content: "Summarize the following meeting:\n\n[Describe meeting here]"
        },
        {
            title: "Technical Documentation",
            content: "Create technical documentation for the following software:\n\n[Describe software here]"
        },
        {
            title: "User Guide",
            content: "Create a user guide for the following product:\n\n[Describe product here]"
        },
        {
            title: "FAQ Section",
            content: "Create a FAQ section for the following product:\n\n[Describe product here]"
        },
        {
            title: "Press Release",
            content: "Draft a press release for the following event:\n\n[Describe event here]"
        },
        {
            title: "Case Study",
            content: "Create a case study for the following project:\n\n[Describe project here]"
        },
        {
            title: "Business Proposal",
            content: "Draft a business proposal for the following project:\n\n[Describe project here]"
        },
        {
            title: "Grant Application",
            content: "Draft a grant application for the following project:\n\n[Describe project here]"
        },
        {
            title: "Research Paper",
            content: "Outline a research paper on the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Meeting Notes",
            content: "Summarize the following meeting notes into key points:\n\n[Paste meeting notes here]"
        },
        {
            title: "Email Draft",
            content: "Draft a professional email for the following purpose:\n\n[Describe purpose here]"
        },
        {
            title: "Report Summary",
            content: "Summarize the following report into a concise overview:\n\n[Paste report content here]"
        },
        {
            title: "Proposal Outline",
            content: "Create an outline for a proposal on the following topic:\n\n[Describe topic here]"
        },
        {
            title: "Code Review",
            content: "Please review the following code and provide feedback:\n\n[Paste code here]"
        },
        { title: "Custom", content: "" },
    ];

    const handleTemplateSelect = (index: number) => {
        setSelectedTemplate(index);
        if (index === PROMPT_TEMPLATES.length - 1) {
            setEditableContent(customTemplate); // Use custom template content
        } else {
            setEditableContent(PROMPT_TEMPLATES[index].content); // Use selected template content
        }
    };

    const handleInsertTemplate = () => {
        console.log('164 Inserting content:', editableContent); // Debugging log
        onApplyTemplate(editableContent); // Insert the edited content
    };

    return (
        <div className="p-4 h-[90vh] flex flex-col gap-4 overflow-hidden border-l border-gray-700 bg-gray-900 text-gray-100 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Templates</h2>
            <div className="grid grid-cols-2 gap-4 h-100 overflow-y-auto">
                {PROMPT_TEMPLATES.map((template, index) => (
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
            {selectedTemplate !== null && (
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">
                        {selectedTemplate === PROMPT_TEMPLATES.length - 1
                            ? 'Custom Template'
                            : PROMPT_TEMPLATES[selectedTemplate].title}
                    </h3>
                    <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)} // Update editable content
                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100"
                        rows={Math.max(5, (editableContent.match(/\n/g) || []).length + 2)}
                        placeholder="Edit the content here before inserting..."
                    />
                    <button
                        onClick={handleInsertTemplate}
                        className="mt-4 bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Insert into Chat Field
                    </button>
                </div>
            )}
        </div>
    );
}


