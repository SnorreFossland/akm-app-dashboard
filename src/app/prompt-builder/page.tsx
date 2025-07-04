"use client";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { RootState } from "@/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PromptBuilder from "@/components/prompt-builder/PromptBuilder";
import PromptComponent from "@/components/prompt-builder/PromptComponent";
import DraggableBar from "@/components/ui/DraggableBar";
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { saveMarkdownDocument } from "@/features/documents/markdownSlice";
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import TemplatesPanel from '@/components/ai-chat/PromptRefinementPanel';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import GettingStartedGuide from '@/components/prompt-builder/GettingStartedGuide';



interface IconButtonProps {
  onClick: () => void;
  icon: any;
  className?: string;
  iconWidth?: string;
  iconSize?: SizeProp;
}
interface ActionCardTitleButtonProps {
  title: string;
  done: boolean;
  onClick: () => void;
  icon: any;
}
interface DispatchCardTitleProps {
  dispatchDone: boolean;
  handleDispatchFinalPrompt: () => void;
  extraClassName?: string;
}

export default function VercelAiPage() {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.modelUniverse);

  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state

  const promptData = useSelector((state: RootState) => state.prompt.documents);
  const [currentDomain, setCurrentDomain] = useState<any>(data.phData?.domain || null);
  const [currentPrompt, setCurrentPrompt] = useState<string>(promptData.length > 0 ? promptData[0].content : '');
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(360);
  const [rightPanelWidth, setRightPanelWidth] = useState(360); // Initial width
  // const [leftPanelContent, setLeftPanelContent] = useState(''); // Default to 'document' content
  const [activeTab, setActiveTab] = useState("chat");
  const [editableContent, setEditableContent] = useState('');

  const documents = useSelector((state: RootState) => state.markdown.documents);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>('')
  const [docName, setDocName] = useState<string>('New Document');
  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // New state variables for conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);


  const [domainContent, setDomainContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [middlePanelWidth, setMiddlePanelWidth] = useState(600);
  const [editedPrompt, setEditedPrompt] = useState<string>('')
  const [phase, setPhase] = useState("initial");
  const [dispatchDone, setDispatchDone] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [domainInput, setDomainInput] = useState<string>('');
  const [promptPreview, setPromptPreview] = useState<string>('');
  const [promptContent, setPromptContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'document' | 'library'>('document');
  const [dividerPosition, setDividerPosition] = useState(10); // 40% default width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(800); // default fallback

  const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
    return (
      <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
        <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
      </Button>
    );
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
              type: "markdown",
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

  const handleSelectFromLibrary = (content: string, name: string) => {
    setMdContent(content);
    setDocName(name);
    setIsEditing(false);
    setActiveLeftTab('document'); // Switch to document tab
    setIsLibraryOpen(false); // Close the library modal after selection

    console.log("Selected document from library:", { content, name });
  };

  const handleLeftResize = (newWidth: number) => {
    setLeftPanelWidth(newWidth);
  };

  const handleMiddleResize = (newWidth: number) => {


    setMiddlePanelWidth(newWidth);
  };

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
    setMdContent(data.phData?.domain?.prompt || '');
  }, []);

  const handleShowInLeftPanel = (content: string, name: string) => {
    setMdContent(content);
    setShowLeftPanel(true);
    // You might also want to update other state variables if needed
  };

  const handleDocumentSelect = (content: string, name: string) => {
    setMdContent(content);
    setDocName(name);
    setIsEditing(false);
    setActiveLeftTab('document'); // Switch to document tab
    setIsLibraryOpen(false); // Close the library modal after selection
    console.log("Selected document from library:", { content, name });
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
    setShowRightPanel(true); // Show the right panel with markdown preview
    // setShowLeftPanel(false); // Hide the left panel when viewing markdown
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
  const MIN_PANEL_WIDTH = 20;
  const MAX_PANEL_WIDTH = () => window.innerWidth - 120; // leave at least 120px for the middle

  const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
    // Check for primary (left) mouse button on initial click
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    const startX = e.clientX;
    const startLeftWidth = leftPanelWidth;
    const startRightWidth = rightPanelWidth;

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = panel === 'left' ? 'col-resize' : 'col-resize';

    const onMouseMove = (event: MouseEvent) => {
      // Only proceed if left button is still pressed (buttons bitmask check)
      if (!(event.buttons & 1)) {
        onMouseUp();
        return;
      }

      // Calculate distance moved
      const deltaX = event.clientX - startX;

      if (panel === 'left') {
        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX)
        );
        setLeftPanelWidth(newWidth);
      } else if (panel === 'right') {
        // For right panel, moving left increases width, moving right decreases width
        // Calculate maximum allowed width considering left panel and minimum middle width
        const leftPanelActualWidth = showLeftPanel ? leftPanelWidth + 8 : 0; // +8 for drag bar
        const minimumMiddleWidth = 320; // From your inline style
        const maxRightWidth = window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - 20; // -20 for margins/padding

        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(maxRightWidth, startRightWidth - deltaX)
        );
        setRightPanelWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      // Restore body styles
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      document.removeEventListener('mousemove', onMouseMove, { capture: true });
      document.removeEventListener('mouseup', onMouseUp, { capture: true });
      document.removeEventListener('contextmenu', onMouseUp, { capture: true });
    };

    // Add event listeners with capture
    document.addEventListener('mousemove', onMouseMove, { capture: true });
    document.addEventListener('mouseup', onMouseUp, { capture: true });
    document.addEventListener('contextmenu', onMouseUp, { capture: true }); // Handle right-click
  };

  const handleApplyTemplate = (content: string) => {
    console.log('93 Template content inserted:', content);
    setChatInput(content); // Update the chat input field
  };



  return (
    <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden">
      {/* Left Panel: Templates ------------------------------------------------------------------------------ */}
      {showLeftPanel && (
        <div
          className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 max-w-[95vw] overflow-auto"
          style={{
            width: `${leftPanelWidth}px`,
            minWidth: '200px' // Use inline style instead of conflicting Tailwind classes
          }}
        >
          <div className="flex justify-between items-center m-1 sm:m-2">
            <h2 className="text-lg sm:text-xl font-bold text-blue-400">
              Input: Context
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
          <DocumentPanel
            mdContent={mdContent}
            setMdContent={setMdContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType='left'
          />
        </div>
      )}

      {/* Draggable Bar between Left and Middle panels */}
      {showLeftPanel && (
        <DraggableBar
          onResize={handleLeftResize}
          initialWidth={leftPanelWidth}
          minWidth={200}
          maxWidth={() => window.innerWidth - 400}
        />
      )}

      {/* Middle Panel */}
      <div className="flex p-1 sm:px-2 flex-col flex-grow"
        style={{
          minWidth: '320px' // Ensure minimum usable width
        }}>
        <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 mb-2 sm:mb-4 sm:p-2">
          {/* Middle Content */}
          <div className="flex flex-col flex-grow bg-background text-gray-100 ">
            <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0">

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

                {/* Tabs */}
                <TabsList className="grid grid-cols-6 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10">
                  {/* AI Assistant 1 */}
                  <TabsTrigger
                    value="chat"
                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                    title="AI Prompt Assistant"
                  >
                    AI Assistant 1
                    <span className="mx-1"></span>
                    {/* <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                      title="Open AI Prompt Assistant guide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </span> */}
                  </TabsTrigger>
                  {/* AI Assistant 2 */}
                  <TabsTrigger
                    value="ai-prompt"
                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                    title="AI Prompt Assistant"
                  >
                    AI Prompt Assistant 2
                    <span className="mx-1"></span>
                    {/* <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                      title="Open AI Prompt Assistant guide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </span> */}
                  </TabsTrigger>
                  {/* Refine prompt */}
                  <TabsTrigger
                    value="refine"
                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                    title="Refine prompt"
                  >
                    Refine prompt
                    {/* <span
                      onClick={() => setShowGuideModal(true)}
                     className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                      title="Open guide"
                    >
                      <HelpCircle className="h-3 w-3 ms-5" />
                    </span> */}
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved-documents"
                    className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                  >
                    Saved Documents
                    <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                      title="Open guide"
                    >
                      <HelpCircle className="h-3 w-3 mx-2" />
                    </span>
                  </TabsTrigger>
                  {/* Current Prompt */}
                  <TabsTrigger
                    value="current-prompt"
                    className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                    title="Current Prompt"
                  >
                    Prompt: {currentPrompt?.name || 'Prompt name'}
                    <span className="mx-1"></span>
                    {/* <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                      title="Open domain guide"
                    >
                      <HelpCircle className="h-4 w-4" />
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

                <div className="flex items-center gap-2">
                  {/* <div className="text-orange-700">AI-Powered Dashboard</div> */}
                  {/* <FontAwesomeIcon icon={faRobot} className="fa-2lg text-orange-700" /> */}
                  {/* Right Panel Button - moved here */}

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
              </div>
              <TabsContent value="chat" className="flex-1 px-1 mt-1">
                <div className="flex-1 overflow-auto bg-gray-800/20 rounded">
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
                    mdPreview={mdPreview}
                    setMdPreview={setMdPreview}
                    setCurrentMessages={setCurrentMessages}
                    gettingStartedGuide={<GettingStartedGuide />}
                  />
                </div>
              </TabsContent>
              <TabsContent value="ai-prompt" className="flex-1 px-1 mt-1">
                <div className="flex-1 overflow-hidden">
                  <PromptBuilder
                    finalPrompt={currentPrompt}
                    setFinalPrompt={setCurrentPrompt}
                  />
                </div>
              </TabsContent>
              <TabsContent value="refine" className="flex-1 px-1 mt-1">
                <div className="flex-1 overflow-hidden">
                  {/* hidden shared picker */}
                  <input
                    ref={mdFileInputRef}
                    type="file"
                    accept=".md"
                    className="hidden"
                  />
                </div>
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
              </TabsContent>
              {/* Saved Documents */}
              <TabsContent value="saved-documents" className="flex-1 px-1 mt-1">

                <div
                  className="bg-background rounded-lg p-4"
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
                  <div className="text-sm text-gray-400 mb-2 overflow-auto">
                    <MarkdownLibrary
                      onSelect={handleDocumentSelect}
                      onShowInLeftPanel={handleShowInLeftPanel}
                      hideExportLibraryButton={false}
                    />
                  </div>
                </div>
              </TabsContent>
              {/* Current Prompt */}
              <TabsContent value="current-prompt" className="flex-1 px-1 mt-1">
                <div className="flex-1 overflow-auto bg-gray-800/20 p-1 overflow-hidden">
                  <PromptComponent />
                </div>
              </TabsContent>
              {/* Saved Conversations*/}
              <TabsContent value="saved-chat" className="flex-1 px-1 mt-1">
                <div className="p-2">
                  <ConversationsPanel
                    conversations={conversations}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={handleDeleteConversation}
                    onSaveConversation={handleSaveCurrentConversation}
                    currentMessages={currentMessages} // Pass this prop to enable/disable save button
                    onViewInMarkdown={handleViewInMarkdown}
                    mdPreview={mdPreview}
                  />
                </div>
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
          style={{ zIndex: 10 }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
        </div>
      )}

      {
        showRightPanel && (
          <div className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 overflow-auto flex flex-col"
            style={{
              width: `${rightPanelWidth}px`,
              minWidth: '200px',
              maxWidth: '65%'
            }}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-blue-400">Output Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRightPanel(false)}
                  className="text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                >
                  Close
                </button>
              </div>
            </div>
            {(mdPreview) &&
              <DocumentPanel
                mdContent={mdPreview}
                setMdContent={setMdPreview}
                setIsLibraryOpen={setIsLibraryOpen}
                isLibraryOpen={isLibraryOpen}
                panelType='right'
              />
            }
          </div>
        )
      }


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
}