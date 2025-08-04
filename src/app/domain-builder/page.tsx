"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Edit, Clipboard, Library, Save, HelpCircle, X, BookmarkPlus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { saveMarkdownDocument, setDomainData } from '@/features/model-universe/modelSlice';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import DomainBuilder from "@/components/domain-builder/DomainBuilder";
import ChatComponent from '@/components/ai-chat/ChatComponent';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { LoadingCircularProgress } from "@/components/loading";
import GettingStartedGuide from '@/components/domain-builder/GettingStartedGuide';
import Guide from '@/components/domain-builder/Guide';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from '@/components/FileOperations';
import UniverseComponent from '@/features/model-universe/components/UniverseComponent';

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
  guide?: React.ReactNode;
  mdPreview?: string;
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
  const [currentDocument, setCurrentDocument] = useState<string>(domainData?.presentation || '');

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
      setCurrentDocument(domainData.presentation || '');
    }
  }, [domainData]);

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
        key: 'current-content',
        label: 'Current Content',
        content: (
          <div className="space-y-4 px-2 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            {currentDocument ? (
              <div className="p-2 bg-gray-800 rounded">
                <MarkdownPreview
                  mdPreview={currentDocument || 'No definition available'}
                />
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
    defaultTab: 'context'
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
        <div className="flex flex-col flex-grow bg-background text-gray-100 h-full">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0 h-full">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between px-2">
              {/* Tabs */}
              <TabsList className="grid grid-cols-4 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10">
                <TabsTrigger value="chat" className="text-xs sm:text-sm mt-0">
                  AI Domain Builder
                  <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                    title="Open Domain Builder guide"
                  >
                  </span>
                </TabsTrigger>
                <TabsTrigger value="current-document" className="text-xs sm:text-sm mt-0">
                  Current Domain
                </TabsTrigger>
                <TabsTrigger value="model" className="text-xs sm:text-sm mt-0">
                  Current Model Suite
                </TabsTrigger>
                <TabsTrigger value="domain2" className="text-xs sm:text-sm mt-0">
                  Domain Builder2
                </TabsTrigger>
              </TabsList>
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
                  currentDocument={currentDocument}
                  setCurrentMessages={setCurrentMessages}
                  gettingStartedGuide={<GettingStartedGuide />}
                  guide={<Guide />}
                />
              </div>
            </TabsContent>

            {/* Current Document */}
            <TabsContent value="current-document" className="flex-1 px-1 mt-1 overflow-hidden">
              <div className="bg-background rounded-lg p-4 h-full overflow-auto">
                <div className="flex flex-col space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Name</label>
                    <input
                      type="text"
                      value={domainName}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter domain name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      value={domainDescription}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter domain description"
                      rows={3}
                    />
                  </div>
                </div>
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
            {/* Model */}
            <TabsContent value="model" className="flex-1 px-1 mt-1 h-full">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
                <UniverseComponent />
              </div>
            </TabsContent>
            {/* Domain Builder */}
            <TabsContent value="domain2" className="flex-1 px-1 mt-1 h-full">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
                <div className="flex overflow-hidden h-full">
                  {/* <DomainBuilder
                    input={chatInput}
                    setInput={setChatInput}
                    mdContent={mdContent}
                    setMdContent={setMdContent}
                    setIsLibraryOpen={setIsLibraryOpen}
                    isLibraryOpen={isLibraryOpen}
                    mdPreview={mdPreview}
                    setMdPreview={setMdPreview}
                    onViewInMarkdown={(content) => setMdPreview(content)}
                  /> */}
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
                  disabled={documents?.length === 0}
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