'use client';
import { FileText, BookOpen, Target, List, Code, FileCode } from 'lucide-react';

export interface DocumentTemplate {
    id: string;
    name: string;
    type: string;
    description: string;
    icon: React.ReactNode;
    content: string;
}

export const documentTemplates: DocumentTemplate[] = [
    {
        id: 'blank',
        name: 'Blank Document',
        type: 'markdown',
        description: 'Start with an empty document',
        icon: <FileText className="w-6 h-6" />,
        content: '# New Document\n\nStart writing here...\n'
    },
    {
        id: 'domain',
        name: 'Domain Description',
        type: 'domain',
        description: 'Describe a business or technical domain',
        icon: <BookOpen className="w-6 h-6" />,
        content: `# [Domain Name]

## Overview
[Brief description of the domain]

## Key Concepts
- [Concept 1]
- [Concept 2]
- [Concept 3]

## Boundaries
[What's in scope and out of scope]

## Stakeholders
[Who's involved]
`
    },
    {
        id: 'project',
        name: 'Project Plan',
        type: 'project-plan',
        description: 'Structure for a project plan',
        icon: <Target className="w-6 h-6" />,
        content: `# [Project Name]

## Objective
[What we're trying to achieve]

## Scope
[What's included and excluded]

## Timeline
[Key milestones and deadlines]

## Resources
[People, tools, and budget]

## Risks
[Potential issues and mitigation]
`
    },
    {
        id: 'requirements',
        name: 'Requirements',
        type: 'requirements',
        description: 'Functional and non-functional requirements',
        icon: <List className="w-6 h-6" />,
        content: `# [Project] Requirements

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

## Non-Functional Requirements
- **Performance**: [Requirements]
- **Security**: [Requirements]
- **Scalability**: [Requirements]

## Constraints
[Known limitations]
`
    },
    {
        id: 'ontology',
        name: 'Ontology Notes',
        type: 'ontology',
        description: 'Document concepts and relationships',
        icon: <Code className="w-6 h-6" />,
        content: `# Ontology: [Domain Name]

## Concepts
### [Concept 1]
[Description and properties]

### [Concept 2]
[Description and properties]

## Relationships
- [Concept 1] -> [Relationship] -> [Concept 2]
`
    },
    {
        id: 'technical',
        name: 'Technical Spec',
        type: 'technical',
        description: 'Technical design and architecture',
        icon: <FileCode className="w-6 h-6" />,
        content: `# [System Name] Technical Specification

## Architecture
[High-level design]

## Components
[Key building blocks]

## Interfaces
[APIs and integrations]

## Data Model
[Entities and schemas]

## Technology Stack
[Languages, frameworks, tools]
`
    }
];

interface DocumentTemplateSelectorProps {
    onSelect: (template: DocumentTemplate) => void;
    onClose: () => void;
}

export default function DocumentTemplateSelector({ onSelect, onClose }: DocumentTemplateSelectorProps) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-background rounded-lg p-6 w-[90%] max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-400">Choose Document Template</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl px-3 py-1 rounded hover:bg-gray-700"
                    >
                        ×
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documentTemplates.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template)}
                            className="flex flex-col items-start p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all"
                        >
                            <div className="flex items-center space-x-3 mb-2 text-blue-400">
                                {template.icon}
                                <h3 className="font-semibold text-lg">{template.name}</h3>
                            </div>
                            <p className="text-sm text-gray-400 text-left">{template.description}</p>
                            <span className="mt-2 text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                                {template.type}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
