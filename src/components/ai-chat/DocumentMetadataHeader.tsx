'use client';

import React, { useEffect, useState } from 'react';

interface DocumentMetadataHeaderProps {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument: string;
}

// Document type options - shared with MarkdownLibrary
const documentTypeOptions = [
    'markdown',
    'project-plan',
    'roadmap',
    'domain',
    'prompt',
    'specification',
    'requirements',
];

export function DocumentMetadataHeader({
    documentName,
    setDocumentName,
    documentType,
    setDocumentType,
    currentDocument,
}: DocumentMetadataHeaderProps) {
    const [hasUserSetName, setHasUserSetName] = useState(Boolean(documentName));

    // Auto-populate document name when empty and not set by user
    useEffect(() => {
        if (hasUserSetName) return;

        if (!documentName && currentDocument) {
            const firstLine = currentDocument.split('\n')[0].trim();
            const stripped = firstLine.replace(/^#+\s*/, '').trim();
            if (stripped) {
                setDocumentName(stripped);
            }
        }
    }, [currentDocument, documentName, hasUserSetName, setDocumentName]);

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            {/* Name and Type on same line */}
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <label className="block text-xs text-gray-400 mb-1">Document Name</label>
                    <input
                        type="text"
                        value={documentName}
                        onChange={(e) => {
                            setHasUserSetName(true);
                            setDocumentName(e.target.value);
                        }}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                        placeholder="Document name (auto-filled from first line)"
                    />
                </div>
                <div className="w-48">
                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                    <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                    >
                        {documentTypeOptions.map((type) => (
                            <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Character count */}
            <div className="text-xs text-gray-400">
                {currentDocument?.length || 0} characters
            </div>
        </div>
    );
}
