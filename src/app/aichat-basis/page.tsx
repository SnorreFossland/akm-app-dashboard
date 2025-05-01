'use client';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import mermaid from 'mermaid';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';

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
    const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'document' | 'conversations'>('document');
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>(''); // Markdown preview state
    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(550);
    const [input, setInput] = useState<string>("");
    const [editableContent, setEditableContent] = useState('');
    const [domainContent, setDomainContent] = useState('');
    const [selectedModel, setSelectedModel] = useState('mistral-small-latest'); // Default model
    const [lastResponse, setLastResponse] = useState<string>('');
    const documents = useSelector((state: RootState) => state.markdown.documents);
    const [documentPanelOpen, setDocumentPanelOpen] = useState(false);

    // replace your single openLibraryButtonRef with two refs:
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const mdFileInputRef = useRef<HTMLInputElement>(null)
    const [mdContent, setMdContent] = useState<string>('')
    const [forceRefresh, setForceRefresh] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New state variables for conversations
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentMessages, setCurrentMessages] = useState<any[]>([]);

    const handleAddMD = () => {
        mdFileInputRef.current?.click()
    }

    const handleExportLibrary = () => {
        if (documents.length === 0) return;

        // Create a JSON file from the documents
        const dataStr = JSON.stringify(documents, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

        // Create and trigger a download link
        const exportFileName = `markdown-library-${new Date().toISOString().split('T')[0]}.json`;
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

    // Check device type on component mount'
    useEffect(() => {
        const checkDeviceType = () => {
            // Only change panel state on initial load, not on every resize
            if (!showLeftPanel) {
                // You can enable this if you want panel to open on desktop initially
                const isDesktop = window.innerWidth >= 768;
            }
        };
        checkDeviceType();
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

    const handleSaveToRedux = () => {
        if (!docName.trim()) return;
        console.log('Saving to Redux:', {
            id: Date.now().toString(),
            name: docName,
            content: mdPreview
        });
        dispatch(saveMarkdownDocument({
            id: Date.now().toString(),
            name: docName,
            content: mdPreview,
            createdAt: new Date().toISOString()
        }));
        // Show success notification
        alert('Document saved to library');
        // Add this to check if documents are updated after dispatch
        console.log('Documents after save:', documents);
    };

    const handleSelectFromLibrary = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
        setIsEditing(false);
        setActiveLeftTab('document'); // Switch to document tab
        setIsLibraryOpen(false); // Close the library modal after selection

        console.log("Selected document from library:", { content, name });
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

    const MIN_PANEL_WIDTH = 80;
    const MAX_PANEL_WIDTH = () => window.innerWidth - 320; // leave at least 320px for the middle

    const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
        const startX = e.clientX;
        const startLeftWidth = leftPanelWidth;
        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startX;

            if (panel === 'left') {
                const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX));
                setLeftPanelWidth(newWidth);
            }
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleApplyTemplate = (content: string) => {
        console.log('93 Template content inserted:', content);
        setChatInput(content); // Update the chat input field
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
        setShowLeftPanel(false); // Hide the left panel when viewing markdown
    };

    // #region Main Layout
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-background text-gray-100">
            <div className="flex flex-row flex-nowrap h-[100dvh] min-w-[450px] w-full max-w-full bg-background text-gray-100 overflow-hidden">
                {/* Left Panel: Templates */}
                {showLeftPanel && (
                    <div
                        className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 min-w-[460px] sm:min-w-[360px] max-w-[95vw] overflow-auto"
                        style={{ width: `${leftPanelWidth}px` }}
                    >
                        <div className="flex justify-between items-center m-1 sm:m-2">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-400">
                                Input: {activeLeftTab === 'templates' ? 'Domain Topic' : 'Document'}
                            </h2>
                            <div className="markdown-preview-header">
                                <button
                                    onClick={() => setIsLibraryOpen(prev => !prev)}
                                    className="flex items-center text-xs bg-blue-800 hover:bg-blue-600 text-white px-2 py-1 whitespace-nowrap rounded"
                                >
                                    Library
                                </button>
                            </div>
                            {/* <button
                                onClick={() => setShowLeftPanel(!showLeftPanel)}
                                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2 rounded"
                            >
                                <span className="text-lg">{showLeftPanel ? '←' : '→'}</span>
                            </button> */}
                        </div>

                        {/* tabs */}
                        <ul className="flex border-b border-gray-600 mb-2 text-sm">
                            <li
                                className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'conversations'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('conversations')}
                            >
                                Conversations
                            </li>
                            <li
                                className={`px-3 py-1 cursor-pointer ${activeLeftTab === 'templates'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('templates')}
                            >
                                Templates
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

                        {/* tab content */}
                        {activeLeftTab === 'conversations' ? (
                            <div className="p-2">
                                <ConversationsPanel
                                    conversations={conversations}
                                    onSelectConversation={handleSelectConversation}
                                    onDeleteConversation={handleDeleteConversation}
                                    onSaveConversation={handleSaveCurrentConversation}
                                    currentMessages={currentMessages} // Pass this prop to enable/disable save button
                                />
                            </div>
                        ) : activeLeftTab === 'templates' ? (
                            <>
                                {/* hidden shared picker */}
                                <input
                                    ref={mdFileInputRef}
                                    type="file"
                                    accept=".md"
                                    className="hidden"
                                />
                                <TemplatesPanel
                                    onApplyTemplate={handleApplyTemplate}
                                    editableContent={editableContent}
                                    setEditableContent={setEditableContent}
                                    domainContent={domainContent}
                                    setDomainContent={setDomainContent}
                                    selectedModel={selectedModel}
                                    onAddMD={handleAddMD}
                                    mdContent={mdContent}
                                />
                            </>
                        ) : ( // Document tab (activeLeftTab === 'document')
                            (mdContent && mdContent.length > 0)
                                ?
                                <DocumentPanel
                                    mdContent={mdContent}
                                    setMdContent={setMdContent}
                                    setIsLibraryOpen={setIsLibraryOpen}
                                    isLibraryOpen={isLibraryOpen}
                                />
                                :
                                <>
                                    <DocumentPanel
                                        mdContent={``}
                                        setMdContent={setMdContent}
                                        setIsLibraryOpen={setIsLibraryOpen}
                                        isLibraryOpen={isLibraryOpen}
                                    />
                                </>
                        )}
                    </div>
                )}

                {/* Draggable Bar for Left Panel */}
                {showLeftPanel && (
                    <div className="w-2 sm:w-3 bg-gray-700 cursor-col-resize relative min-w-[8px]"
                        onMouseDown={(e) => {
                            if (!showLeftPanel) setShowLeftPanel(true);
                            handleMouseDown(e, 'left');
                        }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1.5 sm:w-2 mx-auto max-w-full "></div>
                    </div>
                )}


                {/* Middle Panel: AI Chat */}
                <div className="flex-1 p-1 min-w-[450px] sm:min-w-[0] sm:px-2">
                    {/* <div className="flex-1 min-w-0 px-1 sm:px-2 overflow-hidden"></div> */}
                    <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 mb-2 sm:mb-4 sm:p-2 ">
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
                        <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">AIChat</h1>
                        <div className="flex items-center gap-2"></div>
  


                    </div>
                    <div className="mx-auto max-w-[1200px] h-full overflow-auto">
                        <ChatComponent
                            input={input}
                            setInput={setInput}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            onResponseChange={handleResponseChange}
                            onViewInMarkdown={handleViewInMarkdown}
                            setShowLeftPanel={setShowLeftPanel}
                            chatInput={chatInput}
                            onAddMD={handleAddMD}
                            mdContent={mdContent}
                            setMdContent={setMdContent}
                            setCurrentMessages={setCurrentMessages}
                        />
                    </div>
                </div>
            </div >
            <div className="flex w-full max-h-[5px] justify-center items-center mt-1">
                <hr className="border-gray-700 w-full" />
            </div>
            <>
                {/* Library Modal */}
                {isLibraryOpen && (
                    <div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50"
                        onClick={() => setIsLibraryOpen(false)}
                    >
                        <div
                            className="bg-background rounded-lg p-4 w-[600px]"
                            onClick={(e) => e.stopPropagation()} // Prevent clicks on modal content from closing
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
                            {/* Pass export functionality to library component */}
                            <div className="text-sm text-gray-400 mb-2  max-h-[80vh] overflow-auto">
                                <MarkdownLibrary
                                    onSelect={handleSelectFromLibrary}
                                    hideExportLibraryButton={true}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};
// #endregion

export default AIChatPage;

// <div className="flex space-x-2 items-center border border-gray-500 rounded p-1">
//     <div className="text-xs">Name: </div>

//     <input
//         type="text"
//         value={(docName || mdPreview.split('\n')[0] || '').replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_')}
//         onChange={(e) =>
//             setDocName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, '_'))
//         }
//         placeholder="Document Name"
//         className="text-xs bg-background border border-gray-600 text-white px-2 py-1 rounded"
//     />
//     <button
//         onClick={handleSaveToRedux}
//         className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
//         disabled={!((docName || mdPreview.split('\n')[0]).replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_')).trim()}
//     >
//         <span>Save</span>
//     </button>
// </div>