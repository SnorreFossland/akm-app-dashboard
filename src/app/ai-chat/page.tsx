'use client';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import mermaid from 'mermaid';
import { RootState } from '@/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import { saveMarkdownDocument } from '@/features/documents/markdownSlice';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from "@/components/FileOperations";

export interface ChatComponentProps {
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    error?: string; // Optional error prop
    chatInput?: string;
    input: string;
    setInput: (input: string) => void;
    setMdContent: (message: string) => void;
    mdContent: string;
    onAddMD?: () => void;
}

const AIChatPage = () => {
    const dispatch = useDispatch();
    const documents = useSelector((state: RootState) => state.markdown.documents);
    

    const [input, setInput] = useState<string>("");
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
    const [mdContent, setMdContent] = useState<string>('')
    const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model

    // replace your single openLibraryButtonRef with two refs:
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const [currentDocument, setCurrentDocument] = useState<string>(documents.length > 0 ? documents[0].content : '');
    const mdFileInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New state variables for conversations
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);
    const [showGuideModal, setShowGuideModal] = useState(false);

    const [lastResponse, setLastResponse] = useState<string>('');
    const [activeTab, setActiveTab] = useState("chat");
    const [editableContent, setEditableContent] = useState('');
    const [domainContent, setDomainContent] = useState('');

    // Initialize mermaid when component mounts
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

    // Add this useEffect to load saved conversations from localStorage
    useEffect(() => {
        const storedConversations = localStorage.getItem('savedConversations');
        if (storedConversations) {
            try {
                const parsedConversations = JSON.parse(storedConversations);
                setConversations(parsedConversations);
                console.log('Loaded saved conversations:', parsedConversations);
            } catch (error) {
                console.error('Error parsing saved conversations:', error);
            }
        }
    }, []);

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
                            createdAt: doc.createdAt || new Date().toISOString()
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

    // New handler functions for conversations
    const handleSelectConversation = (conversation: any) => {
        // Logic to load a saved conversation into the chat
        // You would need to integrate this with your ChatComponent
        console.log('Selected conversation:', conversation);
    };

    const handleDeleteConversation = (id: string) => {
        setConversations(conversations.filter(conv => conv.id !== id));
        // Also remove from local storage if you're using that
        const storedConversations = JSON.parse(localStorage.getItem('savedConversations') || '[]');
        localStorage.setItem('savedConversations',
            JSON.stringify(storedConversations.filter((conv: any) => conv.id !== id))
        );
    };

    const handleSaveCurrentConversation = () => {
        console.log('Current messages to save:', currentMessages);

        // Don't allow saving if no messages
        if (!currentMessages || currentMessages.length === 0) {
            alert("No messages to save. Please have a conversation first.");
            return;
        }

        // Extract the first sentence from the first user message or after #content marker
        let title = '';
        if (currentMessages && currentMessages.length > 0) {
            // First, check if any message contains #content marker
            const contentMarkerMessage = currentMessages.find(msg =>
                typeof msg.content === 'string' && msg.content.includes('#content')
            );

            if (contentMarkerMessage) {
                // Extract text after #content
                const contentParts = contentMarkerMessage.content.split('#content');
                if (contentParts.length > 1) {
                    // Find the first sentence after #content
                    const match = contentParts[1].match(/^\s*(.*?[.!?])/);
                    if (match) {
                        title = match[1].trim();
                    }
                }
            }
            if (!title) {
                const firstAssistantMessage = currentMessages.find(msg => msg.role === 'assistant');
                if (firstAssistantMessage && firstAssistantMessage.content) {
                    const match = firstAssistantMessage.content.match(/^.*?[.!?]/);
                    title = match ? match[0].trim() : firstAssistantMessage.content.trim().substring(0, 50);
                }
            }
            console.log('266 Extracted title from #content:', title, contentMarkerMessage, currentMessages);
            // If no title from #content, fall back to first user message
            if (!title) {
                const firstUserMessage = currentMessages.find(msg => msg.role === 'user');
                if (firstUserMessage && firstUserMessage.content) {
                    // Extract the first sentence - look for the first period, question mark, or exclamation
                    const match = firstUserMessage.content.match(/^.*?[.!?]/);
                    title = match ? match[0].trim() : firstUserMessage.content.trim().substring(0, 50);
                }
            }

            // If it's too long, truncate it
            if (title.length > 50) {
                title = title.substring(0, 47) + '...';
            }
        }

        // If we couldn't extract a title, use a default title with timestamp
        if (!title) {
            title = `Conversation ${new Date().toLocaleString()}`;
        }

        const newConversation = {
            id: Date.now().toString(),
            title,
            date: new Date().toLocaleString(),
            messages: currentMessages,
        };

        const updatedConversations = [...conversations, newConversation];
        setConversations(updatedConversations);

        // Save to localStorage for persistence
        localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));

        alert(`Conversation "${title}" saved successfully!`);
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
                key: 'guide',
                label: 'Guide',
                content: (
                    <div className="space-y-4 p-1 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                            <h3 className="text-lg font-medium text-secondary-foreground/70">1. Ask a Question Directly</h3>
                            <div className='ms-2'>Type or paste your question in the provided input area.</div>
                            <ul className="list-disc pl-4 text-secondary-foreground/70">
                                <li>Click the <span className="text-blue-200">Send ↑</span> button to submit your question.</li>
                                <li>Alternatively, you can quickly press the <span className="text-blue-200">Enter</span> key 2 times to send your question.</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                            <h3 className="text-lg font-medium text-secondary-foreground/70">2. Use Prompt Templates</h3>
                            <div className='ms-2'>Select a prompt template from the dropdown menu above the upper right corner of the input area.</div>
                            <ul className="list-disc pl-6 mt-1 text-secondary-foreground/70">
                                <li>You can type or paste additional text under the template text.</li>
                                <li>
                                    <span className="inline-flex items-center">
                                        Open the left panel (Click on the upperleft icon
                                        <svg className="mx-1 inline-block" width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </span> to access the left panel.)
                                    You can add text in the <span className="text-blue-200">Current Context.</span>This text will be used as context for the prompt.
                                </li>
                                <li>You can also click <FileText className="inline w-4 h-4 mr-1" />, to add a local text-file to use as context for your prompt.</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
                            <h3 className="text-lg font-medium text-secondary-foreground/70">3. You can refine a document or text.</h3>
                            <ul className="list-disc pl-6 mt-1 text-secondary-foreground/70">
                                <li>Alt. 1: Click the <span className="text-blue-200"> <FileText className="inline w-4 h-4 mx-1 mb-1" /> Load a file</span> button above the input area to select a local file to enhance or refine. (a new set of templates will appear).
                                </li>
                                <li>Alt. 2: Click the upper left button to open the left panel, then Context tab. <br />
                                    (The document text will be inserted and used as context for your prompt.)</li>
                            </ul>
                        </div>
                    </div>
                )
            },
            {
                key: 'context',
                label: 'Context',
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

    // Define right panel content
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
                // showAppHeader={true} // We'll handle the header ourselves for the tabs
            >
                <div className="flex flex-col h-full bg-background text-gray-100">
                    <Tabs defaultValue="chat" className="flex flex-col h-full">
                        <div className="flex items-center justify-between bg-primary-foreground px-2">
                            {/* Tabs */}
                            <TabsList className="grid grid-cols-3 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10">
                                <TabsTrigger
                                    value="chat"
                                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    AI Chat
                                    <span
                                        onClick={() => setShowGuideModal(true)}
                                        className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 border-b-0 rounded-full pl-1"
                                        title="Open guide"
                                    >
                                        <HelpCircle className="h-3 w-3 ms-5" />
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="saved-documents"
                                    className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    Current Document
                                    <span
                                        onClick={() => setShowGuideModal(true)}
                                        className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                                        title="Open guide"
                                    >
                                        <HelpCircle className="h-3 w-3 mx-2" />
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="saved-chat"
                                    className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                                >
                                    Saved Chats
                                    <span
                                        onClick={() => setShowGuideModal(true)}
                                        className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                                        title="Open guide"
                                    >
                                        <HelpCircle className="h-3 w-3 mx-2" />
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Chat Component */}
                        <TabsContent value="chat" className="flex-1 px-1 mt-1 overflow-hidden">
                            <div className="h-full overflow-auto bg-gray-800/20 rounded">
                                <ChatComponent
                                    input={input}
                                    setInput={setInput}
                                    selectedModel={selectedModel}
                                    setSelectedModel={setSelectedModel}
                                    onResponseChange={handleResponseChange}
                                    onViewInMarkdown={handleViewInMarkdown}
                                    setShowLeftPanel={() => { }} // This is now handled by ThreePanelLayout
                                    chatInput={chatInput}
                                    onAddMD={handleAddMD}
                                    mdContent={mdContent}
                                    setMdContent={setMdContent}
                                    mdPreview={mdPreview}
                                    setMdPreview={setMdPreview}
                                    setCurrentMessages={setCurrentMessages}
                                    gettingStartedGuide={<GettingStartedGuide />}
                                />
                            </div>
                        </TabsContent>

                        {/* Saved Documents */}
                        <TabsContent value="saved-documents" className="flex-1 px-1 mt-1 overflow-hidden">
                            <div className="bg-background rounded-lg p-4 h-full overflow-auto">
                                <DocumentPanel
                                    mdContent={currentDocument}
                                    setMdContent={setCurrentDocument}
                                    setIsLibraryOpen={setIsLibraryOpen}
                                    isLibraryOpen={isLibraryOpen}
                                    panelType='middle'
                                />
                                {/* <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
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
                                        <button
                                            onClick={handleImportLibrary}
                                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                                        >
                                            <span>Import Library</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400 mb-2 overflow-auto">
                                    <MarkdownLibrary
                                        onSelect={handleDocumentSelect}
                                        onShowInLeftPanel={handleShowInLeftPanel}
                                        hideExportLibraryButton={false}
                                    />
                                </div> */}
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
                                    currentMessages={currentMessages}
                                    onViewInMarkdown={handleViewInMarkdown}
                                    mdPreview={mdPreview}
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
                        className="bg-background rounded-lg p-4 w-[600px] max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
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
                                <button
                                    onClick={handleImportLibrary}
                                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                                >
                                    <span>Import Library</span>
                                </button>
                                <button
                                    onClick={() => setIsLibraryOpen(false)}
                                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                            <MarkdownLibrary
                                onSelect={handleDocumentSelect}
                                onShowInLeftPanel={handleShowInLeftPanel}
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
