'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { LoadingCircularProgress } from "@/components/loading";

// Import components (note the correct file name)

import IRTVBuilderComponent from '@/components/irtv-builder/IrtvBuildercomponent';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
// import IRTVTemplatesPanel from '@/components/irtv-builder/IRTVTemplatesPanel';


// Types
interface IRTVConversation {
    id: string;
    title: string;
    messages: any[];
    timestamp: number;
}

const IRTVBuilderPage = () => {
    const data = {} //useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // const documents = useSelector((state: RootState) => state.documents.documents);
    const documents = useSelector((state: RootState) => state.markdown.documents);

    const [activeTab, setActiveTab] = useState('current-knowledge');
    const [activeSubTab, setActiveSubTab] = useState('model-summary');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isIrtvOpen, setIsIrtvOpen] = useState(true);
    const [isModelOpen, setIsModelOpen] = useState(false);

    const [showModel, setShowModel] = useState(true);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    // const [metis, setMetis] = useState<Metis | null >(null);
    const [model, setModel] = useState<{ id?: string; name?: string; description?: string; objects?: any[]; relships?: any[] } | null>(null);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);


    // Panel state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'templates' | 'document'>('document');

    // IRTV Builder specific state
    const [irtvContent, setIrtvContent] = useState('');
    const [irtvPreview, setIrtvPreview] = useState('');
    const [selectedIrtvModel, setSelectedIrtvModel] = useState('deepseek-chat');
    const [irtvInput, setIrtvInput] = useState('');
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);
    const [conversations, setConversations] = useState<IRTVConversation[]>([]);

    // Template state
    const [editableContent, setEditableContent] = useState('');
    const [domainContent, setDomainContent] = useState('');

    // Modal state
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [docName, setDocName] = useState('');

    // File handling
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mdFileInputRef = useRef<HTMLInputElement>(null);

    // Panel sizing constants
    const MIN_PANEL_WIDTH = 200;
    const MAX_PANEL_WIDTH = () => window.innerWidth * 0.6;

    // Refs for touch/drag handling
    const leftPanelWidthRef = useRef(leftPanelWidth);
    const rightPanelWidthRef = useRef(rightPanelWidth);
    const showLeftPanelRef = useRef(showLeftPanel);
    const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    // Update refs when state changes
    useEffect(() => {
        leftPanelWidthRef.current = leftPanelWidth;
    }, [leftPanelWidth]);

    useEffect(() => {
        rightPanelWidthRef.current = rightPanelWidth;
    }, [rightPanelWidth]);

    useEffect(() => {
        showLeftPanelRef.current = showLeftPanel;
    }, [showLeftPanel]);

    const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    // Panel drag handling
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, panel: 'left' | 'right') => {
        if ('button' in e && e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const startLeftWidth = leftPanelWidthRef.current;
        const startRightWidth = rightPanelWidthRef.current;

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        document.body.style.touchAction = 'none';

        const onMove = (event: MouseEvent | TouchEvent) => {
            if (event instanceof MouseEvent && !(event.buttons & 1)) {
                onEnd();
                return;
            }

            const currentX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
            const deltaX = currentX - startX;

            if (panel === 'left') {
                const newWidth = Math.max(
                    MIN_PANEL_WIDTH,
                    Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX)
                );
                setLeftPanelWidth(newWidth);
            } else if (panel === 'right') {
                const leftPanelActualWidth = showLeftPanelRef.current ? leftPanelWidthRef.current + 8 : 0;
                const minimumMiddleWidth = 320;
                const maxRightWidth = window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - 20;

                const newWidth = Math.max(
                    MIN_PANEL_WIDTH,
                    Math.min(maxRightWidth, startRightWidth - deltaX)
                );
                setRightPanelWidth(newWidth);
            }
        };

        const onEnd = () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            document.body.style.touchAction = '';

            document.removeEventListener('mousemove', onMove, { capture: true });
            document.removeEventListener('mouseup', onEnd, { capture: true });
            document.removeEventListener('touchmove', onMove, { capture: true });
            document.removeEventListener('touchend', onEnd, { capture: true });
            document.removeEventListener('touchcancel', onEnd, { capture: true });
            document.removeEventListener('contextmenu', onEnd, { capture: true });
        };

        document.addEventListener('mousemove', onMove, { capture: true });
        document.addEventListener('mouseup', onEnd, { capture: true });
        document.addEventListener('touchmove', onMove, { capture: true, passive: false });
        document.addEventListener('touchend', onEnd, { capture: true });
        document.addEventListener('touchcancel', onEnd, { capture: true });
        document.addEventListener('contextmenu', onEnd, { capture: true });
    };

    // IRTV Builder handlers
    const handleIrtvResponseChange = (response: string) => {
        // Handle IRTV response logic
        console.log('IRTV Response:', response);
    };

    const handleViewInIrtvPreview = (response: string) => {
        const cleanResponse = (response: string) => {
            let cleaned = response.trim();
            // Add IRTV-specific cleaning logic here
            return cleaned;
        };
        const cleanedResponse = cleanResponse(response);
        setIrtvPreview(cleanedResponse);
        setShowRightPanel(true);
    };

    const handleApplyTemplate = (template: any) => {
        setEditableContent(template.content);
        setDomainContent(template.domain || '');
    };

    const handleAddContent = (content: string) => {
        setIrtvContent(content);
    };

    // Conversation handlers
    const handleSelectConversation = (conversation: IRTVConversation) => {
        setCurrentMessages(conversation.messages);
    };

    const handleDeleteConversation = (conversationId: string) => {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    };

    const handleSaveCurrentConversation = () => {
        if (currentMessages.length === 0) return;

        const newConversation: IRTVConversation = {
            id: Date.now().toString(),
            title: `IRTV Conversation ${new Date().toLocaleDateString()}`,
            messages: currentMessages,
            timestamp: Date.now()
        };
        setConversations(prev => [newConversation, ...prev]);
    };

    // File handling
    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Handle file import logic
    };

    const handleExportLibrary = () => {
        // Handle library export logic
    };

    const handleSaveToRedux = () => {
        // Handle saving to Redux store
    };

    return (
        <div className="w-full h-full bg-background text-gray-100">
            <div className="flex flex-row flex-nowrap h-[100dvh] w-full bg-background text-gray-100">

                {/* Left Panel: Templates & Tools */}
                {showLeftPanel && (
                    <div
                        className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 max-w-[95vw] overflow-auto"
                        style={{
                            width: `${leftPanelWidth}px`,
                            minWidth: '200px'
                        }}
                    >
                        <div className="flex justify-between items-center m-1 sm:m-2">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-400">
                                IRTV Input: {activeLeftTab === 'templates' ? 'Templates' : activeLeftTab === 'document' ? 'Document' : 'Conversations'}
                            </h2>
                            <div className="markdown-preview-header">
                                <button
                                    onClick={() => setShowLeftPanel(false)}
                                    className="text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <ul className="flex border-b border-gray-600 mb-2 text-sm">
                            <li
                                className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'conversations'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('conversations')}
                            >
                                Saved IRTV Sessions
                            </li>
                            <li
                                className={`px-3 py-1 cursor-pointer ${activeLeftTab === 'templates'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('templates')}
                            >
                                IRTV Templates
                            </li>
                            <li
                                className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'document'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('document')}
                            >
                                Document
                            </li>
                        </ul>

                        {/* Tab Content */}
                        {activeLeftTab === 'conversations' ? (
                            <div className="p-2">
                                <ConversationsPanel
                                    conversations={conversations}
                                    onSelectConversation={handleSelectConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    onSaveConversation={handleSaveCurrentConversation}
                                    currentMessages={currentMessages}
                                />
                            </div>
                        ) : activeLeftTab === 'templates' ? (
                            <>
                                <input
                                    ref={mdFileInputRef}
                                    type="file"
                                    accept=".md"
                                    className="hidden"
                                />
                                {/* <IRTVTemplatesPanel
                                    onApplyTemplate={handleApplyTemplate}
                                    editableContent={editableContent}
                                    setEditableContent={setEditableContent}
                                    domainContent={domainContent}
                                    setDomainContent={setDomainContent}
                                    selectedModel={selectedIrtvModel}
                                    onAddContent={handleAddContent}
                                    irtvContent={irtvContent}
                                /> */}
                            </>
                        ) : (
                            <DocumentPanel
                                mdContent={irtvContent}
                                setMdContent={setIrtvInput}
                                setIsLibraryOpen={setIsLibraryOpen}
                                isLibraryOpen={isLibraryOpen}
                                panelType='left'
                            />
                        )}
                    </div>
                )}

                {/* Draggable Bar for Left Panel */}
                {showLeftPanel && (
                    <div
                        className="w-2 bg-gray-700 cursor-col-resize relative flex-shrink-0"
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                        onTouchStart={(e) => handleMouseDown(e, 'left')}
                        style={{ touchAction: 'none' }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
                    </div>
                )}

                {/* Middle Panel: IRTV Builder */}
                <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden p-1 sm:p-2"
                    style={{
                        minWidth: '320px'
                    }}>

                    <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 sm:p-2">
                        <button
                            onClick={() => setShowLeftPanel(!showLeftPanel)}
                            className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
                            title='Show Left pane'
                        >
                            <span>
                                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </span>
                            <span className="ml-1 hidden bg-muted hover:bg-gray-600 text-white sm:inline">{!showLeftPanel}</span>
                        </button>
                        <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">IRTV Model Builder</h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setShowGuideModal(true)}
                                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full p-2"
                                    title="Open IRTV guide"
                                >
                                    <HelpCircle className="h-5 w-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowRightPanel(!showRightPanel)}
                                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
                                title='Show Right pane'
                            >
                                <span className="mr-1 hidden bg-muted hover:bg-gray-600 text-white sm:inline">{!showRightPanel}</span>
                                <span>
                                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="6" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* IRTV Accordion */}
                    {!isIrtvOpen && (
                        <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground py-1 px-1 sm:px-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setIsIrtvOpen(!isIrtvOpen); setIsModelOpen(false); }}
                                    className="flex items-center gap-1 text-xs bg-muted hover:bg-gray-600 text-white px-0.5 py-0.5 rounded"
                                    title='Toggle IRTV'
                                >
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                        className={`transform transition-transform ${isIrtvOpen ? 'rotate-90' : ''}`}>
                                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <h1 className="text-xs sm:text-sm font-bold text-blue-400 px-1">IRTV</h1>
                            </div>
                        </div>
                    )}

                    {/* IRTV Content */}
                    {isIrtvOpen && (
                        <>
                            <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 sm:p-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsIrtvOpen(!isIrtvOpen)}
                                        className="flex items-center gap-1 text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                                        title='Toggle IRTV'
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                            className={`transform transition-transform ${isIrtvOpen ? 'rotate-90' : ''}`}>
                                            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">IRTV</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setShowGuideModal(true)}
                                            className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full p-2"
                                            title="Open IRTV guide"
                                        >
                                            <HelpCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 h-full overflow-auto bg-gray-800/20 rounded border border-gray-600 p-2">
                                <IRTVBuilderComponent
                                    input={irtvInput}
                                    setInput={setIrtvInput}
                                    selectedModel={selectedIrtvModel}
                                    setSelectedModel={setSelectedIrtvModel}
                                    onResponseChange={handleIrtvResponseChange}
                                    onViewInPreview={handleViewInIrtvPreview}
                                    setShowLeftPanel={setShowLeftPanel}
                                    onAddContent={handleAddContent}
                                    irtvContent={irtvContent}
                                    setIrtvContent={setIrtvContent}
                                    irtvPreview={irtvPreview}
                                    setIrtvPreview={setIrtvPreview}
                                    setCurrentMessages={setCurrentMessages}
                                />
                            </div>
                        </>
                    )}

                    {/* Model Accordion */}
                    {!isModelOpen && (
                        <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground py-1 px-1 sm:px-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setIsModelOpen(!isModelOpen); setIsIrtvOpen(false); }}
                                    className="flex items-center gap-1 text-xs bg-muted hover:bg-gray-600 text-white px-0.5 py-0.5 rounded"
                                    title='Toggle IRTV'
                                >
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                        className={`transform transition-transform ${isModelOpen ? 'rotate-90' : ''}`}>
                                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <h1 className="text-xs sm:text-sm font-bold text-blue-400 px-1">Model</h1>
                            </div>
                        </div>
                    )}
                    {/* IRTV Model */}
                    {isModelOpen && (
                        <>
                            <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 sm:p-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsModelOpen(!isModelOpen)}
                                        className="flex items-center gap-1 text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                                        title='Toggle IRTV'
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                            className={`transform transition-transform ${isIrtvOpen ? 'rotate-90' : ''}`}>
                                            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">Model</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setShowGuideModal(true)}
                                            className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full p-2"
                                            title="Open IRTV guide"
                                        >
                                            <HelpCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden p-1 sm:p-2">
                                <div className="w-full h-screen m-0 p-0">
                                    <iframe
                                        ref={iframeRef}
                                        src="http://localhost:3000/modelling"
                                        className="w-full h-full border-none"
                                        title="Embedded Page"
                                        allow="clipboard-read; clipboard-write"
                                        sandbox="allow-same-origin allow-scripts"
                                    ></iframe>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* Draggable Bar for Right Panel */}
                {showRightPanel && (
                    <div
                        className="w-2 bg-gray-700 hover:bg-gray-500 cursor-col-resize relative flex-shrink-0"
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        onTouchStart={(e) => handleMouseDown(e, 'right')}
                        style={{ zIndex: 10, touchAction: 'none' }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
                    </div>
                )}

                {/* Right Panel: IRTV Preview */}
                {showRightPanel && (
                    <div className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 overflow-auto flex flex-col"
                        style={{
                            width: `${rightPanelWidth}px`,
                            minWidth: '200px',
                            maxWidth: '65%'
                        }}>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-400">IRTV Preview</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowRightPanel(false)}
                                    className="text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        {/* <DocumentPanel
                            mdContent={irtvPreview}
                            setMdContent={setIrtvPreview}
                            setIsLibraryOpen={setIsLibraryOpen}
                            isLibraryOpen={isLibraryOpen}
                            panelType='right'
                        /> */}
                        <div className="border-solid rounded border-4 border-blue-800 h-full w-full">
                            {data
                                ? <Card className="p-1">
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="m-1 mb-0 bg-transparent">
                                            <TabsTrigger value="current-knowledge" className='pb-2 mt-3'>Current Knowledge</TabsTrigger>
                                            <TabsTrigger value="model" className='pb-2 mt-3'>GPT Suggested Model</TabsTrigger>
                                            <TabsTrigger value="modelview" className='pb-2 mt-3'>GPT Suggested Modelview</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background">
                                            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="bg-gray-700 mx-1 px-1 mt-0">
                                                <TabsList className=" mb-0 bg-gray-700 mt-0">
                                                    <TabsTrigger value="model-summary" className='pb-2 mt-3'>Current Model Summary</TabsTrigger>
                                                    <TabsTrigger value="model-objects" className='pb-2 mt-3'>Current Model</TabsTrigger>
                                                    <TabsTrigger value="model-modelviews" className='pb-2 mt-3'>Current Modelview</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="model-summary" className="m-0 px-1 py-2 rounded bg-background text-gray-200">
                                                    <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        <div className="">
                                                            {data && data.phData && data.phData.metis && data.phData.metis.models && (
                                                                <>
                                                                    <div className="flex justify-left items-center py-2 text-left">
                                                                        <h4 className="px-2 text-gray-400 font-bold">AKM File</h4>
                                                                        <h4 className="px-2 mb-1 font-bold whitespace-nowrap bg-gray-700">{data.phSource}.json</h4>
                                                                    </div>
                                                                    <div className="flex flex-wrap">
                                                                        <div className="px-2 col text-left mb-4 w-1/3">
                                                                            <h4 className="text-gray-400 font-bold">Model Suite:</h4>
                                                                            <div className="border border-gray-600 p-2">
                                                                                <h5 className="text-gray-400 font-bold">Name</h5>
                                                                                <h4 className="font-bold whitespace-nowrap bg-background p-1">{data.phData.metis.name}</h4>
                                                                                <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                                                                <h4 className=" bg-background p-1">{data.phData.metis.description}</h4>
                                                                            </div>
                                                                            <div className="col text-left">
                                                                                <h4 className="text-gray-400 font-bold">Project:</h4>
                                                                                <div className="border border-gray-600 p-2">
                                                                                    {data.phFocus && 'focusProj' in data.phFocus ? (
                                                                                        <>
                                                                                            <h5 className="text-gray-400 font-bold px-1">id</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.id}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">proj.no.</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.projectNumber}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">name</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.name}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.org}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.repo}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">path</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.path}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">file</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.file}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">branch</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.branch}</h5>
                                                                                            <h5 className="text-gray-400 font-bold px-1">username</h5>
                                                                                            <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.username}</h5>
                                                                                        </>
                                                                                    ) : (
                                                                                        <p className="text-gray-400">No project information available</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="px-4 col text-left w-2/3">
                                                                            <h4 className="px-1 text-gray-400 font-bold">Models:</h4>
                                                                            <div className="border border-gray-600 p-2">
                                                                                {data.phData.metis.models.map((model: any, index) => (
                                                                                    <div key={model.id} className="flex flex-col">
                                                                                        <h5 className="text-gray-400 font-bold">Name</h5>
                                                                                        <h4 className="bg-background p-2"> <span className="text-gray-400">{index}: </span>{model.name}</h4>
                                                                                        <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                                                                        <h4 className="bg-background p-2">{model.description}</h4>
                                                                                        <hr className="my-1" />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="model-objects" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                                    <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                    </div>
                                                    {curmod && (
                                                        <ObjectCard model={{
                                                            id: curmod.id,
                                                            name: curmod.name,
                                                            description: curmod.description,
                                                            objects: curmod.objects?.map(obj => ({
                                                                id: obj.id || '',
                                                                name: obj.name || '',
                                                                description: obj.description || '',
                                                                proposedType: obj.proposedType || '',
                                                                typeRef: obj.typeRef || '',
                                                                typeName: obj.typeName || '',
                                                                category: obj.category || ''
                                                            })) || [],
                                                            relships: curmod.relships || [],
                                                            metamodelRef: curmod.metamodelRef,
                                                            modelviews: curmod.modelviews
                                                        }} />
                                                    )}
                                                </TabsContent>
                                                {/* <TabsContent value="model-modelviews" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                                                    <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                                        <ModelviewCard modelviews={data?.phData?.metis?.models[0].modelviews.map((modelview: any) => ({
                                                                            ...modelview,
                                                                            objectviews: Array.isArray(modelview.objectviews) ? modelview.objectviews : [modelview.objectviews]
                                                                        }))} />
                                                                    </div>
                                                                </TabsContent> */}
                                            </Tabs>
                                        </TabsContent>

                                        <TabsContent value="model" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                            {showModel && model && (
                                                <>
                                                    <div className="flex justify-end pb-1 pt-0 mx-2">
                                                        <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                                            Show Prompt
                                                        </button>
                                                    </div>
                                                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                                        <DialogContent className="max-w-5xl">
                                                            <DialogHeader>
                                                                <DialogDescription>
                                                                    {printPromptsDiv}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <ObjectCard model={{
                                                                id: model.id || crypto.randomUUID(),
                                                                name: model.name || 'Generated Model',
                                                                description: model.description || '',
                                                                objects: model.objects?.map(obj => ({
                                                                    id: obj.id || crypto.randomUUID(),
                                                                    name: obj.name || '',
                                                                    description: obj.description || '',
                                                                    proposedType: obj.proposedType || '',
                                                                    typeRef: obj.typeRef || '',
                                                                    typeName: obj.typeName || '',
                                                                    category: obj.category || ''
                                                                })) || [],
                                                                relships: model.relships || [],
                                                                metamodelRef: curmod?.metamodelRef || '',
                                                                modelviews: curmod?.modelviews || []
                                                            }} />
                                                        </DialogContent>
                                                        <DialogFooter>
                                                            <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                                                                Close
                                                            </Button>
                                                        </DialogFooter>
                                                    </Dialog>
                                                </>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="modelview" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                            <>
                                                <div className="flex justify-end pb-1 pt-0 mx-2">
                                                    <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                                        Show Prompt
                                                    </button>
                                                </div>
                                                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                                    <DialogContent className="max-w-5xl">
                                                        <DialogHeader>
                                                            <DialogDescription>
                                                                {printPromptsDiv}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                                                                Close
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                <div className="mx-1 ">
                                                    {modelview && <ModelviewCard modelviews={[{
                                                        // Use type assertion to match what ModelviewCard expects
                                                        name: modelview.name || 'Default View',
                                                        description: modelview.description || '',
                                                        objectviews: modelview.objectviews || [],
                                                        relshipviews: modelview.relshipviews || []
                                                    } as any]} />}
                                                </div>
                                            </>
                                        </TabsContent>
                                    </Tabs>
                                </Card>
                                : <div className="flex justify-center items-center h-screen">
                                    <LoadingCircularProgress />
                                </div>
                            }
                        </div>
                    </div>
                )}

                <div className="max-h-[5px] mt-1">
                    <hr className="border-gray-700" />
                </div>

                {/* Library Modal */}
                {isLibraryOpen && (
                    <div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50"
                        onClick={() => setIsLibraryOpen(false)}
                    >
                        <div
                            className="bg-background rounded-lg p-4 w-[600px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-blue-400">IRTV Document Library</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleExportLibrary}
                                        className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                                        disabled={documents.length === 0}
                                    >
                                        Export Library
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelection}
                                        accept=".json"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                            {/* Add library content here */}
                        </div>
                    </div>
                )}

            </div>
            {/* Add the modal at the end of the component */}
            <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
                <GettingStartedGuide />
            </Modal>
        </div>
    );
};

export default IRTVBuilderPage;