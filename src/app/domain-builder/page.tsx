"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { usePathname } from 'next/navigation';
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { HelpCircle } from 'lucide-react';
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
  const prompt = useSelector((state: { prompt: any }) => data.phData.domain?.prompt);
  const domainData = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const ontologyData = useSelector((state: { modelUniverse: any }) => data.phData.ontology);
  const dispatch = useDispatch();
  const pathname = usePathname();

  console.log('DomainBuilderPage data:', data);
  // console.log('DomainBuilderPage prompt:', prompt);
  console.log('DomainBuilderPage domainData:', domainData);

  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
  const [mdContent, setMdContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model

  const [activeLeftTab, setActiveLeftTab] = useState<'document' | 'library'>('document');

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [domainName, setDomainName] = useState(domainData?.name || "");
  const [domainDescription, setDomainDescription] = useState(domainData?.description || "");
  const [domainPresentation, setDomainPresentationState] = useState(domainData?.presentation || "");

  const [lastResponse, setLastResponse] = useState<string>('');
  const [activeTab, setActiveTab] = useState("instructions");

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [docName, setDocName] = useState<string>('New Document');
  const documents = useSelector((state: RootState) => state.markdown.documents);

  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  // Draggable divider state
  const [dividerPosition, setDividerPosition] = useState(40); // 40% default width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Panel sizing constants
  const MIN_PANEL_WIDTH = 200;
  const MAX_PANEL_WIDTH = () => window.innerWidth * 0.6;

  // Refs for touch/drag handling
  const leftPanelWidthRef = useRef(leftPanelWidth);
  const rightPanelWidthRef = useRef(rightPanelWidth);
  const showLeftPanelRef = useRef(showLeftPanel);

  const middlePanelWidth = typeof window !== 'undefined'
    ? window.innerWidth - (showLeftPanel ? leftPanelWidth : 0) - (showRightPanel ? rightPanelWidth : 0) - 40
    : 800;

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
  // Reusable ActionCardTitleButton component
  interface ActionCardTitleButtonProps {
    title: string;
    done: boolean;
    onClick: () => void;
    icon: any;
  }

  const ActionCardTitleButton: React.FC<ActionCardTitleButtonProps> = ({ title, done, onClick, icon }) => {
    return (
      <CardTitle className="flex justify-center m-1 mb-auto bg-gray-700 border border-gray-500">
        <div className={`flex justify-between items-center flex-grow ps-2 ${done ? "text-green-600" : "text-green-200"}`}>
          {title}
          <div className="flex items-center ml-auto">
            {!done ? (
              <div style={{ marginLeft: 8, marginRight: 8 }}>
                <LoadingCircularProgress />
              </div>
            ) : (
              <div style={{ marginLeft: 8, marginRight: 8, color: done ? "green" : "gray" }}>
                <FontAwesomeIcon icon={faCheckCircle} size="2x" />
              </div>
            )}
            <IconButton onClick={onClick} icon={icon} />
          </div>
        </div>
      </CardTitle>
    );
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  // Panel drag handling
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, panel: 'left' | 'right') => {
    if ('button' in e && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startLeftWidth = leftPanelWidthRef.current;
    const startRightWidth = rightPanelWidthRef.current;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.body.style.touchAction = 'none';

    const onMove = (event: MouseEvent | TouchEvent) => {
      if (event instanceof MouseEvent && !(event.buttons & 1)) {
        onEnd();
        return;
      }

      const currentX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
      const deltaX = currentX - startX;

      if (panel === 'left') {
        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX)
        );
        setLeftPanelWidth(newWidth);
      } else if (panel === 'right') {
        const leftPanelActualWidth = showLeftPanelRef.current ? leftPanelWidthRef.current + 8 : 0;
        const minimumMiddleWidth = 320;
        const maxRightWidth = window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - 20;

        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(maxRightWidth, startRightWidth - deltaX)
        );
        setRightPanelWidth(newWidth);
      }
    };

    const onEnd = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.style.touchAction = '';

      document.removeEventListener('mousemove', onMove, { capture: true });
      document.removeEventListener('mouseup', onEnd, { capture: true });
      document.removeEventListener('touchmove', onMove, { capture: true });
      document.removeEventListener('touchend', onEnd, { capture: true });
      document.removeEventListener('touchcancel', onEnd, { capture: true });
      document.removeEventListener('contextmenu', onEnd, { capture: true });
    };

    document.addEventListener('mousemove', onMove, { capture: true });
    document.addEventListener('mouseup', onEnd, { capture: true });
    document.addEventListener('touchmove', onMove, { capture: true, passive: false });
    document.addEventListener('touchend', onEnd, { capture: true });
    document.addEventListener('touchcancel', onEnd, { capture: true });
    document.addEventListener('contextmenu', onEnd, { capture: true });
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

      {/* Draggable Bar for Left Panel */}
      {showLeftPanel && (
        <div
          className="w-2 bg-gray-700 cursor-col-resize relative flex-shrink-0"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
          onTouchStart={(e) => handleMouseDown(e, 'left')}
          style={{ touchAction: 'none' }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
        </div>
      )}

      {/* Middle Panel with Tabs */}
      <div className="flex p-1 sm:px-2 flex-col flex-grow"
        style={{
          minWidth: '320px', // Ensure middle panel has a minimum width
        }}>
        <div className="flex justify-between items-center rounded-md bg-primary-foreground px-1 sm:px-1">
          <div className="flex flex-col flex-grow bg-background text-gray-100">
            <Tabs defaultValue="chat" className="flex flex-col my-0">
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
                    {/* <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                    title="Open Domain Builder guide"
                  >
                    <HelpCircle className="h-3 w-3 ms-5" />
                  </span> */}
                  </TabsTrigger>
                  <TabsTrigger value="model" className="text-xs sm:text-sm mt-0">
                    Current Model Suite
                    {/* <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                    title="Open model guide"
                  >
                    <HelpCircle className="h-3 w-3 ms-5" />
                  </span> */}
                  </TabsTrigger>
                  <TabsTrigger value="domain2" className="text-xs sm:text-sm mt-0">
                    Domain Builder2
                    {/* <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                    title="Open Domain Builder guide"
                  >
                    <HelpCircle className="h-3 w-3 ms-5" />
                  </span> */}
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
              {/* Domain  */}
              <TabsContent value="domain" className="flex-1 p-1 mt-1  h-[calc(100vh-8rem)]">
                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                  <h5 className="text-gray-400 font-bold">Name</h5>
                  <input
                    type="text"
                    defaultValue={domainData?.name}
                    // onChange={(e) => dispatch(updateMetisInfo({
                    //   name: e.target.value,
                    //   description: ontologyData?.description
                    // }))}
                    className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full"
                  />
                  <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                  <textarea
                    defaultValue={domainData?.description}
                    // onChange={(e) => dispatch(updateMetisInfo({
                    //   name: data.phData.metis.name,
                    //   description: e.target.value
                    // }))}
                    className="bg-background p-1 border border-gray-500 rounded w-full resize-vertical"
                    rows={5}
                  />
                  <h5 className="text-gray-400 p-1 font-bold">Presentation</h5>
                  <textarea
                    defaultValue={domainData?.presentation}
                    // onChange={(e) => dispatch(updateMetisInfo({
                    //   name: data.phData.metis.name,
                    //   description: e.target.value
                    // }))}
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
        </div>
      </div>

      {/* Draggable Bar for Right Panel */}
      {
        showRightPanel && (
          <div
            className="w-2 bg-gray-700 hover:bg-gray-500 cursor-col-resize relative flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, 'right')}
            onTouchStart={(e) => handleMouseDown(e, 'right')}
            style={{ zIndex: 10, touchAction: 'none' }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
          </div>
        )
      }

      {/* Right Panel: Markdown Preview ------------------------------------------------------------------------*/}
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
            <DocumentPanel
              mdContent={mdPreview}
              setMdContent={setMdPreview}
              setIsLibraryOpen={setIsLibraryOpen}
              isLibraryOpen={isLibraryOpen}
              panelType='right'
            />
          </div>
        )
      }
      {/* Add the modal at the end of the component */}
      < Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
        <GettingStartedGuide />
      </Modal >
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

    </div >
  );
}

// import DomainBuilder from "@/components/domain-builder/DomainBuilder";
// import ModelComponent from "@/features/model-universe/components/ModelComponent";

// export default function VercelAiPage() {

//   return (
//     <div className="flex flex-col w-full h-full overflow-hidden">
//       {/* {chatOutput && <div className="chat-output">{chatOutput}</div>} */}
//       <div className="flex flex-col ">
//       <ModelComponent />
//       <div className="flex overflow-hidden">
//         <DomainBuilder />
//       </div>
//       </div>
//     </div>
//   );
// }