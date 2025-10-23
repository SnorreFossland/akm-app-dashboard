'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { RootState } from '@/store';
import { DOMAIN_CATEGORIES, DOCUMENT_TYPES, setDomainCategory, addDomainCategory, DomainCategory } from '@/features/model-universe/modelSlice';

interface DocumentMetadataHeaderProps {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument: string;
    documentCategory?: DomainCategory;
    setDocumentCategory?: (c?: DomainCategory) => void;
}

export function DocumentMetadataHeader({
    documentName,
    setDocumentName,
    documentType,
    setDocumentType,
    currentDocument,
    documentCategory,
    setDocumentCategory,
}: DocumentMetadataHeaderProps) {
    const dispatch = useDispatch();
    const searchParams = useSearchParams();
    const isEditMode = (searchParams?.get?.('mode') ?? '') === 'edit';

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

    // Build category options from store or fallback to runtime defaults
    const storeDomainCategories = DOMAIN_CATEGORIES;
    const categoryOptions = useMemo(() => {
        const source = Array.isArray(storeDomainCategories) && storeDomainCategories.length > 0
            ? storeDomainCategories
            : DOMAIN_CATEGORIES;
        const opts = Array.from(new Set(source.map(s => String(s).trim()).filter(Boolean)));
        if (documentCategory && !opts.some(o => o.toLowerCase() === String(documentCategory).toLowerCase())) {
            opts.unshift(String(documentCategory));
        }
        return opts;
    }, [storeDomainCategories, documentCategory]);

    // Document types: prefer values provided by modelSlice (phData.documentTypes); fall back to legacy list.
    const storeDocumentTypes = DOCUMENT_TYPES
    const documentTypeOptions = useMemo(() => {
        const fallback = [
            'markdown',
            'project-plan',
            'roadmap',
            'domain',
            'prompt',
            'specification',
            'requirements',
        ];
        const source = Array.isArray(storeDocumentTypes) && storeDocumentTypes.length > 0
            ? storeDocumentTypes
            : fallback;
        const opts = Array.from(new Set(source.map(s => String(s).trim()).filter(Boolean)));
        // Ensure current documentType is present so the select displays the frontmatter value
        if (documentType && !opts.some(o => o.toLowerCase() === documentType.toLowerCase())) {
            opts.unshift(documentType);
        }
        return opts;
    }, [storeDocumentTypes]);

    const selectedValue = useMemo(() => {
        if (!documentCategory) return '';
        const match = categoryOptions.find(cat => cat.toLowerCase() === String(documentCategory).toLowerCase());
        return match || String(documentCategory);
    }, [documentCategory, categoryOptions]);

    // Internal fallback state so the selector can remain editable when no parent setter was provided.
    // This is used only when `setDocumentCategory` is not available (we fallback to Edit-mode -> Redux).
    const [internalCategory, setInternalCategory] = useState<string>(selectedValue || '');
    useEffect(() => {
        // Keep internal state aligned when incoming prop/selection changes, but only when we don't have a parent setter.
        if (!setDocumentCategory) {
            setInternalCategory(selectedValue || '');
        }
    }, [selectedValue, setDocumentCategory]);

    const effectiveValue = setDocumentCategory ? selectedValue : internalCategory;

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (setDocumentCategory) {
            // Normal flow: inform parent
            setDocumentCategory(!val ? undefined : (val as DomainCategory));
            return;
        }

        if (isEditMode) {
            // Fallback flow: we are in Edit mode but no parent setter was given.
            // Persist as a domain-default (and register the category) so the app state reflects the change.
            if (val) {
                dispatch(addDomainCategory(val as DomainCategory));
                dispatch(setDomainCategory(val as DomainCategory));
            } else {
                // clear domain category if user chooses (best-effort)
                dispatch(setDomainCategory('' as any));
            }
            setInternalCategory(val);
            return;
        }

        // If neither parent setter nor edit mode, just keep internal display state (should be read-only anyway)
        setInternalCategory(val);
    };

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            {/* Name, Type and Category on the same line */}
            <div className="flex items-start gap-3">
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

                {/* Category placed inline with label above the select */}
                <div className="w-44">
                    <label className="block text-xs text-gray-400 mb-1">Category</label>
                    <select
                        id="meta-category"
                        data-testid="document-metadata-category"
                        value={effectiveValue}
                        onChange={handleCategoryChange}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                        disabled={!setDocumentCategory && !isEditMode}
                    >
                        <option value="">None</option>
                        {categoryOptions.length > 0 ? (
                            categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)
                        ) : (
                            <option value="" disabled>No categories defined</option>
                        )}
                    </select>

                    {/* Compact hint below the control */}
                    {!setDocumentCategory && !isEditMode && (
                        <div className="text-xs text-gray-400 mt-1">Read-only</div>
                    )}
                    {/* {!setDocumentCategory && isEditMode && (
                        <div className="text-xs text-green-400 mt-1">Editable (edit mode)</div>
                    )} */}
                </div>
            </div>

            {/* Character count */}
            <div className="text-xs text-gray-400">
                {currentDocument?.length || 0} characters
            </div>
        </div>
    );
}
