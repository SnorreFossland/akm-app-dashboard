'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';

import { RootState } from '@/store';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { setCurrentDocument, MarkdownDocument, saveMarkdownDocument } from '@/features/model-universe/modelSlice';
import { documentTemplates } from '@/components/ai-chat/DocumentTemplateSelector';

const EditDocumentModalPage = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);
    const documents = useSelector((state: RootState) => state.modelUniverse?.phData?.documents);

    const [contextContent, setContextContent] = useState('');
    const currentDocument = useSelector((state: RootState) => state.modelUniverse.phData.currentDocument);
    const [previewContent, setPreviewContent] = useState('');
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('markdown');

    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState<'context' | 'document' | null>(null);

    const previousDocumentRef = useRef('');

    const handleSetCurrentDocument = useCallback((content: string) => {
        dispatch(setCurrentDocument(content));
    }, [dispatch]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const storedContext = localStorage.getItem('aiChat_context');
        const storedDocument = localStorage.getItem('currentDocument');

        if (storedContext) {
            setContextContent(storedContext);
        }
        if (storedDocument) {
            dispatch(setCurrentDocument(storedDocument));
            setPreviewContent(storedDocument);
            previousDocumentRef.current = storedDocument;

            // Try to find matching document in library to get name and type
            const matchingDoc = documents?.find(doc => doc.content === storedDocument);
            if (matchingDoc) {
                setDocumentName(matchingDoc.name);
                setDocumentType(matchingDoc.type || 'Markdown');
            }
            // Remove the else block that extracted name from first line
        }
    }, [dispatch, documents]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem('aiChat_context', contextContent);
    }, [contextContent]);

    useEffect(() => {
        const oldValue = previousDocumentRef.current;

        if (oldValue === currentDocument) {
            return;
        }

        previousDocumentRef.current = currentDocument;

        if (typeof window !== 'undefined') {
            localStorage.setItem('currentDocument', currentDocument);
            window.dispatchEvent(new CustomEvent('localStorageChange', {
                detail: {
                    key: 'currentDocument',
                    newValue: currentDocument,
                    oldValue,
                },
            }));
        }
    }, [currentDocument]);

    const openLibraryFor = useCallback((target: 'context' | 'document') => {
        setLibraryTarget(target);
        setIsLibraryOpen(true);
    }, []);

    const closeLibrary = useCallback(() => {
        setIsLibraryOpen(false);
        setLibraryTarget(null);
    }, []);

    const handleLibrarySelect = useCallback((content: string, name?: string, _doc?: MarkdownDocument) => {
        if (libraryTarget === 'context') {
            setContextContent(content);
        } else if (libraryTarget === 'document') {
            dispatch(setCurrentDocument(content));
        }
        closeLibrary();
    }, [closeLibrary, libraryTarget, dispatch]);

    const handlePreviewSaveToLibrary = useCallback(() => {
        const contentToSave = previewContent || currentDocument;

        // Find if we're editing an existing document (by content match)
        const existingDocByContent = documents?.find(doc => doc.content === contentToSave);

        // Check if there's a document with the new name
        const existingDocByName = documents?.find(doc => doc.name === documentName);

        let newDoc: MarkdownDocument;

        if (existingDocByContent) {
            // We're editing an existing document
            if (existingDocByName && existingDocByName.id !== existingDocByContent.id) {
                // Name conflict with a different document
                const shouldReplace = window.confirm(
                    `A different document named "${documentName}" already exists.\n\n` +
                    `Click "OK" to replace that document.\n` +
                    `Click "Cancel" to save as a new document with a timestamp.`
                );

                if (shouldReplace) {
                    // Replace the document with the conflicting name
                    newDoc = {
                        id: existingDocByName.id,
                        name: documentName,
                        type: documentType,
                        content: contentToSave,
                        createdAt: existingDocByName.createdAt,
                        updatedAt: new Date().toISOString(),
                    };
                } else {
                    // Add timestamp to make it unique
                    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                    newDoc = {
                        id: existingDocByContent.id,
                        name: `${documentName} (${timestamp})`,
                        type: documentType,
                        content: contentToSave,
                        createdAt: existingDocByContent.createdAt,
                        updatedAt: new Date().toISOString(),
                    };
                }
            } else {
                // No name conflict, just update the existing document
                newDoc = {
                    id: existingDocByContent.id,
                    name: documentName || 'Untitled Document',
                    type: documentType,
                    content: contentToSave,
                    createdAt: existingDocByContent.createdAt,
                    updatedAt: new Date().toISOString(),
                };
            }
        } else {
            // Creating a new document
            if (existingDocByName) {
                // Name conflict with an existing document
                const shouldReplace = window.confirm(
                    `A document named "${documentName}" already exists.\n\n` +
                    `Click "OK" to replace it.\n` +
                    `Click "Cancel" to create a new document with a timestamp.`
                );

                if (shouldReplace) {
                    newDoc = {
                        id: existingDocByName.id,
                        name: documentName,
                        type: documentType,
                        content: contentToSave,
                        createdAt: existingDocByName.createdAt,
                        updatedAt: new Date().toISOString(),
                    };
                } else {
                    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                    newDoc = {
                        id: Date.now().toString(),
                        name: `${documentName} (${timestamp})`,
                        type: documentType,
                        content: contentToSave,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                }
            } else {
                // No conflicts, create new
                newDoc = {
                    id: Date.now().toString(),
                    name: documentName || 'Untitled Document',
                    type: documentType,
                    content: contentToSave,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            }
        }

        // Save to Redux
        dispatch(saveMarkdownDocument(newDoc));

        // Navigate back to main page
        router.push('/ai-chat');
    }, [documentName, documentType, previewContent, currentDocument, documents, dispatch, router]);

    const leftPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'domain',
                label: 'Domain',
                content: (
                    <div className="h-[calc(100vh-10rem)] overflow-auto px-2 py-2">
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
                        mdContent={contextContent}
                        setMdContent={setContextContent}
                        setIsLibraryOpen={(open) => {
                            if (open) {
                                openLibraryFor('context');
                            } else {
                                closeLibrary();
                            }
                        }}
                        isLibraryOpen={isLibraryOpen && libraryTarget === 'context'}
                        panelType="left"
                    />
                ),
            },
        ],
        defaultTab: domain?.presentation ? 'domain' : 'context',
    }), [contextContent, domain, isLibraryOpen, libraryTarget, closeLibrary, openLibraryFor]);

    const middlePanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'edit',
                label: 'Edit Document',
                content: (
                    <div className="flex flex-col bg-background rounded-lg h-[calc(100vh-9rem)] overflow-hidden">
                        {/* Document metadata header */}
                        <div className="flex gap-4 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                            <div className="flex-1">
                                <label className="block text-[10px] text-gray-400 mb-1">Document Name</label>
                                <input
                                    type="text"
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    placeholder={(() => {
                                        // Only suggest first line as placeholder when name is empty
                                        if (!documentName && currentDocument) {
                                            const firstLine = currentDocument.split('\n')[0] || '';
                                            const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
                                            return cleanName || 'Enter document name...';
                                        }
                                        return 'Enter document name...';
                                    })()}
                                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                                />
                            </div>
                            <div className="w-52">
                                <label className="block text-[10px] text-gray-400 mb-1">Document Type</label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-gray-200"
                                >
                                    {documentTemplates.map((template) => (
                                        <option key={template.type} value={template.type}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-grow overflow-hidden">
                            <DocumentPanel
                                mdContent={currentDocument}
                                setMdContent={handleSetCurrentDocument}
                                setIsLibraryOpen={(open) => {
                                    if (open) {
                                        openLibraryFor('document');
                                    } else {
                                        closeLibrary();
                                    }
                                }}
                                isLibraryOpen={isLibraryOpen && libraryTarget === 'document'}
                                panelType="middle"
                                currentDocumentContent={currentDocument}
                                markdownPreviewContent={previewContent}
                                documentName={documentName}
                                documentType={documentType}
                                startInEditMode
                                onPreview={setPreviewContent}
                                showLibraryButton={false}
                                showSaveButton={false}
                                showApplyButton={false}
                                showDocumentList={false}
                            />
                        </div>
                    </div>
                ),
            },
        ],
        defaultTab: 'edit',
    }), [currentDocument, isLibraryOpen, libraryTarget, previewContent, documentName, documentType, closeLibrary, openLibraryFor, handleSetCurrentDocument]);

    const rightPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <DocumentPanel
                        mdContent={previewContent}
                        setMdContent={setPreviewContent}
                        panelType="right"
                        currentDocumentContent={currentDocument}
                        markdownPreviewContent={previewContent}
                        documentName={documentName}
                        documentType={documentType}
                        onSaveToLibrary={handlePreviewSaveToLibrary}
                    />
                ),
            },
        ],
        defaultTab: 'preview',
    }), [previewContent, currentDocument, documentName, documentType, handlePreviewSaveToLibrary]);

    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden border-[16px] border-orange-800/80 rounded-lg shadow-xl">
            <div className="flex justify-between items-center py-1 px-2 border-b border-orange-900/60 bg-gray-800/90">
                <span className="font-semibold text-orange-400/70">Document Editor</span>
                <span className="text-xs uppercase tracking-wide text-orange-300/70">Focused edit session</span>
                <Link href="/ai-chat" className="p-1 text-orange-400 hover:text-orange-200" aria-label="Close editor">
                    <X className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-900/60">
                <ThreePanelLayout
                    leftPanelContent={leftPanelContent}
                    middlePanelContent={middlePanelContent}
                    rightPanelContent={rightPanelContent}
                    showLeftPanel={showLeftPanel}
                    setShowLeftPanel={setShowLeftPanel}
                    showRightPanel={showRightPanel}
                    setShowRightPanel={setShowRightPanel}
                    className="h-full min-w-0 bg-background text-gray-100"
                >
                    <></>
                </ThreePanelLayout>
            </div>

            {isLibraryOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeLibrary}>
                    <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeLibrary} className="absolute right-4 top-4 text-gray-400 hover:text-white" aria-label="Close library">
                            <X className="h-6 w-6" />
                        </button>
                        <div className="p-6">
                            <MarkdownLibrary
                                onSelect={handleLibrarySelect}
                                hideExportLibraryButton={false}
                                onSetCurrentDocument={(content, _name, _doc) => handleSetCurrentDocument(content)}
                                currentDocument={currentDocument}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditDocumentModalPage;
