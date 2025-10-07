'use client';

import { useEffect, useState } from 'react';
import { DocumentMetadataHeader } from '@/components/ai-chat/DocumentMetadataHeader';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import { Button } from '@/components/ui/button';
import TextareaAutosize from 'react-textarea-autosize';

interface EditModeContentProps {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument: string;
    handleSetCurrentDocument: (content: string) => void;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
    previewContent: string;
    setPreviewContent: (content: string) => void;
    onSaveToLibrary: () => void;
    domain?: { presentation?: string } | null;
    contextContent?: string;
    setContextContent?: (content: string) => void;
}

function EditModeLeftPanel({
    domain,
    contextContent,
    setContextContent,
    isLibraryOpen,
    libraryTarget,
    openLibraryFor,
    closeLibrary,
}: {
    domain?: { presentation?: string } | null;
    contextContent?: string;
    setContextContent?: (content: string) => void;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
}) {
    return {
        tabs: [
            {
                key: 'domain',
                label: 'Domain',
                content: (
                    <div className="h-full overflow-auto px-2 py-2">
                        {domain?.presentation ? (
                            <MarkdownPreview mdPreview={domain.presentation} variant="compact" />
                        ) : (
                            <div className="text-sm text-gray-400">No domain presentation available.</div>
                        )}
                    </div>
                ),
            },
            {
                key: 'context',
                label: 'Context Docs',
                content: (
                    <DocumentPanel
                        mdContent={contextContent || ''}
                        setMdContent={setContextContent || (() => { })}
                        setIsLibraryOpen={(open) => {
                            if (open) openLibraryFor('context');
                            else closeLibrary();
                        }}
                        isLibraryOpen={isLibraryOpen && libraryTarget === 'context'}
                        panelType="left"
                    />
                ),
            },
        ],
        defaultTab: domain?.presentation ? 'domain' : 'context',
    };
}

function EditModeMiddlePanel({
    documentName,
    setDocumentName,
    documentType,
    setDocumentType,
    currentDocument,
    handleSetCurrentDocument,
}: {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument: string;
    handleSetCurrentDocument: (content: string) => void;
}) {
    return (
        <div className="h-full flex flex-col overflow-hidden border-l-4 border-r-4 border-orange-600">
            {/* Document Metadata Header */}
            <DocumentMetadataHeader
                documentName={documentName}
                setDocumentName={setDocumentName}
                documentType={documentType}
                setDocumentType={setDocumentType}
                currentDocument={currentDocument}
            />

            {/* Editable textarea */}
            <div className="flex-1 overflow-hidden">
                <TextareaAutosize
                    value={currentDocument || ''}
                    onChange={(e) => handleSetCurrentDocument(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-gray-200 resize-none focus:outline-none font-mono text-sm"
                    placeholder="Start typing your document here..."
                    minRows={10}
                />
            </div>
        </div>
    );
}

EditModeMiddlePanel.displayName = 'EditModeMiddlePanel';

function EditModeRightPanel({
    documentName,
    documentType,
    previewContent,
    onSaveToLibrary,
}: {
    documentName: string;
    documentType: string;
    previewContent: string;
    onSaveToLibrary: () => void;
}) {
    const displayContent = previewContent || '';

    return (
        <div className="h-full flex flex-col overflow-hidden border-l-4 border-orange-600">
            {/* Document Header with Name and Type */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-gray-200">
                        {documentName || 'Untitled Document'}
                    </h3>
                    <span className="text-xs text-gray-400">
                        {documentType || 'Markdown'}
                    </span>
                </div>
            </div>

            {/* Character count and save button */}
            <div className="border-b border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800/30">
                    <span className="text-xs text-gray-400">
                        {displayContent.length} characters
                    </span>
                    <button
                        onClick={onSaveToLibrary}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                    >
                        Save to Library
                    </button>
                </div>
            </div>

            {/* Preview content - key prop forces re-render when content changes */}
            <div key={displayContent.length} className="flex-1 overflow-auto px-4 py-4">
                <MarkdownPreview mdPreview={displayContent} variant="default" />
            </div>
        </div>
    );
}

EditModeRightPanel.displayName = 'EditModeRightPanel';

export function EditModeContent(params: EditModeContentProps) {
    const editLeftPanel = EditModeLeftPanel({
        domain: params.domain,
        contextContent: params.contextContent,
        setContextContent: params.setContextContent,
        isLibraryOpen: params.isLibraryOpen,
        libraryTarget: params.libraryTarget,
        openLibraryFor: params.openLibraryFor,
        closeLibrary: params.closeLibrary,
    });

    return {
        leftPanel: editLeftPanel,
        middlePanel: (
            <EditModeMiddlePanel
                documentName={params.documentName}
                setDocumentName={params.setDocumentName}
                documentType={params.documentType}
                setDocumentType={params.setDocumentType}
                currentDocument={params.currentDocument}
                handleSetCurrentDocument={params.handleSetCurrentDocument}
            />
        ),
        rightPanel: (
            <EditModeRightPanel
                documentName={params.documentName}
                documentType={params.documentType}
                previewContent={params.currentDocument}
                onSaveToLibrary={params.onSaveToLibrary}
            />
        ),
    };
}
