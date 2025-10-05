'use client';

import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ViewModeMiddlePanel } from './ViewModeMiddlePanel';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';
// Update the import path to the correct location of Domain type
import type { Domain } from '@/features/model-universe/modelSlice';
// If Domain is not exported from modelSlice, update to the correct file where Domain is defined.

interface ViewModeContentProps {
    domain: Domain | null;
    currentDocument: string;
    selectedDocument?: MarkdownDocument;
    onSelectDocument: (doc: MarkdownDocument) => void;
    onEditDocument: () => void;
    onChatWithDocument: () => void;
    onDeleteDocument?: () => void;
    previewContent?: string;
}

export function ViewModeContent({
    domain,
    currentDocument,
    selectedDocument,
    onSelectDocument,
    onEditDocument,
    onChatWithDocument,
    onDeleteDocument,
    previewContent,
}: ViewModeContentProps) {
    // Debug logging
    console.log('ViewModeContent render:', {
        hasCurrentDocument: !!currentDocument,
        currentDocumentLength: currentDocument?.length,
        hasSelectedDocument: !!selectedDocument,
        selectedDocumentName: selectedDocument?.name
    });

    const leftPanelContent = {
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
                key: 'library',
                label: 'Library',
                content: (
                    <div className="h-full overflow-auto">
                        <MarkdownLibrary
                            onSelect={(content, name, doc) => {
                                if (doc) onSelectDocument(doc);
                            }}
                            hideExportLibraryButton={false}
                            onSetCurrentDocument={(content, name, doc) => {
                                if (doc) onSelectDocument(doc);
                            }}
                            currentDocument={currentDocument}
                        />
                    </div>
                ),
            },
        ],
        defaultTab: 'domain',
    };

    // Create middle panel content - wrap in a div to ensure it renders
    const middlePanelContent = (
        <div className="h-full w-full">
            <ViewModeMiddlePanel
                currentDocument={currentDocument}
                document={selectedDocument}
                onEdit={onEditDocument}
                onChatWithDoc={onChatWithDocument}
                onDelete={onDeleteDocument}
            />
        </div>
    );

    console.log('middlePanelContent created:', middlePanelContent);

    const rightPanelContent = {
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        {previewContent ? (
                            <>
                                <div className="mb-4 pb-2 border-b border-gray-700">
                                    <span className="text-xs text-gray-400">Preview of unsaved changes</span>
                                </div>
                                <MarkdownPreview mdPreview={previewContent} variant="default" />
                            </>
                        ) : (
                            <div className="text-sm text-gray-400">
                                No preview available. Edit a document to see preview here.
                            </div>
                        )}
                    </div>
                ),
            },
            {
                key: 'info',
                label: 'Document Info',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        {selectedDocument ? (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Metadata</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div>
                                            <dt className="text-gray-400">Name:</dt>
                                            <dd className="text-gray-200">{selectedDocument.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-400">Type:</dt>
                                            <dd className="text-gray-200">{selectedDocument.type || 'Markdown'}</dd>
                                        </div>
                                        {selectedDocument.createdAt && (
                                            <div>
                                                <dt className="text-gray-400">Created:</dt>
                                                <dd className="text-gray-200">
                                                    {new Date(selectedDocument.createdAt).toLocaleString()}
                                                </dd>
                                            </div>
                                        )}
                                        {selectedDocument.updatedAt && (
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
                                            <dd className="text-gray-200">{selectedDocument.content.length.toLocaleString()}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-400">Words:</dt>
                                            <dd className="text-gray-200">
                                                {selectedDocument.content.split(/\s+/).filter(Boolean).length.toLocaleString()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-400">Lines:</dt>
                                            <dd className="text-gray-200">
                                                {selectedDocument.content.split('\n').length.toLocaleString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400">Select a document to view information</div>
                        )}
                    </div>
                ),
            },
        ],
        defaultTab: 'info',
    };

    const result = {
        leftPanelContent,
        middlePanelContent,
        rightPanelContent,
    };

    console.log('ViewModeContent returning:', {
        hasLeftPanel: !!result.leftPanelContent,
        hasMiddlePanel: !!result.middlePanelContent,
        hasRightPanel: !!result.rightPanelContent,
    });

    return result;
}
