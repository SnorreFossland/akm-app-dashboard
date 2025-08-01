"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { saveMarkdownDocument, setDomainData } from '@/features/model-universe/modelSlice';
import type { RootState } from "@/store";
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Edit, Clipboard, Library, Save, HelpCircle, X, BookmarkPlus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import DomainBuilder from "@/components/domain-builder/DomainBuilder";
import ChatComponent from '@/components/ai-chat/ChatComponent';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { LoadingCircularProgress } from "@/components/loading";
import GettingStartedGuide from '@/components/domain-builder/GettingStartedGuide';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from '@/components/FileOperations';

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
  gettingStartedGuide?: React.ReactNode;
}

export default function DomainBuilderPage() {
  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
  const domainData = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const dispatch = useDispatch();

  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
  const [mdContent, setMdContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model

  const [activeLeftTab, setActiveLeftTab] = useState<'document' | 'library'>('document');

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [lastResponse, setLastResponse] = useState<string>('');
  const [activeTab, setActiveTab] = useState("chat");

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [docName, setDocName] = useState<string>('New Document');
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);

  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [domainName, setDomainName] = useState(domainData?.name || '');
  const [domainDescription, setDomainDescription] = useState(domainData?.description || '');
  const [domainPresentation, setDomainPresentation] = useState(domainData?.presentation || '');

  // Update local state when Redux state changes
  useEffect(() => {
    if (domainData) {
      setDomainName(domainData.name || '');
      setDomainDescription(domainData.description || '');
      setDomainPresentation(domainData.presentation || '');
    }
  }, [domainData]);

  // Function to dispatch form field changes
  const handleSaveDomainData = () => {
    const updatedDomainData = {
      name: domainName,
      description: domainDescription,
      presentation: domainPresentation,
      // Preserve existing fields
      prompt: domainData?.prompt || '',
      additionalContext: domainData?.additionalContext || ''
    };

    dispatch(setDomainData(updatedDomainData));
  };

  // Handle individual field changes with auto-save
  const handleFieldChange = (field: string, value: string) => {
    const updatedData = {
      ...domainData,
      [field]: value
    };

    dispatch(setDomainData(updatedData));

    // Update local state
    switch (field) {
      case 'name':
        setDomainName(value);
        break;
      case 'description':
        setDomainDescription(value);
        break;
      case 'presentation':
        setDomainPresentation(value);
        break;
    }
  };

  // Reusable IconButton component
  interface IconButtonProps {
    onClick: () => void;
    icon: any;
    className?: string;
    iconWidth?: string;
    iconSize?: SizeProp;
  }
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

  const handleSelectFromLibrary = (content: string, name: string) => {
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

  const leftPanelContent = {
    tabs: [
      {
        key: 'guide',
        label: 'Guide',
        content: (
          <div className="space-y-4 p-1 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 1: Define Domain Core</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Use the <span className="text-blue-400 font-semibold">'AI Domain Builder'</span> tab to chat with the AI. Describe the core concepts, entities, and relationships of your domain.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 2: Provide Context</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Switch to the <span className="text-blue-400 font-semibold">'Add. Context'</span> tab to upload or write supporting documents. This gives the AI the raw material to build upon.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 3: Preview Output</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                The <span className="text-blue-400 font-semibold">'Output Preview'</span> panel on the right shows the generated output in Markdown.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 4: Save Your Domain</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Once you are satisfied with the domain, click the <span className="text-blue-400 font-semibold">'Save'</span> button in the top bar to persist your changes.
              </p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg bg-secondary/40">
              <h3 className="text-lg font-medium text-secondary-foreground/70">Step 5: Review and Refine</h3>
              <p className="text-sm text-secondary-foreground/60 mt-1">
                Check the <span className="text-blue-400 font-semibold">'Current Domain'</span> tab to see the generated domain details. Use the AI chat to refine the name, description, and presentation.
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

  const rightPanelContent = {
    tabs: [
      {
        key: 'preview',
        label: 'Output Preview',
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
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        className="h-full min-w-0 bg-background text-gray-100"
      >
        <div className="flex flex-col flex-grow bg-background text-gray-100 h-full">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0 h-full">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between px-2">
              {/* Left Panel Button */}
              <button
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
                title="Show Left pane"
              >
                <span>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              {/* Tabs */}
              <TabsList className="grid grid-cols-4 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10">
                <TabsTrigger value="chat" className="text-xs sm:text-sm mt-0">
                  AI Domain Builder
                  <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                    title="Open Domain Builder guide"
                  >
                    <HelpCircle className="h-3 w-3 ms-5" />
                  </span>
                </TabsTrigger>
                <TabsTrigger value="domain" className="text-xs sm:text-sm mt-0">
                  Current Domain
                </TabsTrigger>
                <TabsTrigger value="model" className="text-xs sm:text-sm mt-0">
                  Current Model Suite
                </TabsTrigger>
                <TabsTrigger value="domain2" className="text-xs sm:text-sm mt-0">
                  Domain Builder2
                </TabsTrigger>
              </TabsList>

              {/* Right Panel Button */}
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
                title="Show Right pane"
              >
                <span>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="6" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Tab Content */}
            {/* Chat Component */}
            <TabsContent value="chat" className="flex-1 px-1 mt-1 h-full">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded h-full">
                <ChatComponent
                  input={input}
                  setInput={setInput}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  onResponseChange={handleResponseChange}
                  onViewInMarkdown={handleViewInMarkdown}
                  setShowLeftPanel={setShowLeftPanel}
                  showLeftPanel={showLeftPanel}
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
            {/* Domain Tab Content  */}
            <TabsContent value="domain" className="flex-1 p-1 mt-1  h-[calc(100vh-8rem)]">
              <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-200">Domain Configuration</h2>
                  <button
                    onClick={handleSaveDomainData}
                    className="text-green-400 hover:text-green-200 text-white rounded text-xs"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </button>
                </div>

                <h5 className="text-gray-400 font-bold">Name</h5>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-3"
                />

                <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                <textarea
                  value={domainDescription}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="bg-background p-1 border border-gray-500 rounded w-full resize-vertical mb-3"
                  rows={5}
                />

                <h5 className="text-gray-400 p-1 font-bold">Presentation</h5>
                <textarea
                  value={domainPresentation}
                  onChange={(e) => handleFieldChange('presentation', e.target.value)}
                  className="bg-background p-1 border border-gray-500 rounded w-full resize-vertical"
                  rows={25}
                />
              </div>
            </TabsContent>
            {/* Model */}
            <TabsContent value="model" className="flex-1 px-1 mt-1 h-full">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
                <h2 className="text-xl font-bold mb-4">Model View</h2>
                <ModelComponent />
              </div>
            </TabsContent>
            {/* Domain Builder */}
            <TabsContent value="domain2" className="flex-1 px-1 mt-1 h-full">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
                <div className="flex overflow-hidden h-full">
                  <DomainBuilder
                    input={chatInput}
                    setInput={setChatInput}
                    mdContent={mdContent}
                    setMdContent={setMdContent}
                    setIsLibraryOpen={setIsLibraryOpen}
                    isLibraryOpen={isLibraryOpen}
                    mdPreview={mdPreview}
                    setMdPreview={setMdPreview}
                    onViewInMarkdown={(content) => setMdPreview(content)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ThreePanelLayout>

      {/* Modals */}
      <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
        <GettingStartedGuide />
      </Modal>
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
  );
}