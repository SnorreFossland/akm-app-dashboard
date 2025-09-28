'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';

import { RootState } from '@/store';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';

const EditDocumentModalPage = () => {
    const router = useRouter();
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

        const storedContext = localStorage.getItem('aiChat_context');
        const storedDocument = localStorage.getItem('currentDocument');

        if (storedContext) {
            setContextContent(storedContext);
        }
        if (storedDocument) {
            setCurrentDocument(storedDocument);
            setPreviewContent(storedDocument);
            previousDocumentRef.current = storedDocument;
        }
    }, []);

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

    const handleLibrarySelect = useCallback((content: string, name?: string) => {
        if (libraryTarget === 'context') {
            setContextContent(content);
        } else if (libraryTarget === 'document') {
            setCurrentDocument(content);
        }
        closeLibrary();
    }, [closeLibrary, libraryTarget]);

    const handlePreviewSaveToLibrary = useCallback(() => {
        router.push('/ai-chat');
    }, [router]);

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
    }), [currentDocument, isLibraryOpen, libraryTarget, previewContent, closeLibrary, openLibraryFor]);

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
                        onSaveToLibrary={handlePreviewSaveToLibrary}
                    />
                ),
            },
        ],
        defaultTab: 'preview',
    }), [previewContent]);

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
                            <MarkdownLibrary onSelect={handleLibrarySelect} hideExportLibraryButton={false} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditDocumentModalPage;
