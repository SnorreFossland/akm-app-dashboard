'use client';

import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
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
        includeLibrary: true,
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
        ],
        defaultTab: 'current',
    };

    if (debug) console.log('middlePanelContent created:', middlePanelContent);

    const rightPanelContent = {
        tabs: [
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
        ],
        defaultTab: 'info', // Make sure this matches a tab key
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
