'use client';

import { useState } from 'react';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ViewModeMiddlePanel } from './ViewModeMiddlePanel';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';
// Update the import path to the correct location of Domain type
import type { DomainData } from '@/features/model-universe/modelSlice';
import { buildLeftPanelTabs } from './sharedPanelBuilders';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
// If Domain is not exported from modelSlice, update to the correct file where Domain is defined.

const debug = false
interface ViewModeContentProps {
    domain: DomainData | null;
    currentDocument: string;
    selectedDocument?: MarkdownDocument;
    onSelectDocument: (doc: MarkdownDocument) => void;
    onEditDocument: () => void;
    onChatWithDocument: () => void;
    onClearCurrentDocument?: () => void;
    previewContent?: string;
    projectDocument?: MarkdownDocument | null;
    onCreateDocumentFromTemplate?: () => void;
    additionalContext: string;
    setAdditionalContext: (content: string) => void;
}

export function ViewModeContent({
    domain,
    currentDocument,
    selectedDocument,
    onSelectDocument,
    onEditDocument,
    onChatWithDocument,
    onClearCurrentDocument,
    previewContent,
    projectDocument,
    onCreateDocumentFromTemplate,
    additionalContext,
    setAdditionalContext,
}: ViewModeContentProps) {
    // Debug logging
    if (debug) console.log('ViewModeContent render:', {
        hasCurrentDocument: !!currentDocument,
        currentDocumentLength: currentDocument?.length,
        hasSelectedDocument: !!selectedDocument,
        selectedDocumentName: selectedDocument?.name
    });

    // Use centralized left-panel builder for consistency across modes.
    const leftPanelContent = buildLeftPanelTabs({
        domain,
        projectDocument,
        currentDocument,
        onSelectDocument,
        onCreateDocumentFromTemplate,
        includeLibrary: false,
        includeAdditional: true,
        additionalContext,
        setAdditionalContext,
    });

    // State for library panel
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState<string | null>(null);

    const openLibraryFor = (target: string) => {
        setLibraryTarget(target);
        setIsLibraryOpen(true);
    };

    const closeLibrary = () => {
        setIsLibraryOpen(false);
        setLibraryTarget(null);
    };

    // Create middle panel content - wrap in a div to ensure it renders
    const middlePanelContent = {
        tabs: [
            {
                key: 'current',
                label: 'Current Document',
                content: (
                    <ViewModeMiddlePanel
                        currentDocument={currentDocument}
                        document={selectedDocument}
                        onEdit={onEditDocument}
                        onChatWithDoc={onChatWithDocument}
                        onDelete={onClearCurrentDocument}
                    />
                ),
            },
            {
                key: 'library',
                label: 'Library',
                content: (
                    <div className="h-full overflow-auto px-2 py-2">
                        <MarkdownLibrary
                            onSelect={(_content, _name, doc) => {
                                if (doc) onSelectDocument(doc);
                            }}
                            hideExportLibraryButton={false}
                            onSetAdditionalContext={setAdditionalContext}
                            currentDocument={currentDocument}
                            onCreateFromTemplate={onCreateDocumentFromTemplate}
                        />
                    </div>
                ),
            },
        ],
        defaultTab: 'current',
    };

    if (debug) console.log('middlePanelContent created:', middlePanelContent);

    const rightTabs = [
        {
            key: 'info',
            label: 'Document Info',
            content: (
                <div className="h-full overflow-auto px-4 py-4">
                    {(selectedDocument || currentDocument) ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Metadata</h3>
                                <dl className="space-y-2 text-sm">
                                    <div>
                                        <dt className="text-gray-400">Name:</dt>
                                        <dd className="text-gray-200">{selectedDocument?.name || 'Current Document'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400">Type:</dt>
                                        <dd className="text-gray-200">{selectedDocument?.type || 'Markdown'}</dd>
                                    </div>
                                    {selectedDocument?.createdAt && (
                                        <div>
                                            <dt className="text-gray-400">Created:</dt>
                                            <dd className="text-gray-200">
                                                {new Date(selectedDocument.createdAt).toLocaleString()}
                                            </dd>
                                        </div>
                                    )}
                                    {selectedDocument?.updatedAt && (
                                        <div>
                                            <dt className="text-gray-400">Updated:</dt>
                                            <dd className="text-gray-200">
                                                {new Date(selectedDocument.updatedAt).toLocaleString()}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Statistics</h3>
                                <dl className="space-y-2 text-sm">
                                    <div>
                                        <dt className="text-gray-400">Characters:</dt>
                                        <dd className="text-gray-200">
                                            {(selectedDocument?.content || currentDocument).length.toLocaleString()}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400">Words:</dt>
                                        <dd className="text-gray-200">
                                            {(selectedDocument?.content || currentDocument).split(/\s+/).filter(Boolean).length.toLocaleString()}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-400">Lines:</dt>
                                        <dd className="text-gray-200">
                                            {(selectedDocument?.content || currentDocument).split('\n').length.toLocaleString()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400">No document to display</div>
                    )}
                </div>
            ),
        },
    ];

    const rightPanelContent = {
        tabs: rightTabs,
        defaultTab: 'info',
    };

    const result = {
        leftPanelContent,
        middlePanelContent,
        rightPanelContent,
    };

    if (debug) console.log('ViewModeContent returning:', {
        hasLeftPanel: !!result.leftPanelContent,
        hasMiddlePanel: !!result.middlePanelContent,
        hasRightPanel: !!result.rightPanelContent,
    });

    return result;
}
