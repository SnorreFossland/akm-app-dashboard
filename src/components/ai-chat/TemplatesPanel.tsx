'use client';

import { useState } from 'react';

interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
}

export default function TemplatesPanel({ onApplyTemplate }: TemplatesPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');
    const [templates, setTemplates] = useState([
        { title: "Brainstorming", content: "Brainstorm ideas for the following topic:\n\n[Insert topic here]" },
        { title: "Domain Scoping", content: "Define and scope the following domain/topic:\n\n1. Domain/Topic na\me: [Insert name]\n2. Primary objectives: [Describe main goals]\n3. Key stakeholders: [List stakeholders]\n4. Current limitations/boundaries: [Describe constraints]\n5. Success criteria: [Define what success looks like]" },
        { title: "Project Summary", content: "Summarize the project details for the following project:\n\n[Describe project here]" },
        { title: "Email Template", content: "Draft an email template for the following purpose:\n\n[Describe purpose here]" },
        { title: "Research Questions", content: "Generate research questions for the following topic:\n\n[Insert topic here]" },
        { title: "Project Plan", content: "Create a project plan for the following project:\n\n[Describe project here]" },
        { title: "Research Summary", content: "Summarize the research findings on the following topic:\n\n[Insert topic here]" },
        { title: "Task List", content: "Generate a task list for the following project:\n\n[Describe project here]" },
        { title: "Content Outline", content: "Create an outline for the following content:\n\n[Describe content here]" },
        { title: "Feedback Request", content: "Request feedback on the following topic:\n\n[Describe topic here]" },
        { title: "Meeting Agenda", content: "Create an agenda for the following meeting:\n\n[Describe meeting here]" },
        { title: "SWOT Analysis", content: "Conduct a SWOT analysis for the following topic:\n\n[Insert topic here]" },
        { title: "Marketing Strategy", content: "Develop a marketing strategy for the following product:\n\n[Describe product here]" },
        { title: "User Persona", content: "Create a user persona for the following target audience:\n\n[Describe audience here]" },
        { title: "Competitive Analysis", content: "Analyze the competition for the following product:\n\n[Describe product here]" },
        { title: "Social Media Post", content: "Draft a social media post for the following topic:\n\n[Describe topic here]" },
        { title: "Email Response", content: "Draft a response to the following email:\n\n[Paste email here]" },
        { title: "Presentation Outline", content: "Create an outline for a presentation on the following topic:\n\n[Describe topic here]" },
        { title: "Product Description", content: "Write a product description for the following item:\n\n[Describe item here]" },
        { title: "Blog Post", content: "Write a blog post on the following topic:\n\n[Describe topic here]" },
        { title: "FAQ", content: "Create a FAQ section for the following topic:\n\n[Describe topic here]" },
        { title: "Customer Survey", content: "Draft a customer survey for the following purpose:\n\n[Describe purpose here]" },
        { title: "Press Release", content: "Write a press release for the following event:\n\n[Describe event here]" },
        { title: "Case Study", content: "Create a case study for the following project:\n\n[Describe project here]" },
        { title: "Training Plan", content: "Develop a training plan for the following topic:\n\n[Describe topic here]" },
        { title: "Website Content", content: "Draft website content for the following page:\n\n[Describe page here]" },
        { title: "Sales Pitch", content: "Create a sales pitch for the following product:\n\n[Describe product here]" },
        { title: "Event Planning", content: "Plan an event for the following purpose:\n\n[Describe event here]" },
        { title: "Meeting Notes", content: "Summarize the following meeting notes into key points:\n\n[Paste meeting notes here]" },
        { title: "Email Draft", content: "Draft a professional email for the following purpose:\n\n[Describe purpose here]" },
        { title: "Report Summary", content: "Summarize the following report into a concise overview:\n\n[Paste report content here]" },
        { title: "Proposal Outline", content: "Create an outline for a proposal on the following topic:\n\n[Describe topic here]" },
        { title: "Custom", content: "" },
    ]);
   
    const handleInsertTemplate = () => {
        const templateContent =
            selectedTemplate === templates.length - 1
                ? customTemplate
                : templates[selectedTemplate!].content;
        console.log('26 Inserting template:', templateContent);
        onApplyTemplate(templateContent);
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Templates</h2>
            <div className="h-80 overflow-x-hidden overflow-y-auto pr-2 mb-4">
                <div className="space-y-2">
                    {templates.map((template, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedTemplate(index)}
                            className={`w-full text-left p-2 rounded-md ${selectedTemplate === index ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}
                        >
                            {template.title}
                        </button>
                    ))}
                </div>
            </div>
            {selectedTemplate !== null && (
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">
                        {selectedTemplate === templates.length - 1
                            ? 'Custom Template'
                            : templates[selectedTemplate].title}
                    </h3>
                    <textarea
                        value={
                            selectedTemplate === templates.length - 1
                                ? customTemplate
                                : typeof templates[selectedTemplate!].content === 'string'
                                ? templates[selectedTemplate!].content
                                : JSON.stringify(templates[selectedTemplate!].content)
                        }
                        onChange={(e) => {
                            if (selectedTemplate === templates.length - 1) {
                                setCustomTemplate(e.target.value);
                            } else {
                                const updatedTemplates = [...templates];
                                updatedTemplates[selectedTemplate!] = {
                                    ...updatedTemplates[selectedTemplate!],
                                    content: e.target.value,
                                };
                                setTemplates(updatedTemplates);
                            }
                        }}
                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100"
                        rows={
                            selectedTemplate === templates.length - 1
                                ? Math.max(5, (customTemplate.match(/\n/g) || []).length + 2)
                                : Math.max(5, (templates[selectedTemplate!].content.match(/\n/g) || []).length + 2)
                        }
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


