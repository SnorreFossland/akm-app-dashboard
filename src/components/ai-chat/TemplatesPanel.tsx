'use client';

import { useState } from 'react';

interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
}

export default function TemplatesPanel({ onApplyTemplate}: TemplatesPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');

    const PROMPT_TEMPLATES = [
        { title: "Meeting Notes", 
            content: "Summarize the following meeting notes into key points:\n\n[Paste meeting notes here]" },
        { title: "Email Draft", 
            content: "Draft a professional email for the following purpose:\n\n[Describe purpose here]" },
        { title: "Report Summary", 
            content: "Summarize the following report into a concise overview:\n\n[Paste report content here]" },
        { title: "Proposal Outline", 
            content: "Create an outline for a proposal on the following topic:\n\n[Describe topic here]" },
        { title: "Domain/Topic Scoping", 
            content: "Help me define and scope the following domain/topic:\n\n1. Domain/Topic name: [Insert name]\n2. Primary objectives: [Describe main goals]\n3. Key stakeholders: [List stakeholders]\n4. Current limitations/boundaries: [Describe constraints]\n5. Success criteria: [Define what success looks like]" },
        { title: "Custom", content: "" },
    ];

    const handleInsertTemplate = () => {
        const templateContent =
            selectedTemplate === PROMPT_TEMPLATES.length - 1
                ? customTemplate
                : PROMPT_TEMPLATES[selectedTemplate!].content;
        onApplyTemplate(templateContent);
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Templates</h2>
            <div className="space-y-2">
                {PROMPT_TEMPLATES.map((template, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedTemplate(index)}
                        className={`w-full text-left p-2 rounded-md ${selectedTemplate === index ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}
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
                        value={
                            selectedTemplate === PROMPT_TEMPLATES.length - 1
                                ? customTemplate
                                : PROMPT_TEMPLATES[selectedTemplate!].content
                        }
                        onChange={(e) => {
                            if (selectedTemplate === PROMPT_TEMPLATES.length - 1) {
                                setCustomTemplate(e.target.value);
                            } else {
                                // Create a new version of the selected template with updated content
                                const updatedTemplates = [...PROMPT_TEMPLATES];
                                updatedTemplates[selectedTemplate!] = {
                                    ...updatedTemplates[selectedTemplate!],
                                    content: e.target.value
                                };
                                // Update the PROMPT_TEMPLATES array
                                PROMPT_TEMPLATES.splice(0, PROMPT_TEMPLATES.length, ...updatedTemplates);
                            }
                        }}
                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100"
                        rows={
                            selectedTemplate === PROMPT_TEMPLATES.length - 1
                                ? Math.max(5, (customTemplate.match(/\n/g) || []).length + 2)
                                : Math.max(5, (PROMPT_TEMPLATES[selectedTemplate!].content.match(/\n/g) || []).length + 2)
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


