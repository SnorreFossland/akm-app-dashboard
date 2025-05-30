'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HelpCircle } from 'lucide-react';
import { RootState } from '@/store/store';

// Import components (note the correct file name)
import IRTVBuilderComponent from '@/components/irtv-builder/IrtvBuildercomponent';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
// import IRTVTemplatesPanel from '@/components/irtv-builder/IRTVTemplatesPanel';

// Types
interface IRTVConversation {
    id: string;
    title: string;
    messages: any[];
    timestamp: number;
}

const IRTVBuilderPage = () => {
    const dispatch = useDispatch();
    // const documents = useSelector((state: RootState) => state.documents.documents);
    const documents = useSelector((state: RootState) => state.markdown.documents);

    // Panel state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'templates' | 'document'>('templates');

    // IRTV Builder specific state
    const [irtvContent, setIrtvContent] = useState('');
    const [irtvPreview, setIrtvPreview] = useState('');
    const [selectedIrtvModel, setSelectedIrtvModel] = useState('gpt-4');
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
                                IRTV Tools: {activeLeftTab === 'templates' ? 'Templates' : activeLeftTab === 'document' ? 'Document' : 'Conversations'}
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
                <div className="flex p-1 sm:px-2 flex-col flex-grow"
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
                        <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">IRTV Builder</h1>
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
                    <div className="flex-1 h-full overflow-auto">
                        <IRTVBuilderComponent
                            input={irtvInput}
                            setInput={setIrtvInput}
                            selectedModel={selectedIrtvModel}
                            setSelectedModel={setSelectedIrtvModel}
                            onResponseChange={handleIrtvResponseChange}
                            onViewInPreview={handleViewInIrtvPreview}
                            setShowLeftPanel={setShowLeftPanel}
                            onAddContent={handleAddContent}
                            irtvContent={irtvContent} // Make sure this is connected
                            setIrtvContent={setIrtvContent} // Make sure this is connected
                            irtvPreview={irtvPreview}
                            setIrtvPreview={setIrtvPreview}
                            setCurrentMessages={setCurrentMessages}
                        />
                    </div>
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
                        <DocumentPanel
                            mdContent={irtvPreview}
                            setMdContent={setIrtvPreview}
                            setIsLibraryOpen={setIsLibraryOpen}
                            isLibraryOpen={isLibraryOpen}
                            panelType='right'
                        />
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
        </div>
    );
};

export default IRTVBuilderPage;