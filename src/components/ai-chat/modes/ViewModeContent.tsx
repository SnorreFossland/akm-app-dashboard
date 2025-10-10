'use client';

import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ViewModeMiddlePanel } from './ViewModeMiddlePanel';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';
// Update the import path to the correct location of Domain type
import type { DomainData } from '@/features/model-universe/modelSlice';
// If Domain is not exported from modelSlice, update to the correct file where Domain is defined.

const debug = false
interface ViewModeContentProps {
    domain: DomainData | null;
    currentDocument: string;
    selectedDocument?: MarkdownDocument;
    onSelectDocument: (doc: MarkdownDocument) => void;
    onEditDocument: () => void;
    onChatWithDocument: () => void;
    onDeleteDocument?: () => void;
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
    onDeleteDocument,
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
                key: 'projects',
                label: 'Focus Project',
                content: (
                    <div className="h-full flex flex-col overflow-hidden">
                        {projectDocument ? (
                            <>
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-200 truncate">
                                            {projectDocument.name}
                                        </h3>
                                        <span className="text-xs text-gray-400">
                                            {projectDocument.type || 'Project'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto px-4 py-4">
                                    {projectDocument.content ? (
                                        <MarkdownPreview
                                            mdPreview={projectDocument.content}
                                            variant="compact"
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-400">No content available</div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center px-4 py-4">
                                <div className="text-center text-gray-400">
                                    <p className="text-sm">No focus project set</p>
                                    <p className="text-xs mt-2">Click "Focus" on a project in the Library to set it</p>
                                </div>
                            </div>
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
                            onCreateFromTemplate={onCreateDocumentFromTemplate}
                        />
                    </div>
                ),
            },
        ],
        defaultTab: 'library', // Make sure this matches a tab key
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
                        onDelete={onDeleteDocument}
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
