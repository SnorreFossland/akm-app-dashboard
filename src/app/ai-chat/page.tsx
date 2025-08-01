'use client';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import mermaid from 'mermaid';
import { RootState } from '@/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import { saveMarkdownDocument } from '@/features/model-universe/modelSlice'; // Updated import
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from "@/components/FileOperations";
import {
    saveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation
} from '@/features/chat/chatSlice';

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
    const [isMobile, setIsMobile] = useState(false);
    const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);

    // Get chat data from Redux
    const messages = useSelector((state: RootState) => state.chat.currentMessages);
    const conversations = useSelector((state: RootState) => state.chat.conversations);
    const activeConversationId = useSelector((state: RootState) => state.chat.activeConversationId);

    const [input, setInput] = useState<string>("");
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
    const [mdContent, setMdContent] = useState<string>('')
    const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model
    const [showGuideModal, setShowGuideModal] = useState(false);

    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [lastResponse, setLastResponse] = useState<string>("");

    // replace your single openLibraryButtonRef with two refs:
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const [currentDocument, setCurrentDocument] = useState<string>('');
    const mdFileInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Add useEffect to save currentDocument to localStorage whenever it changes
    useEffect(() => {
        console.log('currentDocument changed:', currentDocument?.substring(0, 100) || 'empty');
        if (currentDocument) {
            localStorage.setItem('currentDocument', currentDocument);
            console.log('Saved current document to localStorage');
        }
    }, [currentDocument]);

    // Load currentDocument from localStorage on mount
    useEffect(() => {
        const storedCurrentDocument = localStorage.getItem('currentDocument');
        if (storedCurrentDocument) {
            try {
                setCurrentDocument(storedCurrentDocument);
                console.log('Loaded current document from localStorage');
            } catch (error) {
                console.error('Error loading current document:', error);
            }
        }
    }, []);

    // Add this new useEffect to listen for localStorage changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // Only react to changes to the 'currentDocument' key
            if (e.key === 'currentDocument' && e.newValue !== null) {
                console.log('localStorage currentDocument changed externally:', e.newValue?.substring(0, 100) || 'empty');
                // Only update if the new value is different from current state
                if (e.newValue !== currentDocument) {
                    setCurrentDocument(e.newValue);
                    console.log('Updated currentDocument from localStorage change');
                }
            }
        };

        // Listen for storage events (fired when localStorage changes in other tabs/windows)
        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom events within the same tab
        const handleCustomStorageChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail.key === 'currentDocument' && customEvent.detail.newValue !== null) {
                console.log('Custom storage event for currentDocument:', customEvent.detail.newValue?.substring(0, 100) || 'empty');
                if (customEvent.detail.newValue !== currentDocument) {
                    setCurrentDocument(customEvent.detail.newValue);
                    console.log('Updated currentDocument from custom storage event');
                }
            }
        };

        window.addEventListener('localStorageChange', handleCustomStorageChange);

        // Cleanup event listeners
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localStorageChange', handleCustomStorageChange);
        };
    }, [currentDocument]);

    // const handleShowRightPanel = () => {
    //     if (rightPanelToggleRef.current) {
    //         rightPanelToggleRef.current();
    //     }
    // };
    const handleShowInLeftPanel = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
        console.log("Selected document from library:", { content, name });
    };

    const handleDocumentSelect = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
        setIsEditing(false);
        setIsLibraryOpen(false); // Close the library modal after selection
        console.log("Selected document from library:", { content, name });
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
            let cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
            cleaned = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
            return cleaned;
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

    // Define left panel content
    const leftPanelContent = {
        tabs: [
            {
                key: 'current-context',
                label: 'Current Context',
                content: (
                    <div className="space-y-4 p-2 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        Current context is the current document. You can edit it, save it, or load a new one.
                    </div>
                )
            },
            {
                key: 'context',
                label: 'Add. Context',
                content: (
                    <DocumentPanel
                        mdContent={mdContent}
                        setMdContent={setMdContent}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType='left'
                    />
                )
            },
        ],
        defaultTab: 'guide'
    };

    // Define right panel content with the new props
    const rightPanelContent = {
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <DocumentPanel
                        mdContent={mdPreview}
                        setMdContent={setMdPreview}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType='right'
                        currentDocumentContent={currentDocument} // Pass Current Document content
                        markdownPreviewContent={mdPreview} // Pass Markdown Preview content
                    />
                )
            }
        ],
        defaultTab: 'preview'
    };

    return (
        <>
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
                <div className="flex flex-col h-full min-w-0 bg-background text-gray-100">
                    <Tabs defaultValue="chat" className="flex flex-col h-full">
                        <div className="flex items-center justify-between bg-primary-foreground px-2 min-w-0">
                            {/* Tabs */}
                            <TabsList className="grid grid-cols-3 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10 min-w-0">
                                <TabsTrigger
                                    value="chat"
                                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    AI Chat
                                    {/* <span
                                        onClick={() => setShowGuideModal(true)}
                                        className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 border-b-0 rounded-full pl-1"
                                        title="Open guide"
                                    >
                                        <HelpCircle className="h-3 w-3 ms-5" />
                                    </span> */}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="current-document"
                                    className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    Current Doc
                                    {/* <span
                                        onClick={() => setShowGuideModal(true)}
                                        className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                                        title="Open guide"
                                    >
                                        <HelpCircle className="h-3 w-3 mx-2" />
                                    </span> */}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="saved-chat"
                                    className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    Saved Chats
                                    {/* <span
                                        onClick={() => setShowGuideModal(true)}
                                        className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                                        title="Open guide"
                                    >
                                        <HelpCircle className="h-3 w-3 mx-2" />
                                    </span> */}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Chat Component */}
                        <TabsContent value="chat" className="flex-1 px-1 mt-1 overflow-hidden">
                            <div className="h-full min-w-0 overflow-y-auto bg-gray-800/20 rounded">
                                <ChatComponent
                                    input={input}
                                    setInput={setInput}
                                    selectedModel={selectedModel}
                                    setSelectedModel={setSelectedModel}
                                    currentDocument={currentDocument}
                                    onResponseChange={handleResponseChange}
                                    onViewInMarkdown={handleViewInMarkdown}
                                    showLeftPanel={showLeftPanel}
                                    setShowLeftPanel={setShowLeftPanel}
                                    setShowRightPanel={setShowRightPanel}
                                    chatInput={chatInput}
                                    onAddMD={handleAddMD}
                                    mdContent={mdContent}
                                    setMdContent={setMdContent}
                                    mdPreview={mdPreview}
                                    setMdPreview={setMdPreview}
                                    setCurrentMessages={setCurrentMessages}
                                    gettingStartedGuide={<GettingStartedGuide />}
                                    isMobile={isMobile}
                                    setIsMobile={setIsMobile}
                                />
                            </div>
                        </TabsContent>

                        {/* Current Document */}
                        <TabsContent value="current-document" className="flex-1 px-1 mt-1 overflow-hidden">
                            <div className="bg-background rounded-lg p-4 h-full overflow-auto">
                                <div className="space-y-4">
                                    {/* Current Document Panel */}
                                    <DocumentPanel
                                        mdContent={currentDocument}
                                        setMdContent={setCurrentDocument}
                                        setIsLibraryOpen={setIsLibraryOpen}
                                        isLibraryOpen={isLibraryOpen}
                                        panelType='middle'
                                        currentDocumentContent={currentDocument}
                                        markdownPreviewContent={mdPreview}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Saved Conversations*/}
                        <TabsContent value="saved-chat" className="flex-1 px-1 mt-1 overflow-hidden">
                            <div className="p-2 h-full overflow-auto">
                                <ConversationsPanel
                                    conversations={conversations}
                                    onSelectConversation={handleSelectConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    onSaveConversation={handleSaveCurrentConversation}
                                    onViewInMarkdown={handleViewInMarkdown}
                                    mdPreview={mdPreview}
                                    currentMessages={messages}
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
                                onSetCurrentDocument={setCurrentDocument}  // Add this line
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
        </>
    );
};

export default AIChatPage;
