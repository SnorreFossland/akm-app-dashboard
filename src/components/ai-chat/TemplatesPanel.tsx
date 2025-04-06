'use client';

import { useState } from 'react';

interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
}

export default function TemplatesPanel({ onApplyTemplate }: TemplatesPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');
    const [editableContent, setEditableContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // State for selected category

    const PROMPT_TEMPLATES = [
        { category: "Planning", title: "Domain/Topic Scoping", content: "Help me define and scope the following domain/topic:\n\n1. Domain/Topic name: [Insert name]\n2. Primary objectives: [Describe main goals]\n3. Key stakeholders: [List stakeholders]\n4. Current limitations/boundaries: [Describe constraints]\n5. Success criteria: [Define what success looks like]" },
        { category: "Help", title: "Help", content: "Help" },
        { category: "Planning", title: "Project Plan", content: "Outline a project plan for the following project:\n\n[Describe project here]" },
        { category: "Planning", title: "Product Roadmap", content: "Create a product roadmap for the following product:\n\n[Describe product here]" },
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

    const CATEGORIES = ["All", "Planning", "Brainstorming", "Summarization", "Learning", "Feedback", "Task Management", "Meetings", "Content Creation", "Marketing", "User Research", "Analysis", "Documentation", "Case Studies", "Proposals", "Research", "Communication", "Code Review", "Custom"];

    const filteredTemplates = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.category === selectedCategory);

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
        onApplyTemplate(editableContent);
    };

    return (
        <div className="px-3 h-[90vh] flex flex-col gap-4 overflow-hidden bg-gray-900 text-gray-100 shadow-lg">
            <h2 className="text-lg font-bold">Templates</h2>
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
            {selectedTemplate !== null && (
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">
                        {selectedTemplate === PROMPT_TEMPLATES.length - 1
                            ? 'Custom Template'
                            : filteredTemplates[selectedTemplate].title}
                    </h3>
                    <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
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


