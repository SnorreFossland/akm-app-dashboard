'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';

import { RootState } from '@/store';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';

const DomainEditPage = () => {
    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);

    const [contextContent, setContextContent] = useState('');
    const [currentDocument, setCurrentDocument] = useState('');
    const [previewContent, setPreviewContent] = useState('');

    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState<'context' | 'document' | null>(null);

    const previousDocumentRef = useRef('');

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const storedContext = localStorage.getItem('domainBuilder_context');
        const storedDocument = localStorage.getItem('currentDocument');

        if (storedContext) {
            setContextContent(storedContext);
        }
        if (storedDocument) {
            setCurrentDocument(storedDocument);
            setPreviewContent(storedDocument);
            previousDocumentRef.current = storedDocument;
        } else if (domain?.presentation) {
            setCurrentDocument(domain.presentation);
            setPreviewContent(domain.presentation);
            previousDocumentRef.current = domain.presentation;
        }
    }, [domain?.presentation]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem('domainBuilder_context', contextContent);
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

    const handleLibrarySelect = useCallback((content: string, name?: string) => {
        if (libraryTarget === 'context') {
            setContextContent(content);
        } else if (libraryTarget === 'document') {
            setCurrentDocument(content);
            setPreviewContent(content);
        }
        closeLibrary();
    }, [closeLibrary, libraryTarget]);

    const handleNavigateBack = useCallback(() => {
        setIsLibraryOpen(false);
        setLibraryTarget(null);
    }, []);

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
    }), [contextContent, domain?.presentation, isLibraryOpen, libraryTarget, closeLibrary, openLibraryFor]);

    const middlePanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'edit',
                label: 'Edit Domain Presentation',
                content: (
                    <div className="flex flex-col bg-background rounded-lg h-[calc(100vh-9rem)] overflow-hidden">
                        <div className="flex-grow overflow-hidden">
                            <DocumentPanel
                                mdContent={currentDocument}
                                setMdContent={setCurrentDocument}
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
                                startInEditMode
                            />
                        </div>
                    </div>
                ),
            },
        ],
        defaultTab: 'edit',
    }), [closeLibrary, currentDocument, isLibraryOpen, libraryTarget, openLibraryFor, previewContent]);

    const rightPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <div className="h-[calc(100vh-9rem)] overflow-auto px-2 py-2">
                        <MarkdownPreview mdPreview={currentDocument || 'Nothing to preview yet!'} />
                    </div>
                ),
            },
        ],
        defaultTab: 'preview',
    }), [currentDocument]);

    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden border-[16px] border-blue-800/80 rounded-lg shadow-xl">
            <div className="flex justify-between items-center py-1 px-2 border-b border-gray-700 bg-gray-800/90">
                <span className="font-bold text-blue-500/60">Edit mode</span>
                <span className="font-medium font-bold text-blue-400/60">Domain Presentation Editor</span>
                <Link href="/domain-builder" className="p-1 text-blue-400 hover:text-blue-200">
                    <X className="w-4 h-4" />
                </Link>
            </div>

            <ThreePanelLayout
                moduleOperations={<div className="px-4 py-1 text-xs text-gray-400">Editing domain presentation</div>}
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

            {isLibraryOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50" onClick={handleNavigateBack}>
                    <div className="bg-background rounded-lg p-4 w-[80%] max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
                            <button onClick={handleNavigateBack} className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded">
                                Close
                            </button>
                        </div>
                        <div className="text-sm text-gray-400 max-h-[70vh] overflow-auto">
                            <MarkdownLibrary onSelect={handleLibrarySelect} hideExportLibraryButton={false} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DomainEditPage;

