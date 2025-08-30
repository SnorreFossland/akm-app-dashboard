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
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { saveMarkdownDocument } from "@/features/model-universe/modelSlice"; // Updated import
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import TemplatesPanel from '@/components/ai-chat/PromptRefinementPanel';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import GettingStartedGuide from '@/components/prompt-builder/GettingStartedGuide';
import { ThreePanelLayout } from "@/components/ThreePanelLayout";
import { FileOperations } from "@/components/FileOperations";

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

  const promptData = useSelector((state: RootState) => ((state as any).prompt?.documents || []));
  const [currentPrompt, setCurrentPrompt] = useState<string>(promptData.length > 0 ? promptData[0].content : '');
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const [activeTab, setActiveTab] = useState("chat");
  const [editableContent, setEditableContent] = useState('');

  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>('')
  const [docName, setDocName] = useState<string>('New Document');
  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state variables for conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);


  const [domainContent, setDomainContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model
  const [currentDocument, setCurrentDocument] = useState<string>('');

  const [showGuideModal, setShowGuideModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'document' | 'library'>('document');

  const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
    return (
      <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
        <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
      </Button>
    );
  };


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

  const handleSelectFromLibrary = (content: string, name: string) => {
    setMdContent(content);
    setDocName(name);
    setIsEditing(false);
    setActiveLeftTab('document'); // Switch to document tab
    setIsLibraryOpen(false); // Close the library modal after selection

    console.log("Selected document from library:", { content, name });
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

  const handleApplyTemplate = (content: string) => {
    console.log('93 Template content inserted:', content);
    setChatInput(content); // Update the chat input field
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
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 1: Define Your Goal</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Start by clearly defining what you want the AI to accomplish. A clear goal is the foundation of a great prompt.
                Type the goal in the <span className="text-blue-400 font-semibold">'AI Assistant'</span> tab input field.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 2: Provide Context</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Switch to the <span className="text-blue-400 font-semibold">'Add. Context'</span> tab to provide relevant information, documents, or examples. The more context the AI has, the better the result will be.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 3: Build Your Prompt</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Use the tab <span className="text-blue-400 font-semibold">'AI Assistant'</span> to help you build your prompt.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 4: Preview</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                As you build your prompt, the <span className="text-blue-400 font-semibold">'Preview'</span> in the right panel will show you the potential output.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 5: Save Your Prompt</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Once you are satisfied with your prompt, navigate to the <span className="text-blue-400 font-semibold">'Current Prompt'</span> tab to save it for future use.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 6: Iterate and Refine</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                You can refine this Current Prompt by going back to the <span className="text-blue-400 font-semibold">'AI Assistant'</span> tab and making adjustments based on the AI's feedback.
                The Current Prompt will be used as a base for your next iteration. You can add more context by using the <span className="text-blue-400 font-semibold">'Add. Context'</span> tab.
              </p>
            </div>
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
        <div className="flex flex-col flex-grow bg-background text-gray-100 ">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0 h-full">
            {/* Tab Structure with Left and Right buttons */}
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <TabsList className="grid grid-cols-6 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10">
                {/* AI Prompt Assistant  */}
                <TabsTrigger
                  value="chat"
                  className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                  title="AI Prompt Assistant"
                >
                  AI Prompt Assistant
                  <span className="mx-1"></span>
                  {/* <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-500 text-blue-300 rounded-full"
                      title="Open AI Prompt Assistant guide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </span> */}
                </TabsTrigger>
                {/* Current Document */}
                <TabsTrigger
                  value="current-document"
                  className="text-xs text-gray-400 sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                >
                  Current Prompt
                  {/* <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full"
                    title="Open guide"
                  >
                    <HelpCircle className="h-3 w-3 mx-2" />
                  </span> */}
                </TabsTrigger>
                {/* AI Prompt Assistant 2 */}
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

                {/* Current Prompt */}
                <TabsTrigger
                  value="current-prompt"
                  className="text-xs sm:text-sm mt-0 border-t border-l border-r border-b-0 border-gray-600/50 data-[state=active]:border-gray-400 data-[state=inactive]:border-gray-600/30 relative z-20"
                  title="Current Prompt"
                >
                  Prompt: {documents[0]?.name || 'Prompt name'}
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

              </div>
            </div>
            <TabsContent value="chat" className="flex-1 px-1 mt-1">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded h-full">
                <ChatComponent
                  input={input}
                  setInput={setInput}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  currentDocument={currentDocument}
                  onResponseChange={() => { }}
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
                  isMobile={false}
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
            <TabsContent value="ai-prompt" className="flex-1 px-1 mt-1">
              <div className="flex-1 overflow-hidden h-full">
                <PromptBuilder
                  finalPrompt={currentPrompt}
                  setFinalPrompt={setCurrentPrompt}
                />
              </div>
            </TabsContent>
            <TabsContent value="refine" className="flex-1 px-1 mt-1">
              <div className="flex-1 overflow-hidden h-full">
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

            {/* Current Prompt */}
            <TabsContent value="current-prompt" className="flex-1 px-1 mt-1">
              <div className="flex-1 overflow-auto bg-gray-800/20 p-1 overflow-hidden h-full">
                <PromptComponent />
              </div>
            </TabsContent>
            {/* Saved Conversations*/}
            <TabsContent value="saved-chat" className="flex-1 px-1 mt-1">
              <div className="p-2 h-full">
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

      </ThreePanelLayout>

      {/* Library Modal */}
      {
        isLibraryOpen && (
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
      {/* Guide Modal */}
      <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
        <GettingStartedGuide />
      </Modal>
    </div>
  );
};