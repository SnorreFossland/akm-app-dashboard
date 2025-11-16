'use client';

import { useEffect, useRef } from 'react';
import matter from 'gray-matter';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { DocumentMetadataHeader } from '@/components/ai-chat/DocumentMetadataHeader';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import type { DomainCategory } from '@/features/model-universe/modelSlice';

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
    domain?: { presentation?: string } | null;
    contextContent?: string;
    setContextContent?: (content: string) => void;
    // New: category state and setter
    documentCategory?: DomainCategory;
    // Allow clearing the category (undefined) when user selects "None"
    setDocumentCategory?: (c?: DomainCategory) => void;
    // Optional setter to allow setting the document id/focus from parsed frontmatter
    setDocumentId?: (id?: string) => void;
    onChatWithDocument?: () => void;
    onClearDocument?: () => void;
    showPreviewPanel?: boolean;
    onTogglePreviewPanel?: () => void;
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
                        panelType="middle"
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
    // Add category props here so the header can render the selector
    documentCategory,
    setDocumentCategory,
    setDocumentId,
    onChatWithDocument,
    onClearDocument,
    showPreviewPanel,
    onTogglePreviewPanel,
}: {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument: string;
    handleSetCurrentDocument: (content: string) => void;
    // New props for category
    documentCategory?: DomainCategory;
    setDocumentCategory?: (c?: DomainCategory) => void;
    setDocumentId?: (id?: string) => void;
    onChatWithDocument?: () => void;
    onClearDocument?: () => void;
    showPreviewPanel?: boolean;
    onTogglePreviewPanel?: () => void;
}) {
    // Parse frontmatter from the current document and map common fields to setters.
    // This effect belongs in the React component so hooks order remains stable.
    const frontmatterAppliedRef = useRef(false);
    const lastAppliedTypeRef = useRef<string | null>(null);

    useEffect(() => {
        // Only apply frontmatter parsing once per mount/content initial load
        if (frontmatterAppliedRef.current) return;
        const md = currentDocument || '';
        if (!md) return;
        try {
            const { data } = matter(md);
            if (!data || typeof data !== 'object') return;

            const fmId = (data.id || data.uuid || data.ID || data.uid) as string | undefined;
            const fmTitle = (data.title || data.name) as string | undefined;
            const fmType = (data.type || data.documentType || data.docType) as string | undefined;
            const fmCategory = (data.category || data.domainCategory || data.documentCategory) as string | undefined;

            if (fmTitle && setDocumentName && fmTitle !== documentName) {
                setDocumentName(String(fmTitle));
            }
            if (fmType && setDocumentType) {
                // Normalize to lower-case token matching the app's document type options
                const normalizedType = String(fmType).trim().toLowerCase();
                // Only set if different (case-insensitive)
                if (normalizedType !== String(documentType || '').trim().toLowerCase()) {
                    setDocumentType(normalizedType);
                }
            }
            if (fmCategory && setDocumentCategory) {
                setDocumentCategory(fmCategory as DomainCategory);
            }
            if (fmId && setDocumentId) {
                setDocumentId(String(fmId));
            }
        } catch (err) {
            // ignore parse errors
            // eslint-disable-next-line no-console
            console.warn('Failed to parse frontmatter in EditModeMiddlePanel', err);
        }
        frontmatterAppliedRef.current = true;
    }, [currentDocument]);

    // If the user changes the documentType in the UI, update the YAML frontmatter in the document
    useEffect(() => {
        // Only write back after frontmatter was initially applied to avoid overwriting user edits
        if (!frontmatterAppliedRef.current) return;
        if (!documentType) return;
        // Avoid repeating the same write
        if (lastAppliedTypeRef.current === documentType) return;

        try {
            const parsed = matter(currentDocument || '');
            const newData = { ...(parsed.data || {}), type: String(documentType).trim().toLowerCase() };
            const newContent = matter.stringify(parsed.content || '', newData);
            if (newContent !== currentDocument) {
                handleSetCurrentDocument(newContent);
                lastAppliedTypeRef.current = documentType;
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to write type to frontmatter', err);
        }
    }, [documentType]);
    return (
        <div className="h-full flex flex-col overflow-hidden border-l-4 border-r-4 border-gray-600/80">
            {/* Document Metadata Header */}
            <DocumentMetadataHeader
                documentName={documentName}
                setDocumentName={setDocumentName}
                documentType={documentType}
                setDocumentType={setDocumentType}
                currentDocument={currentDocument}
                // Pass category props down to the header so the dropdown is visible in the middle panel
                documentCategory={documentCategory}
                setDocumentCategory={setDocumentCategory}
                onChatWithDocument={onChatWithDocument}
                onClearDocument={onClearDocument}
                showPreviewPanel={showPreviewPanel}
                onTogglePreviewPanel={onTogglePreviewPanel}
            />

            {/* Editable textarea */}
            <div className="flex-1 overflow-hidden">
                <textarea
                    value={currentDocument || ''}
                    onChange={(e) => handleSetCurrentDocument(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-gray-200 resize-none focus:outline-none font-mono text-sm"
                    placeholder="Start typing your document here..."
                    spellCheck={false}
                />
            </div>
        </div>
    );
}

EditModeMiddlePanel.displayName = 'EditModeMiddlePanel';

function EditModeRightPanel({
    previewContent,
}: {
    previewContent: string;
}) {
    const displayContent = previewContent || '';

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="border-b border-gray-700 bg-gray-800/40 px-4 py-2">
                <span className="text-xs text-gray-400">
                    Preview
                    {/* {displayContent.length} characters */}
                </span>
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
                // Forward the category state/handler into the middle panel header
                documentCategory={params.documentCategory}
                setDocumentCategory={params.setDocumentCategory}
                setDocumentId={params.setDocumentId}
                onChatWithDocument={params.onChatWithDocument}
                onClearDocument={params.onClearDocument}
                showPreviewPanel={params.showPreviewPanel}
                onTogglePreviewPanel={params.onTogglePreviewPanel}
            />
        ),
        rightPanel: (
            <EditModeRightPanel
                previewContent={params.currentDocument}
            />
        ),
    };
}
