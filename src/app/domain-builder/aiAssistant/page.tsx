'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';

import { RootState } from '@/store';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import GettingStartedGuide from '@/components/domain-builder/GettingStartedGuide';
import Guide from '@/components/domain-builder/Guide';
import ChatComponent from '@/components/domain-builder/ChatComponent';
import { FileOperations } from '@/components/FileOperations';
import { saveMarkdownDocument } from '@/features/model-universe/modelSlice';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';

const MarkdownLibrary = dynamic(
    () => import('@/components/ai-chat/MarkdownLibrary'),
    {
        ssr: false,
        loading: () => <div className="p-4 text-center text-sm">Loading document library...</div>
    }
);

const DomainAssistantPage = () => {
    const dispatch = useDispatch();
    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);
    const documents = useSelector((state: RootState) => state.modelUniverse?.phData?.documents ?? []);

    const [input, setInput] = useState('');
    const [chatInput] = useState('');
    const [mdContent, setMdContent] = useState('');
    const [mdPreview, setMdPreview] = useState('Nothing to preview yet!');
    const [selectedModel, setSelectedModel] = useState<'dummy' | 'deepseek-chat' | 'mistral' | 'gpt-5' | 'gpt-5-mini'>('gpt-5-mini');
    const [currentDocument, setCurrentDocument] = useState(domain?.presentation ?? '');
    const [docName, setDocName] = useState(domain?.name ?? '');
    const [, setCurrentMessages] = useState<any[]>([]);

    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);

    const mdFileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentDocument(domain?.presentation ?? '');
        setDocName(domain?.name ?? '');
    }, [domain?.name, domain?.presentation]);

    useEffect(() => {
        if (!docName && mdPreview) {
            const firstLine = mdPreview.split('\n')[0] ?? '';
            const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_').trim();
            if (cleanName) setDocName(cleanName);
        }
    }, [docName, mdPreview]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (currentDocument) {
            localStorage.setItem('currentDocument', currentDocument);
            window.dispatchEvent(new CustomEvent('localStorageChange', {
                detail: { key: 'currentDocument', newValue: currentDocument }
            }));
        }
    }, [currentDocument]);

    const handleResponseChange = (response: string) => {
        setCurrentDocument(response);
    };

    const handleViewInMarkdown = (response: string) => {
        const cleanResponse = (r: string) => {
            const cleaned = r.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
            return cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
        };
        setMdPreview(cleanResponse(response));
    };

    const handleAddMD = () => mdFileInputRef.current?.click();

    const handleOpenLibrary = () => {
        setIsLibraryLoading(true);
        setIsLibraryOpen(true);
        window.setTimeout(() => setIsLibraryLoading(false), 300);
    };

    const handleDocumentSelect = (content: string, name: string, _doc?: MarkdownDocument) => {
        setMdContent(content);
        setDocName(name);
        setIsLibraryOpen(false);
        setIsLibraryLoading(false);
    };

    const handleExportLibrary = () => {
        if (!documents || documents.length === 0) return;
        const dataStr = JSON.stringify(documents, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileName = `domain-doc-library-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    };

    const handleImportLibrary = () => fileInputRef.current?.click();

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedDocuments = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedDocuments)) {
                    importedDocuments.forEach(doc => {
                        if (doc && typeof doc === 'object' && 'name' in doc && 'content' in doc) {
                            dispatch(saveMarkdownDocument({
                                id: doc.id ?? Date.now().toString(),
                                name: doc.name,
                                type: 'markdown',
                                content: doc.content,
                                createdAt: doc.createdAt ?? new Date().toISOString(),
                                updatedAt: doc.updatedAt ?? new Date().toISOString()
                            }));
                        }
                    });
                    alert(`Successfully imported ${importedDocuments.length} documents`);
                } else {
                    alert('Invalid file format. Import failed.');
                }
            } catch (error) {
                alert('Failed to import library. Invalid JSON format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleShowInLeftPanel = (content: string, name: string, _doc?: MarkdownDocument) => {
        setMdContent(content);
        setDocName(name);
    };

    const leftPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'current-domain',
                label: 'Current Domain',
                content: (
                    <div className="space-y-4 px-2 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        {currentDocument ? (
                            <div className="p-2 bg-gray-800 rounded">
                                <MarkdownPreview mdPreview={currentDocument} />
                            </div>
                        ) : (
                            <div className="p-2 bg-gray-800 rounded">
                                <div className="text-sm text-gray-400">No domain presentation available.</div>
                            </div>
                        )}
                    </div>
                )
            },
            {
                key: 'context',
                label: 'Additional Context',
                content: (
                    <DocumentPanel
                        mdContent={mdContent}
                        setMdContent={setMdContent}
                        setIsLibraryOpen={handleOpenLibrary}
                        isLibraryOpen={isLibraryOpen}
                        panelType='left'
                    />
                )
            }
        ],
        defaultTab: 'current-domain'
    }), [currentDocument, mdContent, isLibraryOpen]);

    const middlePanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'assistant',
                label: 'AI Domain Builder',
                content: (
                    <div className="flex-1 overflow-auto bg-gray-800/20 rounded h-full">
                        <ChatComponent
                            input={input}
                            setInput={setInput}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            onResponseChange={handleResponseChange}
                            onViewInMarkdown={handleViewInMarkdown}
                            setShowLeftPanel={setShowLeftPanel}
                            showLeftPanel={showLeftPanel}
                            chatInput={chatInput}
                            onAddMD={handleAddMD}
                            mdContent={mdContent}
                            setMdContent={setMdContent}
                            mdPreview={mdPreview}
                            setMdPreview={setMdPreview}
                            currentDocument={currentDocument}
                            setCurrentMessages={setCurrentMessages}
                            gettingStartedGuide={<GettingStartedGuide />}
                            guide={<Guide />}
                        />
                    </div>
                )
            }
        ],
        defaultTab: 'assistant'
    }), [chatInput, currentDocument, input, mdContent, mdPreview, selectedModel, showLeftPanel]);

    const rightPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <DocumentPanel
                        mdContent={mdPreview}
                        setMdContent={setMdPreview}
                        setIsLibraryOpen={handleOpenLibrary} // Use the new handler
                        isLibraryOpen={isLibraryOpen}
                        panelType='right'
                        currentDocumentContent={currentDocument}
                        markdownPreviewContent={mdPreview}
                    />
                )
            }
        ],
        defaultTab: 'preview'
    }), [mdPreview]);

    const modelSelector = (
        <div className="flex justify-between bg-gray-800 text-xs">
            <div className="px-1">
                <span className="ms-1 font-bold text-gray-400 inline-block">Domain:</span>
                <span className="text-gray-300">{domain?.name ?? 'Untitled Domain'}</span>
            </div>
        </div>
    );

    const Modal = ({
        isOpen,
        onClose,
        children
    }: {
        isOpen: boolean;
        onClose: () => void;
        children: React.ReactNode;
    }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
                <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white" aria-label="Close">
                        <X className="h-6 w-6" />
                    </button>
                    <div className="p-6">{children}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden border-[16px] border-blue-800/80 rounded-lg shadow-xl">
            <div className="flex justify-between items-center py-1 px-2 border-b border-gray-700 bg-gray-800/90">
                <span className="font-bold text-blue-500/60">Assistant mode</span>
                <span className="font-medium font-bold text-blue-400/60">Domain Builder Assistant</span>
                <Link href="/domain-builder" className="p-1 text-blue-400 hover:text-blue-200">
                    <X className="w-4 h-4" />
                </Link>
            </div>

            <div className="w-full border-b border-gray-700">
                <FileOperations />
            </div>

            <div className="flex-1 overflow-hidden bg-gray-900/60">
                <ThreePanelLayout
                    moduleOperations={modelSelector}
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
                <Modal isOpen={isLibraryOpen} onClose={() => { setIsLibraryOpen(false); setIsLibraryLoading(false); }}>
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
                        <div className="flex space-x-2">
                            <button onClick={handleImportLibrary} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded">
                                Import
                            </button>
                            <button onClick={handleExportLibrary} className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded" disabled={!documents || documents.length === 0}>
                                Export
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelection} accept=".json" style={{ display: 'none' }} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-400 max-h-[70vh] overflow-auto">
                        {isLibraryLoading ? (
                            <div className="p-4 text-center">Loading document library...</div>
                        ) : (
                            <MarkdownLibrary
                                onSelect={handleDocumentSelect}
                                onShowInLeftPanel={handleShowInLeftPanel}
                                onSetCurrentDocument={(content, _name, _doc) => setCurrentDocument(content)}
                                currentDocument={currentDocument}
                                hideExportLibraryButton={false}
                            />
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DomainAssistantPage;
