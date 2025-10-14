'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { DOMAIN_CATEGORIES } from '@/features/model-universe/modelSlice';
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
    onSaveToLibrary: () => void;
    domain?: { presentation?: string } | null;
    contextContent?: string;
    setContextContent?: (content: string) => void;
    // New: category state and setter
    documentCategory?: DomainCategory;
    // Allow clearing the category (undefined) when user selects "None"
    setDocumentCategory?: (c?: DomainCategory) => void;
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
    // Add category props here so the header can render the selector
    documentCategory,
    setDocumentCategory,
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
}) {
    return (
        <div className="h-full flex flex-col overflow-hidden border-l-4 border-r-4 border-orange-600/80">
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
    documentName,
    documentType,
    previewContent,
    onSaveToLibrary,
    documentCategory,
    setDocumentCategory,
}: {
    documentName: string;
    documentType: string;
    previewContent: string;
    onSaveToLibrary: () => void;
    documentCategory?: DomainCategory;
    // Accept undefined so the "None" option can clear the category
    setDocumentCategory?: (c?: DomainCategory) => void;
}) {
    const displayContent = previewContent || '';

    // Read categories from the slice (fallback to the runtime defaults exported from the slice)
    const storeDomainCategories = useSelector((state: RootState) => state.modelUniverse.phData.domainCategories);
    const categoryOptions = useMemo(() => {
        const source = Array.isArray(storeDomainCategories) && storeDomainCategories.length > 0
            ? storeDomainCategories
            : DOMAIN_CATEGORIES;

        const opts = Array.from(new Set(source.map(s => String(s).trim()).filter(Boolean)));

        // Ensure the current documentCategory (if any) is present so it appears selected
        if (documentCategory && !opts.some(o => o.toLowerCase() === String(documentCategory).toLowerCase())) {
            opts.unshift(String(documentCategory));
        }
        return opts;
    }, [storeDomainCategories, documentCategory]);

    // Normalize selected value so casing differences don't hide the selection
    const selectedValue = useMemo(() => {
        if (!documentCategory) return '';
        const match = categoryOptions.find(cat => cat.toLowerCase() === String(documentCategory).toLowerCase());
        return match || String(documentCategory);
    }, [documentCategory, categoryOptions]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Document Header with Name and Type */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                <h3 className="text-base font-semibold text-gray-200 truncate">
                    {documentName || 'Untitled Document'}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                    {documentType || 'Markdown'}
                </span>
            </div>

            {/* Category selector — always visible; disabled when no setter provided */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/30 border-b border-gray-700">
                <label htmlFor="category-select" className="text-xs text-gray-400">
                    Category:
                </label>
                <select
                    id="category-select"
                    value={selectedValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!setDocumentCategory) return;
                        if (!val) {
                            setDocumentCategory(undefined);
                            return;
                        }
                        // Prefer exact match, otherwise try case-insensitive, otherwise pass raw value
                        const chosen = categoryOptions.find(cat => cat === val)
                            || categoryOptions.find(cat => cat.toLowerCase() === val.toLowerCase())
                            || val;
                        setDocumentCategory(chosen as DomainCategory);
                    }}
                    className="text-xs bg-gray-900 text-gray-200 rounded px-2 py-1 focus:outline-none"
                    disabled={!setDocumentCategory}
                >
                    <option value="">None</option>
                    {categoryOptions.length > 0 ? (
                        categoryOptions.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))
                    ) : (
                        <option value="" disabled>No categories defined</option>
                    )}
                </select>

                {!setDocumentCategory && (
                    <span className="text-xs text-gray-400 ml-2">Read-only (provide setDocumentCategory to edit)</span>
                )}
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
                // Forward the category state/handler into the middle panel header
                documentCategory={params.documentCategory}
                setDocumentCategory={params.setDocumentCategory}
            />
        ),
        rightPanel: (
            <EditModeRightPanel
                documentName={params.documentName}
                documentType={params.documentType}
                previewContent={params.currentDocument}
                onSaveToLibrary={params.onSaveToLibrary}
                documentCategory={params.documentCategory}
                setDocumentCategory={params.setDocumentCategory}
            />
        ),
    };
}
