'use client';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import mermaid from 'mermaid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '@/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import { saveMarkdownDocument, setCurrentDocument, updateProjectInfo, MarkdownDocument } from '@/features/model-universe/modelSlice';
import extractDomainNameAndDescription from '@/components/ai-chat/docExtraction';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import Guide from '@/components/ai-chat/Guide';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FloatingActionButtons } from '@/components/FloatingActionButtons';
import { FileOperations } from "@/components/FileOperations";
import {
    saveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation
} from '@/features/chat/chatSlice';
import DocumentTemplateSelector, { DocumentTemplate } from '@/components/ai-chat/DocumentTemplateSelector';

export interface ChatComponentProps {
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    setShowRightPanel?: (show: boolean) => void; // Add this new prop
    error?: string;
    chatInput?: string;
    input: string;
    setInput: (input: string) => void;
    setMdContent: (message: string) => void;
    mdContent: string;
    onAddMD?: () => void;
    currentDocument?: string;
    mdPreview: string;
    setMdPreview: (preview: string) => void;
    setCurrentMessages: (messages: any[]) => void;
    gettingStartedGuide: React.ReactNode;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
}

const AIChatPage = () => {
    const dispatch = useDispatch();
    const data = useSelector((state: RootState) => state.modelUniverse);
    const metis = useSelector((state: { modelUniverse: any }) => data.phData.metis);
    const documents = useSelector((state: RootState) => data.phData.documents);
    const focusProject = useSelector((state: RootState) => state.modelUniverse.phFocus.focusProj);
    const currentDocument = useSelector((state: RootState) => state.modelUniverse.phData.currentDocument);
    const domain = data?.phData?.domain;

    const [currentModel, setCurrentModel] = useState<any | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);

    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [focusModelLocal, setFocusModelLocal] = useState<{ id: string; name: string } | null>(null);
    const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    // Get chat data from Redux
    const messages = useSelector((state: RootState) => state.chat.currentMessages);
    const conversations = useSelector((state: RootState) => state.chat.conversations);
    const activeConversationId = useSelector((state: RootState) => state.chat.activeConversationId);

    const [input, setInput] = useState<string>("");
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
    const [mdContent, setMdContent] = useState<string>('')
    const [selectedModel, setSelectedModel] = useState('gpt-5-mini'); // Default model
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [lastResponse, setLastResponse] = useState<string>("");

    // replace your single openLibraryButtonRef with two refs:
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState('Markdown');
    const mdFileInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSetCurrentDocument = (content: string) => {
        dispatch(setCurrentDocument(content));
    };

    const summariseContent = (content: string) => {
        const { description } = extractDomainNameAndDescription(content || '');
        const fallback = content ? content.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
        return description?.trim() ? description.trim() : fallback;
    };

    const updateProjectFromDocument = (content: string, name: string, doc?: MarkdownDocument) => {
        if (!content) {
            return;
        }

        const summary = summariseContent(content);
        const projectId = doc?.id || `project-${Date.now()}`;
        const projectName = name?.trim() ? name : 'Project Document';

        dispatch(updateProjectInfo({
            id: projectId,
            name: projectName,
            description: summary || 'No summary available.',
        }));
    };

    // Update conversation handlers to use Redux actions
    const handleSelectConversation = (conversation: any) => {
        if (conversation) {
            dispatch(loadConversation(conversation.id));
        } else {
            dispatch(startNewConversation());
        }
        console.log('Selected conversation:', conversation);
    };

    const handleDeleteConversation = (id: string) => {
        dispatch(deleteConversation(id));
    };

    const handleSaveCurrentConversation = () => {
        console.log('Current messages to save:', messages);

        // Don't allow saving if no messages
        if (!messages || messages.length === 0) {
            alert("No messages to save. Please have a conversation first.");
            return;
        }

        // Save using Redux action (title will be auto-generated)
        dispatch(saveConversation({}));
    };

    useEffect(() => {
        const foundModel = data?.phData?.metis?.models.find(model => model.id === data.phFocus?.focusModel?.id) || null;
        setCurrentModel(foundModel);
        setCurMetamodel((data?.phData?.metis?.metamodels as { id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] }[]).find(metamodel => metamodel.id === foundModel?.metamodelRef) || null);
    }, [data]);

    const handleStartNewConversation = () => {
        dispatch(startNewConversation());
    };

    // Update setCurrentMessages to just be a no-op since we're using Redux
    const setCurrentMessages = (messages: any[]) => {
        // This is now handled by Redux, so we don't need to do anything here
        // The messages prop in ChatComponent will come from Redux selector
    };

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768); // Set mobile breakpoint at 768px
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);
    // Initialize mermaid when 
    // component mounts
    useEffect(() => {
        mermaid.initialize({
            theme: 'dark',
            securityLevel: 'loose'
        });
        mermaid.contentLoaded();
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            flowchart: { curve: 'linear' },
            sequence: { showSequenceNumbers: true },
            themeVariables: {
                primaryColor: '#1e3a8a',
                edgeLabelBackground: '#334155',
                edgeLabelBorder: '#1e3a8a',
            }
        });
    }, []);

    useEffect(() => {
        if (mdPreview && mdPreview.includes('mermaid') && !isEditing) {
            setTimeout(() => {
                mermaid.run();
            }, 0);
        }
    }, [mdPreview, isEditing]); // Add 'isEditing' to the dependency array

    useEffect(() => {
        // Only update the document name if it's currently empty and we have markdown content
        if (!docName && mdPreview) {
            const firstLine = mdPreview.split('\n')[0] || '';
            // Get the first line and clean it up
            const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_').trim();
            if (cleanName) {
                setDocName(cleanName);
            }
        }
    }, [mdPreview, docName]);

    // Remove the useEffect that was trying to use setConversations (it doesn't exist)
    // The conversations are now loaded from Redux state automatically

    // Load currentDocument from localStorage on mount and prime Redux state
    useEffect(() => {
        const storedCurrentDocument = localStorage.getItem('currentDocument');
        if (storedCurrentDocument && storedCurrentDocument !== currentDocument) {
            dispatch(setCurrentDocument(storedCurrentDocument));
        }
    }, [dispatch]);

    useEffect(() => {
        if (focusProject?.id || focusProject?.description) {
            const matchingDoc = documents?.find((doc) => doc.id === focusProject.id);
            if (matchingDoc) {
                setMdContent(matchingDoc.content);
                setDocName(matchingDoc.name);
                setDocType(normalizeDocumentType(matchingDoc.type));
            } else if (focusProject.description) {
                const fallbackContent = focusProject.description;
                setMdContent(fallbackContent);
                if (focusProject.name) {
                    setDocName(focusProject.name);
                }
            }
        }
    }, [focusProject, documents]);

    // Persist currentDocument so refreshes and other contexts can reuse it
    useEffect(() => {
        if (currentDocument) {
            localStorage.setItem('currentDocument', currentDocument);
        } else {
            localStorage.removeItem('currentDocument');
        }
    }, [currentDocument]);

    // Keep Redux in sync with storage changes (other tabs or legacy emitters)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'currentDocument') {
                const newValue = e.newValue ?? '';
                if (newValue !== currentDocument) {
                    dispatch(setCurrentDocument(newValue));
                }
            }
        };

        const handleCustomStorageChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.key === 'currentDocument') {
                const newValue = customEvent.detail?.newValue ?? '';
                if (newValue !== currentDocument) {
                    dispatch(setCurrentDocument(newValue));
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('localStorageChange', handleCustomStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localStorageChange', handleCustomStorageChange);
        };
    }, [currentDocument, dispatch]);

    // const handleShowRightPanel = () => {
    //     if (rightPanelToggleRef.current) {
    //         rightPanelToggleRef.current();
    //     }
    // };
    const normalizeDocumentType = (type?: string) => {
        if (!type) return 'Markdown';
        const trimmed = type.trim();
        if (!trimmed) return 'Markdown';

        // Handle hyphenated types: "project-plan" -> "Project-Plan"
        return trimmed
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');
    };

    const handleShowInLeftPanel = (content: string, name: string, doc?: MarkdownDocument) => {
        setMdContent(content);
        setDocName(name);
        updateProjectFromDocument(content, name, doc);
        console.log("Selected document from library:", { content, name });
    };

    const handleDocumentSelect = (content: string, name: string, doc?: MarkdownDocument) => {
        setMdContent(content);
        setDocName(name);
        setIsEditing(false);
        setIsLibraryOpen(false); // Close the library modal after selection
        updateProjectFromDocument(content, name, doc);
        console.log("Selected document from library:", { content, name });
    };

    const handleApplyCurrentDocument = (content: string, name?: string, doc?: MarkdownDocument) => {
        handleSetCurrentDocument(content);
        if (name) {
            setDocName(name);
        }
        setDocType(normalizeDocumentType(doc?.type));
        setIsEditing(false);
        setIsLibraryOpen(false);
    };

    const handleAddMD = () => {
        mdFileInputRef.current?.click()
    }

    const handleExportLibrary = () => {
        if (documents.length === 0) return;

        // Create a JSON file from the documents
        const dataStr = JSON.stringify(documents, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

        // Create and trigger a download link
        const exportFileName = `aichat-doc-library-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    };

    const handleImportLibrary = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedDocuments = JSON.parse(event.target?.result as string);

                // Validate the imported data structure
                if (Array.isArray(importedDocuments) && importedDocuments.every(doc =>
                    typeof doc === 'object' && doc !== null &&
                    'id' in doc && 'name' in doc && 'content' in doc)) {

                    // Import each document to Redux
                    importedDocuments.forEach(doc => {
                        dispatch(saveMarkdownDocument({
                            id: doc.id || Date.now().toString(),
                            name: doc.name,
                            type: 'markdown',
                            content: doc.content,
                            createdAt: doc.createdAt || new Date().toISOString(),
                            updatedAt: doc.updatedAt || new Date().toISOString()
                        }));
                    });

                    alert(`Successfully imported ${importedDocuments.length} documents`);
                } else {
                    alert('Invalid file format. Import failed.');
                }
            } catch (error) {
                console.error('Error importing library:', error);
                alert('Failed to import library. Invalid JSON format.');
            }
        };

        reader.readAsText(file);
        e.target.value = ''; // Reset the file input
    };

    const handleResponseChange = (response: string) => { setLastResponse(response) };

    const handleViewInMarkdown = (response: string) => {
        const cleanResponse = (response: string) => {
            const cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
            const cleaned2 = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
            return cleaned2;
        };
        const cleanedResponse = cleanResponse(response);
        setMdPreview(cleanedResponse);
    };

    // Simple Modal component
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
            // Removed dispatch call for setFocusModel as it is not defined; local state is already updated.
        }
        // if (selectedModel) {
        //   setCurrentModelview(selectedModel.modelviews[0]);
        // }
    };

    const handleModelviewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    };

    // Define left panel content
    const leftPanelContent = {
        tabs: [
            {
                key: 'current-content',
                label: 'Current Domain',
                content: (
                    <div className="space-y-4 px-2 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        {domain?.presentation ? (
                            <div className="p-2 bg-gray-800 rounded">
                                <MarkdownPreview mdPreview={domain.presentation} />
                            </div>
                        ) : (
                            <div className="p-2 bg-gray-800 rounded">
                                <div className="text-sm text-gray-400">No domain found</div>
                            </div>
                        )}
                    </div>
                )
            },
            {
                key: 'projects',
                label: 'Projects',
                content: (
                    <DocumentPanel
                        mdContent={mdContent}
                        setMdContent={setMdContent}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType='left'
                        showDocumentList
                        onNewDocument={() => setShowTemplateSelector(true)}
                    />
                )
            },
        ],
        defaultTab: 'current-content'
    };

    // Define middle panel content
    const middlePanelContent = {
        tabs: [
            {
                key: 'current',
                label: 'Current Document',
                content: (
                    <div className="flex flex-col bg-background rounded-lg h-[calc(100vh-9rem)] overflow-hidden">
                        <div className="flex-grow overflow-hidden">
                            <DocumentPanel
                                mdContent={currentDocument}
                                setMdContent={handleSetCurrentDocument}
                                setIsLibraryOpen={setIsLibraryOpen}
                                isLibraryOpen={isLibraryOpen}
                                panelType='middle'
                                currentDocumentContent={currentDocument}
                                markdownPreviewContent={mdPreview}
                                documentName={docName}
                                documentType={docType}
                                onSelect={(content, name, doc) => handleApplyCurrentDocument(content, name, doc)}
                                onNewDocument={() => setShowTemplateSelector(true)}
                            />
                        </div>
                    </div>
                )
            },
        ],
        defaultTab: 'current'
    };
    // Define right panel content
    const rightPanelContent = {
        tabs: [
            {
                key: 'reports',
                label: 'Reports',
                content: (
                    <DocumentPanel
                        mdContent={mdPreview}
                        setMdContent={setMdPreview}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType='right'
                        currentDocumentContent={currentDocument}
                        markdownPreviewContent={mdPreview}
                        documentName={docName}
                        documentType={docType}
                        onNewDocument={() => setShowTemplateSelector(true)}
                    />
                )
            }
        ],
        defaultTab: 'reports'
    };

    const modelSelector = (false) ? (
        <div className="flex justify-between bg-gray-800 text-xs">
            <div className="px-1">
                <span className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</span>
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
    ) : (
        <div className="flex justify-between bg-gray-800 text-xs">
            <div className="px-1">
                <label htmlFor="metamodel-select" className="ms-1 font-bold text-gray-400 inline-block">Document:</label>
                <span className="text-gray-300">{(documents as any)?.[0]?.name}</span>
            </div>
        </div>
    )

    const floatingActions = [
        {
            label: 'AI Assistant',
            href: '/ai-chat/aiAssistant',
            icon: <FontAwesomeIcon icon={faComments} className="w-5 h-5" />,
            className: 'text-blue-300 ring-blue-900/50',
        },
        {
            label: 'Edit Document',
            href: '/ai-chat/edit',
            icon: <Edit className="w-5 h-5" />,
            className: 'text-emerald-300 ring-emerald-900/50',
        },
    ];

    const handleTemplateSelect = (template: DocumentTemplate) => {
        // Clear old content first
        setMdContent('');
        setMdPreview('');

        // Set new template content and metadata using template name and type
        setMdContent(template.content);
        setDocName(template.name);  // Use template name
        setDocType(normalizeDocumentType(template.type));  // Use template type

        // Update Redux current document
        dispatch(setCurrentDocument(template.content));
        // Save the template as a document to make it available across pages
        const templateDoc: MarkdownDocument = {
            id: `template-${Date.now()}`,
            name: template.name,
            type: template.type,
            content: template.content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        dispatch(saveMarkdownDocument(templateDoc));

        // Update project info in Redux
        updateProjectFromDocument(template.content, template.name, templateDoc);

        setShowTemplateSelector(false);
    };

    return (
        <div className="flex-1 flex-col h-screen">
            <div className="w-full border-b-2 border-gray-600">
                <FileOperations />
            </div>
            <ThreePanelLayout
                moduleOperations={modelSelector}
                leftPanelContent={leftPanelContent}
                middlePanelContent={middlePanelContent}
                rightPanelContent={rightPanelContent}
                showLeftPanel={showLeftPanel}
                setShowLeftPanel={setShowLeftPanel}
                showRightPanel={showRightPanel}
                setShowRightPanel={setShowRightPanel}
                className="h-[calc(100vh-2.5rem)] min-w-0 bg-background text-gray-100"
            >
                <></>
            </ThreePanelLayout>

            {/* Floating "Open AI Assistant" button - Centered with chat icon */}
            <FloatingActionButtons actions={floatingActions} className="bottom-2" />

            {/* Template Selector Modal */}
            {showTemplateSelector && (
                <DocumentTemplateSelector
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}

            {/* Library Modal */}
            {isLibraryOpen && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50"
                    onClick={() => setIsLibraryOpen(false)}
                >
                    <div
                        className="bg-background rounded-lg p-4 w-[80%] max-w-4xl max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleImportLibrary}
                                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                                >
                                    <span>Import Documents from File</span>
                                </button>
                                <button
                                    onClick={handleExportLibrary}
                                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                                    disabled={documents?.length === 0}
                                >
                                    Save Documents to File
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelection}
                                    accept=".json"
                                    style={{ display: 'none' }}
                                />

                                <button
                                    onClick={() => setIsLibraryOpen(false)}
                                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 rounded"
                                >
                                    X
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2 max-h-[80vh] overflow-auto">
                            <MarkdownLibrary
                                onSelect={handleDocumentSelect}
                                onShowInLeftPanel={handleShowInLeftPanel}
                                onSetCurrentDocument={(content, name, doc) => handleApplyCurrentDocument(content, name, doc)}
                                currentDocument={currentDocument}
                                hideExportLibraryButton={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Guide Modal */}
            <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
                <GettingStartedGuide />
            </Modal>
        </div>
    );
};

export default AIChatPage;
