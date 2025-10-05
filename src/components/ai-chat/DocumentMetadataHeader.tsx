'use client';

import { documentTemplates } from '@/components/ai-chat/DocumentTemplateSelector';

interface DocumentMetadataHeaderProps {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument?: string;
}

export function DocumentMetadataHeader({
    documentName,
    setDocumentName,
    documentType,
    setDocumentType,
    currentDocument = '',
}: DocumentMetadataHeaderProps) {
    const getPlaceholder = () => {
        if (!documentName && currentDocument) {
            const firstLine = currentDocument.split('\n')[0] || '';
            const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
            return cleanName || 'Enter document name...';
        }
        return 'Enter document name...';
    };

    return (
        <div className="flex gap-4 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <div className="flex-1">
                <label className="block text-[10px] text-gray-400 mb-1">Document Name</label>
                <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                />
            </div>
            <div className="w-52">
                <label className="block text-[10px] text-gray-400 mb-1">Document Type</label>
                <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                >
                    {documentTemplates.map((template) => (
                        <option key={template.type} value={template.type}>
                            {template.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
