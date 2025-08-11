'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

import { LoadingCircularProgress } from "@/components/loading";

// Import components (note the correct file name)
import UniverseComponent from "@/features/model-universe/components/UniverseComponent";
import IrtvBuilderComponent from '@/components/irtv-builder/IrtvBuilderComponent';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import OutputPanel from '@/components/irtv-builder/OutputPanel';
import ConversationsPanel from '@/components/irtv-builder/ConversationsPanel';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
import Guide from '@/components/irtv-builder/Guide';
// import IRTVTemplatesPanel from '@/components/irtv-builder/IRTVTemplatesPanel';
// Uncomment and fix these imports at the top of your file
import { ObjectCard } from '@/components/object-card';
import { ModelviewCard } from '@/components/modelview-card'; // Adjust path as needed
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, Metis, Model } from '@/features/model-universe/modelSlice';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from '@/components/FileOperations';

// Types
interface IrtvConversation {
    id: string;
    title: string;
    messages: any[];
    timestamp: number;
}

const IrtvBuilderPage = () => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();
    const [dispatchDone, setDispatchDone] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents.documents);
    const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);

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
    const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'model' | 'other-context'>('other-context');

    // IRTV Builder specific state
    const [irtvContent, setIrtvContent] = useState<Model | null>(null);
    const [irtvPreview, setIrtvPreview] = useState('');
    const [selectedIrtvModel, setSelectedIrtvModel] = useState('gpt-4o');
    const [irtvInput, setIrtvInput] = useState('');
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);
    const [conversations, setConversations] = useState<IrtvConversation[]>([]);

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

    const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    useEffect(() => {
        setCurrentModel(data?.phData?.metis?.models.find(model => model.id === data.phFocus?.focusModel?.id) || null);
        currentModel && setModel(currentModel);
    });

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
    const handleSelectConversation = (conversation: IrtvConversation) => {
        setCurrentMessages(conversation.messages);
    };

    const handleDeleteConversation = (conversationId: string) => {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    };

    const handleSaveCurrentConversation = () => {
        if (currentMessages.length === 0) return;
        const newConversation: IrtvConversation = {
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

    const leftPanelContent = {
        tabs: [
            {
                key: 'model',
                label: 'Current Model',
                content: (
                    <div className="mt-2 text-xs h-[calc(100vh-5rem)] overflow-auto">
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
                )
            },
            {
                key: 'other-context',
                label: 'Add Context',
                content: (
                    <DocumentPanel
                        mdContent={irtvContent}
                        setMdContent={setIrtvInput}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType='left'
                    />
                )
            }
        ],
        defaultTab: 'model'
    };

    const rightPanelContent = {
        tabs: [
            {
                key: 'preview',
                label: 'Model Preview',
                content: (
                    <OutputPanel
                        irtvPreview={irtvPreview}
                        setIrtvPreview={setIrtvPreview}
                        irtvContent={irtvContent}
                        setIrtvContent={setIrtvContent}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType='right'
                    />
                )
            }
        ],
        defaultTab: 'preview'
    };

    return (
        <div className="flex flex-col h-screen bg-background text-gray-100">
            <ThreePanelLayout
                moduleOperations={<FileOperations />}
                leftPanelContent={leftPanelContent}
                rightPanelContent={rightPanelContent}
                showLeftPanel={showLeftPanel}
                setShowLeftPanel={setShowLeftPanel}
                showRightPanel={showRightPanel}
                setShowRightPanel={setShowRightPanel}
                className="h-full min-w-0 bg-background text-gray-100"
            >
                <div className="flex flex-col flex-grow bg-background text-gray-100 h-full">
                    <Tabs defaultValue="ai-irtv" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0 h-full">

                        {/* Tab Structure with Left and Right buttons */}
                        <div className="flex items-center justify-between">
                            {/* Tabs */}
                            <TabsList className="grid grid-cols-4 bg-primary-foreground my-0 h-7 flex-1 mx-2 relative z-10">
                                <TabsTrigger
                                    value="ai-irtv"
                                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                    title="AI Modelling Assistant"
                                >                                          
                                Modelling Assistant
                                </TabsTrigger>
                                <TabsTrigger
                                    value="universe"
                                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"

                                    title="Current Universe"
                                >
                                    Current Model Universe
                                </TabsTrigger>
                                <TabsTrigger
                                    value="model"
                                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=active]:bg-gray-100/90 data-[state=active]:text-gray-600 data-[state=inactive]:border-gray-600/30 relative z-20"
                                    title="Model Universe"
                                >
                                    <Package className="w-4 h-4" />
                                    Model
                                </TabsTrigger>
                                <TabsTrigger
                                    value="saved-chat"
                                    className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    Saved Chats
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        {/* AI Assistant */}
                        <TabsContent value="ai-irtv" className="flex-1 px-1 mt-1 h-full">
                            <div className="flex-1 overflow-auto bg-gray-800/20 h-full">
                                <IrtvBuilderComponent
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
                                    gettingStartedGuide={<GettingStartedGuide />}
                                    guide={<Guide />}
                                />
                            </div>
                        </TabsContent>
                        {/* Current Domain */}

                        <TabsContent value="universe" className="flex-1 px-1 mt-0">
                            <div className="flex-1 overflow-auto bg-gray-800/20 p-0">
                                <UniverseComponent />
                            </div>
                        </TabsContent>
                        {/* Model */}
                        <TabsContent value="model" className="flex-1 mt-1 overflow-hidden h-full">
                            <iframe
                                style={{ height: "100%", width: "100%" }}
                                ref={iframeRef}
                                src="http://localhost:3000/modelling"
                                className="w-full h-full border-none rounded"
                                title="Embedded Mimris Modeller"
                                allow="clipboard-read; clipboard-write"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        </TabsContent>
                        <TabsContent value="saved-chat" className="flex-1 px-1 mt-1 h-full">
                            <div className="p-2 h-full">
                                <ConversationsPanel
                                    conversations={conversations}
                                    onSelectConversation={handleSelectConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    onSaveConversation={handleSaveCurrentConversation}
                                    currentMessages={currentMessages} // Pass this prop to enable/disable save button
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ThreePanelLayout>

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
                                    disabled={!documents || documents.length === 0}
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
    );
}
export default IrtvBuilderPage;