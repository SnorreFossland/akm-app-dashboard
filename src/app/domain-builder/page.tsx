"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { HelpCircle } from 'lucide-react';
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

import DomainBuilder from "@/components/domain-builder/DomainBuilder";
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { LoadingCircularProgress } from "@/components/loading";
import { setDomainData } from "@/features/model-universe/modelSlice";
import GettingStartedGuide from '@/components/domain-builder/GettingStartedGuide';

export default function DomainBuilderPage() {
  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
  const dispatch = useDispatch();

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [domainName, setDomainName] = useState(data?.phData?.domain?.name || "");
  const [domainDescription, setDomainDescription] = useState(data?.phData?.domain?.description || "");
  const [domainPresentation, setDomainPresentationState] = useState(data?.phData?.domain?.presentation || "");

  const [activeTab, setActiveTab] = useState("instructions");

  // Draggable divider state
  const [dividerPosition, setDividerPosition] = useState(40); // 40% default width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Reusable IconButton component
  interface IconButtonProps {
    onClick: () => void;
    icon: any;
    className?: string;
    iconWidth?: string;
    iconSize?: SizeProp;
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

  // IRTV Builder handlers
  const handleIrtvResponseChange = (response: string) => {
    // Handle IRTV response logic
    console.log('IRTV Response:', response);
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
      {/* Left Panel */}
      {showLeftPanel && (
      <div className="bg-gray-800 overflow-y-auto" style={{ width: leftPanelWidth + "px", minWidth: "200px" }}>
        <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-blue-400">Domain Builder Tools</h2>
        {/* Add your left panel content here */}
        <div className="space-y-4">
          <div className="bg-gray-700 p-3 rounded">
          <h3 className="font-semibold mb-2">Domain Templates</h3>
          <p className="text-sm text-gray-300">Pre-built domain templates</p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
          <h3 className="font-semibold mb-2">Domain Analyzer</h3>
          <p className="text-sm text-gray-300">Analyze domain structure</p>
          </div>
        </div>
        </div>
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
      <div className="flex flex-col h-full overflow-hidden flex-1 min-w-[300px]">
      {/* Tab Structure */}
      <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden">
        <Tabs defaultValue="domain-builder" className="flex flex-col my-0 h-full">
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
          <span className="self-center inline-block w-auto text-xs sm:text-sm ml-4 pt-1 text-blue-400">Domain definition:</span>
          <TabsList className="grid grid-cols-3 bg-primary-foreground my-0 h-6 flex-1 mx-2">
          <TabsTrigger value="domain-builder" className="text-xs sm:text-sm mt-0">
            Domain Builder
            <span
            onClick={() => setShowGuideModal(true)}
            className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
            title="Open Domain Builder guide"
            >
            <HelpCircle className="h-3 w-3 ms-5" />
            </span>
          </TabsTrigger>
          <TabsTrigger value="model" className="text-xs sm:text-sm mt-0">
            Model
            <span
            onClick={() => setShowGuideModal(true)}
            className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
            title="Open model guide"
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
        <TabsContent value="domain-builder" className="flex-1 px-1 mt-1">
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4">
          <div className="flex overflow-hidden">
            <DomainBuilder />
          </div>
          </div>
        </TabsContent>

        <TabsContent value="model" className="flex-1 px-1 mt-1">
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4">
          <h2 className="text-xl font-bold mb-4">Model View</h2>
          <ModelComponent />
          </div>
        </TabsContent>
        </Tabs>
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
        {/* Right Resize Handle */}
        <div className="bg-gray-800 overflow-y-auto" style={{ width: rightPanelWidth + "px", minWidth: "200px" }}>
        {/* Right panel */}
        <div className="border-solid rounded border-1 border-green-900 h-full overflow-y-hidden" style={{ width: "100%" }} ref={containerRef}>
          <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
            <TabsTrigger value="instructions" className="pb-2 mt-3">
              Instructions
            </TabsTrigger>
            <TabsTrigger value="presentation" className="pb-2 mt-3">
              Domain Definition
            </TabsTrigger>
            <TabsTrigger value="preview" className="pb-2 mt-3">
              Preview
            </TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="m-0 px-1 py-2 rounded bg-background ">
            <div className="h-full p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
              <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Domain Builder</h2>

              <p className="text-white mb-3">
              The Domain Builder helps you define and create comprehensive domain knowledge collections
              that will be used by AI models to provide accurate and relevant information.
              </p>

              <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

              <ol className="text-white list-decimal ml-5 space-y-2">
              <li><span className="font-bold">Define your domain:</span> Provide a name and detailed description.</li>
              <li><span className="font-bold">Use existing prompt:</span> Your domain will use the prompt created in the Prompt Builder.</li>
              <li><span className="font-bold">Generate definition:</span> Let AI create a comprehensive domain presentation.</li>
              <li><span className="font-bold">Edit and refine:</span> Customize the generated content to your needs.</li>
              <li><span className="font-bold">Keep:</span> Save your domain definition for use in knowledge models.</li>
              </ol>

              <div className="mt-6 p-3 border border-green-700 rounded bg-background">
              <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
              <ul className="text-white list-disc ml-5 space-y-1">
                <li>Be specific in your domain description</li>
                <li>Make sure you have a well-crafted prompt from the Prompt Builder</li>
                <li>Review and edit the AI-generated presentation</li>
                <li>Consider adding examples and use cases</li>
              </ul>
              </div>
            </div>
            </TabsContent>

            <TabsContent value="presentation" className="m-0 px-1 py-2 rounded bg-background">
            <div className="p-2 bg-background rounded border border-gray-700 max-h-[200px] overflow-y-auto overflow-x-hidden w-full h-full">
              <div className="p-2 bg-background rounded border border-gray-700 w-full h-full overflow-y-auto">
              <ReactMarkdown
                className="prose prose-sm text-gray-300 break-words whitespace-pre-wrap w-full"
                components={{
                pre: ({ node, ...props }) => (
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ maxWidth: '100%', overflowWrap: 'break-word' }} {...props} />
                )
                }}>
                {domainPresentation || "No presentation generated yet. Fill in the domain information and click 'Generate Definition'."}
              </ReactMarkdown>
              </div>
            </div>
            </TabsContent>

            <TabsContent value="preview" className="m-0 px-1 py-2 rounded bg-background">
            <div className="p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 max-h-[calc(100vh-21rem)]">
              <div className="bg-background rounded-lg p-6 shadow-lg border border-gray-700">
              <h1 className="text-2xl font-bold text-green-400 mb-4">{domainName || "Domain Name"}</h1>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Description</h3>
                <p className="text-gray-400">
                {domainDescription || "No description provided"}
                </p>
              </div>

              {domainPresentation && (
                <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Domain Knowledge</h3>
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                  {domainPresentation}
                </ReactMarkdown>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Next Steps</h3>
                <ActionCardTitleButton
                title="Go to Knowledge Explorer"
                done={true}
                onClick={() => window.location.href = "/knowledge-explorer"}
                icon={faLink}
                />
              </div>
              </div>
            </div>
            </TabsContent>
          </Tabs>
          </Card>
        </div>
        </div>
      </>
      )}
                  {/* Add the modal at the end of the component */}
                  < Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
                      <GettingStartedGuide />
                  </Modal >
    </div>
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