'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed, ListStart, List } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, Package } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

import { LoadingCircularProgress } from "@/components/loading";

// Import components (note the correct file name)
import UniverseComponent from "@/features/model-universe/components/UniverseComponent";
import IrtvBuilderComponent from '@/components/irtv-builder/IrtvBuildercomponent';

import ModelComponent from '@/features/model-universe/components/ModelComponent';
import { OntologyCard } from '@/components/ontology-card';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import OutputPanel from '@/components/irtv-builder/OutputPanel';
import ConversationsPanel from '@/components/irtv-builder/ConversationsPanel';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
import Guide from '@/components/irtv-builder/Guide';

import { ObjectCard } from '@/components/object-card';

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
    const metis = useSelector((state: { modelUniverse: any }) => data.phData.metis);
    const ontology = useSelector((state: { modelUniverse: any }) => data.phData.domain?.ontology);
    const domain = useSelector((state: { modelUniverse: any }) => data.phData.domain);
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

    const [currentOntology, setCurrentOntology] = useState<any>(data.phData?.domain?.ontology || null);
    const [currentDomain, setCurrentDomain] = useState<any>(data.phData?.domain || null);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    // const [metis, setMetis] = useState<Metis | null >(null);
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [model, setModel] = useState<Model>(currentModel ?? { id: '', name: '', description: '', objects: [], relships: [], metamodelRef: '', modelviews: [] });
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [focusModelLocal, setFocusModelLocal] = useState<{ id: string; name: string } | null>(null);
    const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);
    const [isModelviewOpen, setIsModelviewOpen] = useState(false);
    const [isModelviewEditOpen, setIsModelviewEditOpen] = useState(false);

    const [showModel, setShowModel] = useState(true);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(currentModelview ?? { id: '', name: '', description: '', objectviews: [], relshipviews: [] });

    // Panel state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'model' | 'other-context'>('other-context');

    const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
    // IRTV Builder specific state
    const [irtvContent, setIrtvContent] = useState<string | Model | null>('');
    const [irtvPreview, setIrtvPreview] = useState('');
    const [selectedModel, setSelectedModel] = useState< "dummy" | "deepseek-chat" | "mistral"  | "gpt-5" | "gpt-5-mini">("gpt-5-mini");
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
        setCurMetamodel((data?.phData?.metis?.metamodels as { id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] }[]).find(metamodel => metamodel.id === currentModel?.metamodelRef) || null);
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

    const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedModel = data.phData.metis.models.find(model => model.name === event.target.value);
        setCurrentModel(selectedModel || null);
        setFocusModelLocal(selectedModel || null);
        setFocusModelview(selectedModel?.modelviews[0] || null);
        if (selectedModel) {
            dispatch(setFocusModel({ id: selectedModel.id, name: selectedModel.name }));
        }
        // if (selectedModel) {
        //   setCurrentModelview(selectedModel.modelviews[0]);
        // }
    };

    const handleModelviewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    };

    // IRTV Builder handlers
    const handleIrtvResponseChange = (response: string) => {
        // Handle IRTV response logic
        console.log('IRTV Response:', response);
    };

    const handleViewInIrtvPreview = (response: string) => {
        const cleanResponse = (response: string) => {
            const cleaned = response.trim();
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

    const handleViewInMarkdown = (response: string) => {
        const cleanResponse = (response: string) => {
            const cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
            const cleaned2 = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
            return cleaned2;
        };
        const cleanedResponse = cleanResponse(response);
        setMdPreview(cleanedResponse);
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
                label: 'Current Ontology',
                content: (
                    <div className="grid gap-4">
                        {ontology ? (
                            <OntologyCard domainData={domain} ontologyData={ontology} />
                        ) : (
                            <div className="text-center py-8">
                                <Network className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">No ontologies defined yet</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Use the Ontology Builder to create your first ontology
                                </p>
                            </div>
                        )}
                    </div>
                )
            },
            {
                key: 'other-context',
                label: 'Add Context',
                content: (
                    <DocumentPanel
                        mdContent={typeof irtvContent === 'string' ? irtvContent : ''}
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

    const middlePanelContent = {
        tabs: [
            {
                key: 'ai-irtv',
                label: 'AI Modelling Assistant',
                content: (
                    <div className="flex-1 overflow-auto bg-gray-800/20 h-full">
                        <IrtvBuilderComponent
                            input={irtvInput}
                            setInput={setIrtvInput}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            onResponseChange={handleIrtvResponseChange}
                            onViewInMarkdown={handleViewInMarkdown}
                            onViewInPreview={handleViewInIrtvPreview}
                            setShowLeftPanel={setShowLeftPanel}
                            onAddContent={handleAddContent}
                            irtvContent={typeof irtvContent === 'string' ? irtvContent : ''}
                            setIrtvContent={setIrtvContent}
                            irtvPreview={irtvPreview}
                            setIrtvPreview={setIrtvPreview}
                            setCurrentMessages={setCurrentMessages}
                            gettingStartedGuide={<GettingStartedGuide />}
                            guide={<Guide />}
                        />
                    </div>
                ),
            },
            {
                key: 'suite',
                label: currentModel?.name || 'Model',
                content: (
                    <div className="space-y-4">
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
                                metamodelRef: currentModel.metamodelRef,
                                modelviews: currentModel.modelviews
                            }} />
                        )}
                    </div>
                )
            },
            {
                key: 'mimris',
                label: (
                    <span className="inline-flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {model?.name || 'Mimris'}
                    </span>
                ),
                content: (
                    <div className="w-full h-screen m-0 p-0">
                        <iframe
                            style={{ height: "100%", width: "100%" }}
                            ref={iframeRef}
                            src="https://mimris.vercel.app/modelling"
                            // src="http://localhost:3000/modelling"
                            className="w-full h-full border-none rounded"
                            title="Embedded Mimris Modeller"
                            allow="clipboard-read; clipboard-write"
                            sandbox="allow-same-origin allow-scripts"
                        />
                    </div>
                )
            },
        ],
        defaultTab: 'ai-irtv'
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

    const modelSelector = (
        <div className="flex justify-between bg-gray-800 text-xs">
            <div className="px-1">
                <label htmlFor="metamodel-select" className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</label>
                <span className="text-gray-300">{metis?.name}</span>
            </div>
            <div className="px-1">
                <label htmlFor="model-select" className="me-1 font-bold text-gray-400 inline-block">Current Model:</label>
                <select id="model-select" className="ps-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={handleModelChange} value={currentModel?.name}>
                    {metis?.models.map((model: { name: string }) => (
                        <option key={model.name} value={model.name}>{model.name}</option>
                    ))}
                </select>
            </div>
            <div className="px-1 me-auto">
                {/* <label htmlFor="model-view-select" className="me-2 font-bold text-gray-400 inline-block"></label> */}
                <span className="text-gray-400">{curMetamodel?.name || "Default"}</span>
            </div>
            <h3 className="flex ms-1 pl-1 font-bold text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length}</span></h3>
        </div>
    )

    return (
        <div className="flex-1 flex-row h-screen">
            <div className="w-full border-b-2 border-gray-600">
                <FileOperations />
            </div>
            <div className="flex flex-col h-screen bg-background text-gray-100">
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
        </div>
    );
}
export default IrtvBuilderPage;
