"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { setDomainData, setOntologyData } from '@/features/model-universe/modelSlice';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

import ConceptBuilder from '@/components/ontology-builder/ConceptBuilder';
import ChatComponent from '@/components/ontology-builder/ChatComponent';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { OntologyCard } from '@/components/ontology-card';
import { LoadingCircularProgress } from "@/components/loading";
import GettingStartedGuide from '@/components/ontology-builder/GettingStartedGuide';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';

interface ConceptBuilderPageProps {
  data: any;
  dispatch: any;
}

interface Domain {
  name: string;
  description: string;
  presentation: string;
}
interface Concept {
  name: string;
  description: string;
}

interface Relationship {
  name: string;
  nameFrom: string;
  nameTo: string;
  description: string;
}

interface Ontology {
  name: string;
  description: string;
  concepts: Concept[];
  relationships: Relationship[];
  presentation: string;
}
export default function ConceptBuilderPage() {
  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);

  const dispatch = useDispatch();
  const pathname = usePathname();

  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
  const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [conceptName, setConceptName] = useState(data?.phData?.concept?.name || "");
  const [conceptDescription, setConceptDescription] = useState(data?.phData?.concept?.description || "");
  const [conceptPresentation, setConceptPresentationState] = useState(data?.phData?.concept?.presentation || "");
  const [suggestedOntologyData, setSuggestedOntologyData] = useState<Ontology | null>(null);
  const [suggestedDomainData, setSuggestedDomainData] = useState<Domain | null>(null);


  const [activeTab, setActiveTab] = useState("instructions");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for touch/drag handling
  const leftPanelWidthRef = useRef(leftPanelWidth);
  const rightPanelWidthRef = useRef(rightPanelWidth);
  const showLeftPanelRef = useRef(showLeftPanel);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>('')
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [existingConcepts, setExistingConcepts] = useState<any[]>([]);
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);
  const [suggestedConceptData, setSuggestedConceptData] = useState<any>(null);

  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState(''); // <-- error state

  // Draggable divider state
  const [dividerPosition, setDividerPosition] = useState(40); // 40% default width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Panel sizing constants
  const MIN_PANEL_WIDTH = 300;
  const MAX_PANEL_WIDTH = () => window.innerWidth * 0.6;

  const middlePanelWidth = typeof window !== 'undefined'
    ? window.innerWidth - (showLeftPanel ? leftPanelWidth : 0) - (showRightPanel ? rightPanelWidth : 0) - 40
    : 800;

  // Sample data for ontology - replace with actual data
  // setSuggestedOntologyData(data?.phData?.suggestedOntology || null);
  const printPromptsDiv = <div>Sample prompt content</div>; // Replace with actual prompt content

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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

  const handleAddMD = () => {
    mdFileInputRef.current?.click()
  }
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
        const minimumMiddleWidth = 150;
        const maxRightWidth = window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - 10;

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

  const handleSaveToLibrary = () => {
    // Save to library in Redux store
    const contentToSave = mdContent;
    // const contentToSave = isEditing ? editContent : mdContent;
    const firstLine = contentToSave.includes('Domain Name')
        ? contentToSave.split('Domain Name:**')[1].split('\n')[0]?.trim() || ''
        : (contentToSave.split('\n')[0] || 'Document');
    if (pathname === '/domain-builder') {
      const secondLine = contentToSave.includes('Domain Description')
        ? contentToSave.split('Domain Description:**')[1].split('\n')[1]?.trim() || ''
        : 'AIChat: Document';

      console.log('133 DocumentPanel handleSaveToLibrary - first:', firstLine, 'second:', secondLine, 'pathname:', pathname);


      const domain = {
        name: firstLine,
        description: secondLine,
        presentation: contentToSave,
        prompt: '',
        additionalContext: '',
      }
      console.log('141 DomainBuilderPage dispatching domain data:', domain);
      dispatch(setDomainData({ ...domain }));
    } else if (pathname === '/ontology-builder') {
      if (!suggestedOntologyData) {
        alert('No Concept data to dispatch');
        return;
      }
      const updatedOntologyData = {
        status: 'succeeded' as const,
        phData: {
          ...data.phData,
          ontology: suggestedOntologyData,
        },
        phFocus: data.phFocus,
        phUser: data.phUser,
        phSource: data.phSource,
      };

      const uniqueConcepts = Array.from(new Map(updatedOntologyData.phData.ontology.concepts.map((item: Concept) => [item.name, item])).values());
      const uniqueRelationships = Array.from(new Map(updatedOntologyData.phData.ontology.relationships.map((item: Relationship) => [item.name, item])).values());

      updatedOntologyData.phData.ontology.concepts = uniqueConcepts;
      updatedOntologyData.phData.ontology.relationships = uniqueRelationships;

      console.log('337 Ontology data to dispatch:', updatedOntologyData);

      dispatch(setOntologyData(updatedOntologyData));
      setSuggestedOntologyData(null);
      // setDispatchDone(true);
    } else {
      dispatch(saveMarkdownDocument({
        id: Date.now().toString(),
        name: firstLine,
        type: 'markdown',
        content: contentToSave,
        createdAt: new Date().toISOString()
      }));
      onSaveToLibrary(contentToSave);
    }
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
          {(mdContent && mdContent.length > 0)
            ?
            <DocumentPanel
              mdContent={mdContent}
              setMdContent={setMdContent}
              setIsLibraryOpen={setIsLibraryOpen}
              isLibraryOpen={isLibraryOpen}
              panelType='left'
            />
            :
            <>
              <DocumentPanel
                mdContent={``}
                setMdContent={setMdContent}
                setIsLibraryOpen={setIsLibraryOpen}
                isLibraryOpen={isLibraryOpen}
                panelType='left'
              />
            </>
          }
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
            <Tabs defaultValue="chat" className="flex flex-col my-0 h-full">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between">
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
                <TabsList className="grid grid-cols-5 bg-primary-foreground my-0 h-6 flex-1 mx-2 relative z-10">
                  <TabsTrigger value="chat" className="text-xs sm:text-sm mt-0">
                    AI Ontology Builder
                    <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                      title="Open Domain Builder guide"
                    >
                      <HelpCircle className="h-3 w-3 ms-5" />
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="ontology" className="text-xs sm:text-sm mt-0">
                    Current Ontology
                    <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                      title="Open model guide"
                    >
                      <HelpCircle className="h-3 w-3 ms-5" />
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="concept-builder" className="text-xs sm:text-sm mt-0">
                    Advanced Builder
                    <span
                      onClick={() => setShowGuideModal(true)}
                      className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                      title="Open Concept Builder guide"
                    >
                      <HelpCircle className="h-3 w-3 ms-5" />
                    </span>
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
              <TabsContent value="ontology" className="flex-1 p-1 m-1">
                <div className="mx-1 bg-gray-700">
                  {data.phData.ontology ? (
                    <OntologyCard domainData={data.phData.domain || null} ontologyData={data.phData.ontology} />
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No existing ontology data available
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="model" className="flex-1 px-1 mt-1">
                <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4">
                  {/* <h2 className="text-xl font-bold mb-4">Models</h2> */}
                  <ModelComponent />
                </div>
              </TabsContent>
              <TabsContent value="concept-builder" className="flex-1 px-1 mt-1">
                <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
                  <div className="flex overflow-hidden">
                    <ConceptBuilder
                      suggestedOntologyData={suggestedOntologyData}
                      setSuggestedOntologyData={setSuggestedOntologyData}
                    />
                  </div>
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
          onTouchStart={(e) => handleMouseDown(e, 'right')}
          style={{ zIndex: 10, touchAction: 'none' }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
        </div>
      )}

      {/* Right Panel */}
      {showRightPanel && (
        <>
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
            <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
              <Card className="p-1 h-full">
                <CardTitle className="text-sm font-bold">Suggested Ontology</CardTitle>
                <div className="flex justify-end pb-1 pt-0 mx-2">
                  <button
                    title="Save to Library"
                    onClick={handleSaveToLibrary}
                    className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save to Library
                  </button>
                  {/* <button onClick={handleOpenModal} className="fixed bg-blue-500 text-white rounded px-1 text-xs hover:bg-blue-700">
                    Show Prompt
                  </button> */}
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-5xl">
                      <DialogHeader>
                        <DialogDescription>
                          {printPromptsDiv}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="mx-1 bg-gray-700">
                  <OntologyCard domainData={suggestedDomainData} ontologyData={suggestedOntologyData} />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
      {/* Add the modal at the end of the component */}
      <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
        <GettingStartedGuide />
      </Modal>
    </div>
  );
}