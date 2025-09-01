// 'use client';
// import { useRef, useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '@/store';
// import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
// import mermaid from 'mermaid';
// import ChatComponent from '@/components/ai-chat/ChatComponent';
// import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
// import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
// import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
// import TemplatesPanel from '@/components/ai-chat/PromptRefinementPanel';
// import DocumentPanel from '@/components/ai-chat/DocumentPanel';
// import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
// import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';

// export interface ChatComponentProps {
//     onResponseChange: (response: string) => void;
//     onViewInMarkdown: (response: string) => void;
//     setShowLeftPanel: (show: boolean) => void;
//     error?: string; // Optional error prop
//     chatInput?: string;
//     input: string;
//     setInput: (input: string) => void;
//     setMdContent: (message: string) => void;
//     mdContent: string;
//     onAddMD?: () => void;
// }

const AIChatPage = () => {return <></>}
// const AIChatPage = () => {
//     const dispatch = useDispatch();
//     const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'document' | 'conversations'>('document');
//     const [chatInput, setChatInput] = useState('');
//     const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
//     const [mdContent, setMdContent] = useState<string>('')
//     const [showLeftPanel, setShowLeftPanel] = useState(true);
//     const [showRightPanel, setShowRightPanel] = useState(true);
//     const [leftPanelWidth, setLeftPanelWidth] = useState(360);
//     const [rightPanelWidth, setRightPanelWidth] = useState(360); // Initial width
//     const [input, setInput] = useState<string>("");
//     const [editableContent, setEditableContent] = useState('');
//     const [domainContent, setDomainContent] = useState('');
//     const [selectedModel, setSelectedModel] = useState('mistral-small-latest'); // Default model
//     const [lastResponse, setLastResponse] = useState<string>('');
//     const documents = useSelector((state: RootState) => state.markdown.documents);
//     const [documentPanelOpen, setDocumentPanelOpen] = useState(false);

//     // replace your single openLibraryButtonRef with two refs:
//     const [isLibraryOpen, setIsLibraryOpen] = useState(false);
//     const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
//     const [docName, setDocName] = useState('');
//     const mdFileInputRef = useRef<HTMLInputElement>(null)
//     const [forceRefresh, setForceRefresh] = useState(0);
//     const fileInputRef = useRef<HTMLInputElement>(null);

//     // New state variables for conversations
//     const [conversations, setConversations] = useState<any[]>([]);
//     const [currentMessages, setCurrentMessages] = useState<any[]>([]);
//     const [showGuideModal, setShowGuideModal] = useState(false);

//     const handleAddMD = () => {
//         mdFileInputRef.current?.click()
//     }

//     const handleExportLibrary = () => {
//         if (documents.length === 0) return;

//         // Create a JSON file from the documents
//         const dataStr = JSON.stringify(documents, null, 2);
//         const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

//         // Create and trigger a download link
//         const exportFileName = `aichat-doc-library-${new Date().toISOString().split('T')[0]}.json`;
//         const linkElement = document.createElement('a');
//         linkElement.setAttribute('href', dataUri);
//         linkElement.setAttribute('download', exportFileName);
//         linkElement.click();
//     };

//     const handleImportLibrary = () => {
//         fileInputRef.current?.click();
//     };

//     const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (!file) return;

//         const reader = new FileReader();
//         reader.onload = (event) => {
//             try {
//                 const importedDocuments = JSON.parse(event.target?.result as string);

//                 // Validate the imported data structure
//                 if (Array.isArray(importedDocuments) && importedDocuments.every(doc =>
//                     typeof doc === 'object' && doc !== null &&
//                     'id' in doc && 'name' in doc && 'content' in doc)) {

//                     // Import each document to Redux
//                     importedDocuments.forEach(doc => {
//                         dispatch(saveMarkdownDocument({
//                             id: doc.id || Date.now().toString(),
//                             name: doc.name,
//                             content: doc.content,
//                             createdAt: doc.createdAt || new Date().toISOString()
//                         }));
//                     });

//                     alert(`Successfully imported ${importedDocuments.length} documents`);
//                 } else {
//                     alert('Invalid file format. Import failed.');
//                 }
//             } catch (error) {
//                 console.error('Error importing library:', error);
//                 alert('Failed to import library. Invalid JSON format.');
//             }
//         };

//         reader.readAsText(file);
//         e.target.value = ''; // Reset the file input
//     };
//     // Initialize mermaid when component mounts
//     useEffect(() => {
//         mermaid.initialize({
//             theme: 'dark',
//             securityLevel: 'loose'
//         });
//         mermaid.contentLoaded();
//         mermaid.initialize({
//             startOnLoad: true,
//             theme: 'dark',
//             flowchart: { curve: 'linear' },
//             sequence: { showSequenceNumbers: true },
//             themeVariables: {
//                 primaryColor: '#1e3a8a',
//                 edgeLabelBackground: '#334155',
//                 edgeLabelBorder: '#1e3a8a',
//             }
//         });
//     }, []);

//     // Check device type on component mount'
//     useEffect(() => {
//         const checkDeviceType = () => {
//             // Only change panel state on initial load, not on every resize
//             if (!showLeftPanel) {
//                 // You can enable this if you want panel to open on desktop initially
//                 const isDesktop = window.innerWidth >= 768;
//             }
//         };
//         checkDeviceType();
//     }, []);

//     useEffect(() => {
//         if (mdPreview && mdPreview.includes('mermaid') && !isEditing) {
//             setTimeout(() => {
//                 mermaid.run();
//             }, 0);
//         }
//     }, [mdPreview, isEditing]); // Add 'isEditing' to the dependency array

//     useEffect(() => {
//         // Only update the document name if it's currently empty and we have markdown content
//         if (!docName && mdPreview) {
//             const firstLine = mdPreview.split('\n')[0] || '';
//             // Get the first line and clean it up
//             const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_').trim();
//             if (cleanName) {
//                 setDocName(cleanName);
//             }
//         }
//     }, [mdPreview, docName]);

//     // Add this useEffect to load saved conversations from localStorage
//     useEffect(() => {
//         const storedConversations = localStorage.getItem('savedConversations');
//         if (storedConversations) {
//             try {
//                 const parsedConversations = JSON.parse(storedConversations);
//                 setConversations(parsedConversations);
//                 console.log('Loaded saved conversations:', parsedConversations);
//             } catch (error) {
//                 console.error('Error parsing saved conversations:', error);
//             }
//         }
//     }, []);

//     // Simple Modal component
//     const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
//         if (!isOpen) return null;

//         return (
//             <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
//                 <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
//                     <button
//                         onClick={onClose}
//                         className="absolute right-4 top-4 text-gray-400 hover:text-white"
//                     >
//                         <X className="h-6 w-6" />
//                     </button>
//                     <div className="p-6">
//                         {children}
//                     </div>
//                 </div>
//             </div>
//         );
//     };


//     const handleSaveToRedux = () => {
//         if (!docName.trim()) return;
//         console.log('Saving to Redux:', {
//             id: Date.now().toString(),
//             name: docName,
//             content: mdPreview
//         });
//         dispatch(saveMarkdownDocument({
//             id: Date.now().toString(),
//             name: docName,
//             content: mdPreview,
//             createdAt: new Date().toISOString()
//         }));
//         // Show success notification
//         alert('Document saved to library');
//         // Add this to check if documents are updated after dispatch
//         console.log('Documents after save:', documents);
//     };

//     const handleSelectFromLibrary = (content: string, name: string) => {
//         setMdContent(content);
//         setDocName(name);
//         setIsEditing(false);
//         setActiveLeftTab('document'); // Switch to document tab
//         setIsLibraryOpen(false); // Close the library modal after selection

//         console.log("Selected document from library:", { content, name });
//     };

//     // New handler functions for conversations
//     const handleSelectConversation = (conversation: any) => {
//         // Logic to load a saved conversation into the chat
//         // You would need to integrate this with your ChatComponent
//         console.log('Selected conversation:', conversation);
//     };

//     const handleDeleteConversation = (id: string) => {
//         setConversations(conversations.filter(conv => conv.id !== id));
//         // Also remove from local storage if you're using that
//         const storedConversations = JSON.parse(localStorage.getItem('savedConversations') || '[]');
//         localStorage.setItem('savedConversations',
//             JSON.stringify(storedConversations.filter((conv: any) => conv.id !== id))
//         );
//     };

//     const handleSaveCurrentConversation = () => {
//         console.log('Current messages to save:', currentMessages);

//         // Don't allow saving if no messages
//         if (!currentMessages || currentMessages.length === 0) {
//             alert("No messages to save. Please have a conversation first.");
//             return;
//         }

//         // Extract the first sentence from the first user message or after #content marker
//         let title = '';
//         if (currentMessages && currentMessages.length > 0) {
//             // First, check if any message contains #content marker
//             const contentMarkerMessage = currentMessages.find(msg =>
//                 typeof msg.content === 'string' && msg.content.includes('#content')
//             );

//             if (contentMarkerMessage) {
//                 // Extract text after #content
//                 const contentParts = contentMarkerMessage.content.split('#content');
//                 if (contentParts.length > 1) {
//                     // Find the first sentence after #content
//                     const match = contentParts[1].match(/^\s*(.*?[.!?])/);
//                     if (match) {
//                         title = match[1].trim();
//                     }
//                 }
//             }
//             if (!title) {
//                 const firstAssistantMessage = currentMessages.find(msg => msg.role === 'assistant');
//                 if (firstAssistantMessage && firstAssistantMessage.content) {
//                     const match = firstAssistantMessage.content.match(/^.*?[.!?]/);
//                     title = match ? match[0].trim() : firstAssistantMessage.content.trim().substring(0, 50);
//                 }
//             }
//             console.log('266 Extracted title from #content:', title, contentMarkerMessage, currentMessages);
//             // If no title from #content, fall back to first user message
//             if (!title) {
//                 const firstUserMessage = currentMessages.find(msg => msg.role === 'user');
//                 if (firstUserMessage && firstUserMessage.content) {
//                     // Extract the first sentence - look for the first period, question mark, or exclamation
//                     const match = firstUserMessage.content.match(/^.*?[.!?]/);
//                     title = match ? match[0].trim() : firstUserMessage.content.trim().substring(0, 50);
//                 }
//             }

//             // If it's too long, truncate it
//             if (title.length > 50) {
//                 title = title.substring(0, 47) + '...';
//             }
//         }

//         // If we couldn't extract a title, use a default title with timestamp
//         if (!title) {
//             title = `Conversation ${new Date().toLocaleString()}`;
//         }

//         const newConversation = {
//             id: Date.now().toString(),
//             title,
//             date: new Date().toLocaleString(),
//             messages: currentMessages,
//         };

//         const updatedConversations = [...conversations, newConversation];
//         setConversations(updatedConversations);

//         // Save to localStorage for persistence
//         localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));

//         alert(`Conversation "${title}" saved successfully!`);
//     };

//     const MIN_PANEL_WIDTH = 20;
//     const MAX_PANEL_WIDTH = () => window.innerWidth - 120; // leave at least 120px for the middle

//     const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
//         // Check for primary (left) mouse button on initial click
//         if (e.button !== 0) return;

//         e.preventDefault();
//         e.stopPropagation(); // Prevent event bubbling

//         const startX = e.clientX;
//         const startLeftWidth = leftPanelWidth;
//         const startRightWidth = rightPanelWidth;

//         // Prevent text selection during drag
//         document.body.style.userSelect = 'none';
//         document.body.style.cursor = panel === 'left' ? 'col-resize' : 'col-resize';

//         const onMouseMove = (event: MouseEvent) => {
//             // Only proceed if left button is still pressed (buttons bitmask check)
//             if (!(event.buttons & 1)) {
//                 onMouseUp();
//                 return;
//             }

//             // Calculate distance moved
//             const deltaX = event.clientX - startX;

//             if (panel === 'left') {
//                 const newWidth = Math.max(
//                     MIN_PANEL_WIDTH,
//                     Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX)
//                 );
//                 setLeftPanelWidth(newWidth);
//             } else if (panel === 'right') {
//                 // For right panel, moving left increases width, moving right decreases width
//                 // Calculate maximum allowed width considering left panel and minimum middle width
//                 const leftPanelActualWidth = showLeftPanel ? leftPanelWidth + 8 : 0; // +8 for drag bar
//                 const minimumMiddleWidth = 320; // From your inline style
//                 const maxRightWidth = window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - 20; // -20 for margins/padding

//                 const newWidth = Math.max(
//                     MIN_PANEL_WIDTH,
//                     Math.min(maxRightWidth, startRightWidth - deltaX)
//                 );
//                 setRightPanelWidth(newWidth);
//             }
//         };

//         const onMouseUp = () => {
//             // Restore body styles
//             document.body.style.userSelect = '';
//             document.body.style.cursor = '';

//             document.removeEventListener('mousemove', onMouseMove, { capture: true });
//             document.removeEventListener('mouseup', onMouseUp, { capture: true });
//             document.removeEventListener('contextmenu', onMouseUp, { capture: true });
//         };

//         // Add event listeners with capture
//         document.addEventListener('mousemove', onMouseMove, { capture: true });
//         document.addEventListener('mouseup', onMouseUp, { capture: true });
//         document.addEventListener('contextmenu', onMouseUp, { capture: true }); // Handle right-click
//     };


//     const handleApplyTemplate = (content: string) => {
//         console.log('93 Template content inserted:', content);
//         setChatInput(content); // Update the chat input field
//     };

//     const handleResponseChange = (response: string) => { setLastResponse(response) };

//     const handleViewInMarkdown = (response: string) => {
//         const cleanResponse = (response: string) => {
//             let cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
//             cleaned = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
//             return cleaned;
//         };
//         const cleanedResponse = cleanResponse(response);
//         setMdPreview(cleanedResponse);
//         setShowLeftPanel(false); // Hide the left panel when viewing markdown
//     };

//     // #region Main Layout
//     return (
//         <div className="w-full h-full bg-background text-gray-100">
//             <div className="flex flex-row flex-nowrap h-[100dvh] w-full bg-background text-gray-100">

//                 {/* Left Panel: Templates ------------------------------------------------------------------------------ */}
//                 {showLeftPanel && (
//                     <div
//                         className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 max-w-[95vw] overflow-auto"
//                         style={{
//                             width: `${leftPanelWidth}px`,
//                             minWidth: '200px' // Use inline style instead of conflicting Tailwind classes
//                         }}
//                     >
//                         <div className="flex justify-between items-center m-1 sm:m-2">
//                             <h2 className="text-lg sm:text-xl font-bold text-blue-400">
//                                 Input: {activeLeftTab === 'templates' ? 'Domain Topic' : 'Document'}
//                             </h2>
//                             <div className="markdown-preview-header">
//                                 <button
//                                     onClick={() => setIsLibraryOpen(prev => !prev)}
//                                     className="flex items-center text-xs bg-blue-800 hover:bg-blue-600 text-white px-2 py-1 whitespace-nowrap rounded"
//                                 >
//                                     Library
//                                 </button>
//                             </div>
//                             {/* <button
//                                 onClick={() => setShowLeftPanel(!showLeftPanel)}
//                                 className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2 rounded"
//                             >
//                                 <span className="text-lg">{showLeftPanel ? '←' : '→'}</span>
//                             </button> */}
//                         </div>

//                         {/* tabs */}
//                         <ul className="flex border-b border-gray-600 mb-2 text-sm">
//                             <li
//                                 className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'conversations'
//                                     ? 'border-b-2 border-blue-400 font-semibold'
//                                     : 'text-gray-400'
//                                     }`}
//                                 onClick={() => setActiveLeftTab('conversations')}
//                             >
//                                 Saved AI Chat conversations
//                             </li>
//                             <li
//                                 className={`px-3 py-1 cursor-pointer ${activeLeftTab === 'templates'
//                                     ? 'border-b-2 border-blue-400 font-semibold'
//                                     : 'text-gray-400'
//                                     }`}
//                                 onClick={() => setActiveLeftTab('templates')}
//                             >
//                                 Refine Prompt
//                             </li>
//                             <li
//                                 className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'document'
//                                     ? 'border-b-2 border-blue-400 font-semibold'
//                                     : 'text-gray-400'
//                                     }`}
//                                 onClick={() => setActiveLeftTab('document')}
//                             >
//                                 Document
//                             </li>
//                         </ul>

//                         {/* tab content */}
//                         {activeLeftTab === 'conversations' ? (
//                             <div className="p-2">
//                                 <ConversationsPanel
//                                     conversations={conversations}
//                                     onSelectConversation={handleSelectConversation}
//                                     onDeleteConversation={handleDeleteConversation}
//                                     onSaveConversation={handleSaveCurrentConversation}
//                                     currentMessages={currentMessages} // Pass this prop to enable/disable save button
//                                 />
//                             </div>
//                         ) : activeLeftTab === 'templates' ? (
//                             <>
//                                 {/* hidden shared picker */}
//                                 <input
//                                     ref={mdFileInputRef}
//                                     type="file"
//                                     accept=".md"
//                                     className="hidden"
//                                 />
//                                 <TemplatesPanel
//                                     onApplyTemplate={handleApplyTemplate}
//                                     editableContent={editableContent}
//                                     setEditableContent={setEditableContent}
//                                     domainContent={domainContent}
//                                     setDomainContent={setDomainContent}
//                                     selectedModel={selectedModel}
//                                     onAddMD={handleAddMD}
//                                     mdContent={mdContent}
//                                 />
//                             </>
//                         ) : ( // Document tab (activeLeftTab === 'document')
//                             (mdContent && mdContent.length > 0)
//                                 ?
//                                 <DocumentPanel
//                                     mdContent={mdContent}
//                                     setMdContent={setMdContent}
//                                     setIsLibraryOpen={setIsLibraryOpen}
//                                     isLibraryOpen={isLibraryOpen}
//                                     panelType='left'
//                                 />
//                                 :
//                                 <>
//                                     <DocumentPanel
//                                         mdContent={``}
//                                         setMdContent={setMdContent}
//                                         setIsLibraryOpen={setIsLibraryOpen}
//                                         isLibraryOpen={isLibraryOpen}
//                                         panelType='left'
//                                     />
//                                 </>
//                         )}
//                     </div>
//                 )}
//                 {/* Draggable Bar for Left Panel */}
//                 {showLeftPanel && (
//                     <div className="w-2 bg-gray-700 cursor-col-resize relative flex-shrink-0"
//                         onMouseDown={(e) => handleMouseDown(e, 'left')}
//                     >
//                         <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
//                     </div>
//                 )}

//                 {/* Middle Panel: AI Chat ------------------------------------------------------------------------------- */}
//                 <div className="flex p-1 sm:px-2 flex-col flex-grow"
//                     style={{
//                         minWidth: '320px' // Ensure minimum usable width
//                     }}>
//                     <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 sm:p-2">
//                         <button
//                             onClick={() => setShowLeftPanel(!showLeftPanel)}
//                             className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
//                             title='Show Left pane'
//                         >
//                             <span>
//                                 <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                     <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//                                     <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//                                 </svg>
//                             </span>
//                             <span className="ml-1 hidden bg-muted hover:bg-gray-600 text-white sm:inline">{!showLeftPanel}</span>
//                         </button>
//                         <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">AIChat</h1>
//                         <div className="flex items-center gap-2">
//                             <div className="flex items-center justify-between">

//                                 {/* <div className="flex flex-row items-center gap-2"> */}
//                                 <button
//                                     onClick={() => setShowGuideModal(true)}
//                                     className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full p-2"
//                                     title="Open getting started guide"
//                                 >
//                                     <HelpCircle className="h-5 w-5" />
//                                 </button>
//                                 {/* </div> */}
//                             </div>
//                             {/* Add right panel toggle button */}
//                             <button
//                                 onClick={() => setShowRightPanel(!showRightPanel)}
//                                 className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
//                                 title='Show Right pane'
//                             >
//                                 <span className="mr-1 hidden bg-muted hover:bg-gray-600 text-white sm:inline">{!showRightPanel}</span>
//                                 <span>
//                                     <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                         <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//                                         <line x1="6" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//                                     </svg>
//                                 </span>
//                             </button>
//                         </div>
//                     </div>
//                     <div className="flex-1 h-full overflow-auto">
//                         <ChatComponent
//                             input={input}
//                             setInput={setInput}
//                             selectedModel={selectedModel}
//                             setSelectedModel={setSelectedModel}
//                             onResponseChange={handleResponseChange}
//                             onViewInMarkdown={handleViewInMarkdown}
//                             setShowLeftPanel={setShowLeftPanel}
//                             chatInput={chatInput}
//                             onAddMD={handleAddMD}
//                             mdContent={mdContent}
//                             setMdContent={setMdContent}
//                             mdPreview={mdPreview}
//                             setMdPreview={setMdPreview}
//                             setCurrentMessages={setCurrentMessages}
//                         />
//                     </div>
//                 </div>

//                 {/* Draggable Bar for Right Panel */}
//                 {showRightPanel && (
//                     <div
//                         className="w-2 bg-gray-700 hover:bg-gray-500 cursor-col-resize relative flex-shrink-0"
//                         onMouseDown={(e) => handleMouseDown(e, 'right')}
//                         style={{ zIndex: 10 }}
//                     >
//                         <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
//                     </div>
//                 )}

//                 {/* Right Panel: Markdown Preview ------------------------------------------------------------------------*/}
//                 {showRightPanel && (
//                     <div className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 overflow-auto flex flex-col"
//                         style={{
//                             width: `${rightPanelWidth}px`,
//                             minWidth: '200px',
//                             maxWidth: '65%'
//                         }}>
//                         <div className="flex justify-between items-center mb-2">
//                             <h2 className="text-lg sm:text-xl font-bold text-blue-400">AI Output: Markdown Preview</h2>
//                             <div className="flex items-center gap-2">
//                                 <button
//                                     onClick={handleSaveToRedux}
//                                     className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded"
//                                     disabled={!mdPreview || mdPreview === '.' || !docName.trim()}
//                                 >
//                                     Save to Library
//                                 </button>
//                                 <button
//                                     onClick={() => setShowRightPanel(false)}
//                                     className="text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
//                                 >
//                                     Close
//                                 </button>
//                             </div>
//                         </div>
//                         {(mdPreview)
//                             ?
//                             <DocumentPanel
//                                 mdContent={mdPreview}
//                                 setMdContent={setMdPreview}
//                                 setIsLibraryOpen={setIsLibraryOpen}
//                                 isLibraryOpen={isLibraryOpen}
//                                 panelType='right'
//                             />
//                             :
//                             <>
//                                 <DocumentPanel
//                                     mdContent={``}
//                                     setMdContent={setMdPreview}
//                                     setIsLibraryOpen={setIsLibraryOpen}
//                                     isLibraryOpen={isLibraryOpen}
//                                     panelType='right'
//                                 />
//                             </>
//                         }
//                     </div>
//                 )}
//                 {/* <div className="flex w-full justify-between items-center p-2 bg-primary-foreground">
//                 </div > */}
//                 <div className="max-h-[5px] mt-1">
//                     <hr className="border-gray-700" />
//                 </div>
//                 <>
//                     {/* Library Modal */}
//                     {isLibraryOpen && (
//                         <div
//                             className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50"
//                             onClick={() => setIsLibraryOpen(false)}
//                         >
//                             <div
//                                 className="bg-background rounded-lg p-4 w-[600px]"
//                                 onClick={(e) => e.stopPropagation()} // Prevent clicks on modal content from closing
//                             >
//                                 <div className="flex justify-between items-center mb-4">
//                                     <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
//                                     <div className="flex space-x-2">

//                                         <button
//                                             onClick={handleExportLibrary}
//                                             className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
//                                             disabled={documents.length === 0}
//                                         >
//                                             Export Library
//                                         </button>
//                                         <input
//                                             type="file"
//                                             ref={fileInputRef}
//                                             onChange={handleFileSelection}
//                                             accept=".json"
//                                             style={{ display: 'none' }}
//                                         />
//                                         <button
//                                             onClick={handleImportLibrary}
//                                             className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
//                                         >
//                                             <span>Import Library</span>
//                                         </button>
//                                         <button
//                                             onClick={() => setIsLibraryOpen(false)}
//                                             className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
//                                         >
//                                             Close
//                                         </button>
//                                     </div>
//                                 </div>
//                                 {/* Pass export functionality to library component */}
//                                 <div className="text-sm text-gray-400 mb-2  max-h-[80vh] overflow-auto">
//                                     <MarkdownLibrary
//                                         onSelect={handleSelectFromLibrary}
//                                         hideExportLibraryButton={true}
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </>

//             </div>
//             {/* Add the modal at the end of the component */}
//             <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
//                 <GettingStartedGuide />
//             </Modal>
//         </div>
//     );
// };
// // #endregion

export default AIChatPage;

