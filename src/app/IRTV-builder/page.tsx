'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

import { LoadingCircularProgress } from "@/components/loading";

// Import components (note the correct file name)

import ModelComponent from "@/features/model-universe/components/ModelComponent";
import IRTVBuilderComponent from '@/components/irtv-builder/IrtvBuildercomponent';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import OutputPanel from '@/components/irtv-builder/OutputPanel';
import ConversationsPanel from '@/components/irtv-builder/ConversationsPanel';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
// import IRTVTemplatesPanel from '@/components/irtv-builder/IRTVTemplatesPanel';
// Uncomment and fix these imports at the top of your file
import { ObjectCard } from '@/components/object-card';
import { ModelviewCard } from '@/components/modelview-card'; // Adjust path as needed
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, Metis, Model } from '@/features/model-universe/modelSlice';



// Types
interface IRTVConversation {
    id: string;
    title: string;
    messages: any[];
    timestamp: number;
}



const IRTVBuilderPage = () => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();
    const [dispatchDone, setDispatchDone] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // const documents = useSelector((state: RootState) => state.documents.documents);
    const documents = useSelector((state: RootState) => state.markdown.documents);

    const [activeTab, setActiveTab] = useState('ai-irtv');
    const [activeSubTab, setActiveSubTab] = useState('model-summary');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isIrtvOpen, setIsIrtvOpen] = useState(true);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [mdContent, setMdContent] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const [currentOntology, setCurrentOntology] = useState<any>(data.phData?.ontology || null);
    const [currentDomain, setCurrentDomain] = useState<any>(data.phData?.domain || null);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    // const [metis, setMetis] = useState<Metis | null >(null);
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [model, setModel] = useState<Model>(currentModel ?? { id: '', name: '', description: '', objects: [], relships: [], metamodelRef: '', modelviews: [] });
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [isModelviewOpen, setIsModelviewOpen] = useState(false);
    const [isModelviewEditOpen, setIsModelviewEditOpen] = useState(false);

    const [showModel, setShowModel] = useState(true);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(currentModelview ?? { id: '', name: '', description: '', objectviews: [], relshipviews: [] });

    // Panel state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'model' | 'other-context'>('other-context');

    // IRTV Builder specific state
    const [irtvContent, setIrtvContent] = useState<Model | null>(null);
    const [irtvPreview, setIrtvPreview] = useState('');
    const [selectedIrtvModel, setSelectedIrtvModel] = useState('gpt-4o');
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
    const MAX_PANEL_WIDTH = () => Math.min(window.innerWidth * 0.5, 800); // Cap at 50% of window or 800px

    // Refs for touch/drag handling
    const leftPanelWidthRef = useRef(leftPanelWidth);
    const rightPanelWidthRef = useRef(rightPanelWidth);
    const showLeftPanelRef = useRef(showLeftPanel);
    const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    useEffect(() => {
        setCurrentModel(data?.phData.metis.models.find(model => model.id === data.phFocus?.focusModel?.id) || null);
        currentModel && setModel(currentModel);
    });

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

    // Handle window resize to keep panels within bounds
    useEffect(() => {
        const handleResize = () => {
            const leftPanelActualWidth = showLeftPanel ? leftPanelWidth + 8 : 0;
            const minimumMiddleWidth = 320;
            const dragBarWidth = 8;
            const padding = 80;
            const maxRightWidth = Math.max(
                MIN_PANEL_WIDTH,
                window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - dragBarWidth - padding
            );

            // Adjust right panel if it's too wide
            if (rightPanelWidth > maxRightWidth) {
                setRightPanelWidth(maxRightWidth);
            }

            // Adjust left panel if it's too wide
            const maxLeftWidth = Math.min(window.innerWidth * 0.5, 800);
            if (leftPanelWidth > maxLeftWidth) {
                setLeftPanelWidth(maxLeftWidth);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [leftPanelWidth, rightPanelWidth, showLeftPanel]);

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
                const dragBarWidth = 8; // Width of the draggable bar
                const padding = 40; // Additional padding for safety
                const maxRightWidth = Math.max(
                    MIN_PANEL_WIDTH,
                    window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - dragBarWidth - padding
                );

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


    const handleSaveToFile = (content: string) => {
        // Create a blob with the content
        const blob = new Blob([content], { type: 'text/markdown' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Extract title from first line for filename
        const firstLine = 'AIChat: ' + content.split('\n')[0].replace(/^[#\-*>`_]+\s*/, '');
        const cleanTitle = firstLine.replace(/[#*/\\:?<>|"]/g, '').trim().substring(0, 50); // Clean title for filename
        const fileName = `${cleanTitle || 'document'}.md`;

        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show confirmation
        setStatusMsg(`Saved "${fileName}" to downloads`);
        setTimeout(() => setStatusMsg(''), 30000);
    };

    const handleSaveToLibrary = () => {
        console.log('69 HandleDispatch:', dispatchDone, modelview, model);
        if (!model && !modelview) {
            alert('No IRTV to dispatch');
            return;
        }
        const metamodRef = curMetamodel?.id;
        const curmod = data.phData.metis.models[0];
        console.log('75 Curmod:', curmod, model);

        const newMod = {
            ...curmod,
            ...(model || {})
        }
        console.log('82 NewMod:', newMod);
        setCurmod(newMod);
        dispatch(setNewModel(newMod));

        if (modelview) {
            const completeModelview = {
                ...modelview,
                id: modelview.id || crypto.randomUUID(),
                name: modelview.name || 'Default View',
                description: modelview.description || '',
                modelRef: curmod?.id || '',
                modified: false,
                markedAsDeleted: false,
                objectviews: modelview.objectviews || [],
                relshipviews: modelview.relshipviews || []
            };
            dispatch(setNewModelview([completeModelview]));
        }

        setDispatchDone(true);
    };

    const [windowWidth, setWindowWidth] = useState(800); // default fallback

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        // Set initial width
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', handleResize);
            }
        };
    }, []);

    return (
        <div className=" h-full bg-background text-gray-100 overflow-hidden">
            <div className="flex flex-row flex-nowrap h-[calc(100dvh-2px)] w-full bg-background text-gray-100">

                {/* Left Panel: Templates & Tools */}
                {showLeftPanel && (
                    <div
                        className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 max-w-[95vw] overflow-hidden"
                        style={{
                            width: `${leftPanelWidth}px`,
                            minWidth: '200px'
                        }}
                    >
                        <div className="flex justify-between items-center m-1 sm:m-2">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-400">
                                IRTV Input: {activeLeftTab === 'model' ? 'model' : activeLeftTab === 'other-context' ? 'other-context' : 'Conversations'}
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
                                Saved conversations
                            </li>
                            <li
                                className={`px-3 py-1 cursor-pointer ${activeLeftTab === 'model'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('model')}
                            >
                                Model context
                            </li>
                            <li
                                className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'other-context'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('other-context')}
                            >
                                Other context
                            </li>
                        </ul>

                        {/* Tab Content */}
                        {activeLeftTab === 'conversations' ? (
                            <div className="p-2 bg-background h-[calc(100vh-6rem)]">
                                <ConversationsPanel
                                    conversations={conversations}
                                    onSelectConversation={handleSelectConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    onSaveConversation={handleSaveCurrentConversation}
                                    currentMessages={currentMessages}
                                />
                            </div>
                        ) : activeLeftTab === 'model' ? (
                            <div className="mt-2 text-xs h-[calc(100vh-5rem)] overflow-hidden">
                                {currentModel && (
                                    <ObjectCard model={{
                                        id: currentModel.id,
                                        name: currentModel.name,
                                        description: currentModel.description,
                                        objects: currentModel.objects?.map(obj => ({
                                            id: obj.id || '',
                                            name: obj.name || '',
                                            description: obj.description || '',
                                            proposedType: obj.proposedType || '',
                                            typeRef: obj.typeRef || '',
                                            typeName: obj.typeName || '',
                                            category: obj.category || ''
                                        })) || [],
                                        relships: currentModel.relships || [],
                                        metamodelRef: currentModel.metamodelRef || '',
                                        modelviews: currentModel.modelviews || []
                                    }} />
                                )}
                            </div>
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
                <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden flex-col "
                    style={{
                        minWidth: '320px'
                    }}>
                    <div className="flex justify-between items-center rounded-md bg-primary-foreground px-1 sm:px-1">
                        {/* Middle Content */}
                        <div className="flex flex-col flex-grow bg-background text-gray-100 ">
                            <Tabs defaultValue="ai-irtv" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0">
                          
                                {/* Tab Structure with Left and Right buttons */}
                                <div className="flex items-center justify-between">
                                    {/* Left Panel toggle button */}
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
                                    {/* <span className="self-center inline-block w-auto text-xs sm:text-sm ml-4 pt-1 text-blue-400">IRTV Builder:</span> */}

                                    {/* Tabs */}
                                    <TabsList className="grid grid-cols-3 bg-primary-foreground my-0 h-9 flex-1 mx-2">
                                        <TabsTrigger
                                            value="ai-irtv"
                                            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=inactive]:text-gray-100 py-2 px-4"
                                            title="AI Modelling Assistant"
                                        >                                          AI IRTV Modelling Assistant
                                            <span className="mx-1"></span>
                                            <span
                                                onClick={() => setShowGuideModal(true)}
                                                className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                                                title="Open domain guide"
                                            >
                                                <HelpCircle className="h-4 w-4" />
                                            </span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="current-domain"
                                            className="data-[state=active]:b-card-forground data-[state=active]:text-white data-[state=active]:font-semibold data-[state=inactive]:text-gray-100 py-2 px-4"
                                            title="Current Domain"                                
                                        >
                                            Domain: {currentDomain.name || 'Domain name'}
                                            <span className="mx-1"></span>
                                            <span
                                                onClick={() => setShowGuideModal(true)}
                                                className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                                                title="Open domain guide"
                                            >
                                                <HelpCircle className="h-4 w-4" />
                                            </span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="model"
                                            className="data-[state=active]:bg-green-100 data-[state=active]:text-gray-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-100 py-3 px-4"
                                            title="Model Universe"
                                        >
                                            Model
                                            {/* <span className="mx-1">{model.name || 'Model name'}</span> */}
                                            <span
                                                onClick={() => setShowGuideModal(true)}
                                                className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                                                title="Open Model guide"
                                            >
                                                <HelpCircle className="h-4 w-4" />
                                            </span>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Right Panel Button */}
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
                                {/* AI Assistant */}
                                <TabsContent value="ai-irtv" className="flex-1 px-1 mt-1">
                                    <div className="flex-1 overflow-auto bg-gray-800/20 ">
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
                                </TabsContent>
                                {/* Current Domain */}
                                <TabsContent value="current-domain" className="flex-1 px-1 mt-1">
                                    <div className="flex-1 overflow-auto bg-gray-800/20 p-1 overflow-hidden">
                                        <ModelComponent />
                                    </div>
                                </TabsContent>
                                {/* Model */}
                                <TabsContent value="model" className="flex-1">
                                    <iframe
                                        style={{ height: "calc(100vh - 2.3rem)", width: "100%" }}
                                        ref={iframeRef}
                                        src="http://localhost:3000/modelling"
                                        className="w-full h-full border-none rounded"
                                        title="Embedded Mimris Modeller"
                                        allow="clipboard-read; clipboard-write"
                                        sandbox="allow-same-origin allow-scripts"
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
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
                    <div className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 overflow-auto flex flex-col max-h-[calc(100vh-7px)] overflow-hidden"
                        style={{
                            width: `${Math.min(rightPanelWidth, windowWidth * 0.5)}px`,
                            minWidth: '200px',
                            maxWidth: '50vw'
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
                        <OutputPanel
                            irtvPreview={irtvPreview}
                            setIrtvPreview={setIrtvPreview}
                            irtvContent={irtvContent}
                            setIrtvContent={setIrtvContent}
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


                {/* Add the modal at the end of the component */}
                <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
                    <GettingStartedGuide />
                </Modal>
            </div>
        </div>
    );
};

export default IRTVBuilderPage;