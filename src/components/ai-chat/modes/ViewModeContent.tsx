'use client';

import { useMemo } from 'react';
import { BookmarkPlus } from 'lucide-react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ViewModeMiddlePanel } from './ViewModeMiddlePanel';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';
// Update the import path to the correct location of Domain type
import type { DomainData } from '@/features/model-universe/modelSlice';
import { buildLeftPanelTabs } from './sharedPanelBuilders';
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
    chatMdPreview?: string;
    onSavePreviewToLibrary?: (content: string, name?: string, type?: string, options?: { forceNew?: boolean }) => void;
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
    chatMdPreview,
    onSavePreviewToLibrary,
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

    const previewTitle = useMemo(() => {
        if (!chatMdPreview) return 'AI Response';
        const firstLine = chatMdPreview.split('\n')[0]?.replace(/^#+\s*/, '').trim();
        return firstLine || 'AI Response';
    }, [chatMdPreview]);

    if (chatMdPreview) {
        rightTabs.unshift({
            key: 'preview',
            label: 'Preview',
            content: (
                <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-200 truncate">
                                {previewTitle}
                            </h3>
                            <span className="text-xs text-gray-400">AI Response</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/30">
                        <button
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                            onClick={() => onSavePreviewToLibrary?.(chatMdPreview, previewTitle, 'ai-response')}
                            disabled={!onSavePreviewToLibrary}
                            title={onSavePreviewToLibrary ? 'Save preview to library' : 'Saving disabled'}
                        >
                            <BookmarkPlus className="h-3 w-3" />
                            Save to Library
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto px-4 py-4">
                        <MarkdownPreview mdPreview={chatMdPreview} variant="default" />
                    </div>
                </div>
            ),
        });
    }

    const rightPanelContent = {
        tabs: rightTabs,
        defaultTab: chatMdPreview ? 'preview' : 'info',
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
