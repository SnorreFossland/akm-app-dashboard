"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';

import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

import ConceptBuilder from '@/components/concept-builder/ConceptBuilder';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { OntologyCard } from '@/components/ontology-card';
import { LoadingCircularProgress } from "@/components/loading";
import GettingStartedGuide from '@/components/concept-builder/GettingStartedGuide';

export default function ConceptBuilderPage() {
  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
  const dispatch = useDispatch();

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

  const [activeTab, setActiveTab] = useState("instructions");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Sample data for ontology - replace with actual data
  const ontologyDataList = data?.phData?.suggestedOntology || null;
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
            <h2 className="text-xl font-bold mb-4 text-blue-400">Concept Builder Tools</h2>
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="font-semibold mb-2">Concept Templates</h3>
                <p className="text-sm text-gray-300">Pre-built concept templates</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="font-semibold mb-2">Concept Analyzer</h3>
                <p className="text-sm text-gray-300">Analyze concept structure</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="font-semibold mb-2">Concept Library</h3>
                <p className="text-sm text-gray-300">Browse existing concepts</p>
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
        <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden">
          <Tabs defaultValue="concept-builder" className="flex flex-col my-0 h-full">
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
              <span className="self-center inline-block w-auto text-xs sm:text-sm ml-4 pt-1 text-blue-400">Concept definition:</span>
              <TabsList className="grid grid-cols-2 bg-primary-foreground my-0 h-6 flex-1 mx-2">
                <TabsTrigger value="concept-builder" className="text-xs sm:text-sm mt-0">
                  Concept Builder
                  <span
                    onClick={() => setShowGuideModal(true)}
                    className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full pl-1"
                    title="Open Concept Builder guide"
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
            <TabsContent value="concept-builder" className="flex-1 mt-1 p-1">
              <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-1">
                <div className="flex overflow-hidden">
                  <ConceptBuilder />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="model" className="flex-1mt-1">
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
        <div className="bg-gray-800 overflow-y-auto" style={{ width: rightPanelWidth + "px", minWidth: "200px" }}>
          <div className="border-solid rounded border-1 border-green-900 h-full overflow-y-hidden" style={{ width: "100%" }} ref={containerRef}>
            <div className="border-solid rounded border-4 border-blue-800 w-full overflow-y-none">
              <Card className="p-1 h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                    <TabsTrigger value="existing-concepts" className="pb-2 mt-3">Existing Ontology Concepts</TabsTrigger>
                    <TabsTrigger value="suggested-concepts" className="pb-2 mt-3">Suggested Ontology Concepts</TabsTrigger>
                  </TabsList>
                  <TabsContent value="existing-concepts" className="m-0 px-1 py-2 rounded bg-background">
                    <div className="mx-1 bg-gray-700">
                      {data.phData.ontology ? (
                        <OntologyCard ontologyData={data.phData.ontology} />
                      ) : (
                        <div className="p-4 text-center text-gray-400">
                          No existing ontology data available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="suggested-concepts" className="m-0 px-1 py-2 rounded bg-background">
                    <>
                      <div className="flex justify-end pb-1 pt-0 mx-2">
                        <button onClick={handleOpenModal} className="fixed bg-blue-500 text-white rounded px-1 text-xs hover:bg-blue-700">
                          Show Prompt
                        </button>
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
                        {ontologyDataList &&
                          ontologyDataList.concepts &&
                          ontologyDataList.concepts.length > 0 ? (
                          <OntologyCard ontologyData={ontologyDataList} />
                        ) : (
                          <div className="p-4 text-center text-gray-400">
                            {isLoading ? 'Generating suggestions...' : 'No suggested concepts available. Click the robot button to generate suggestions.'}
                          </div>
                        )}
                      </div>
                    </>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      )}
      {/* Add the modal at the end of the component */}
      < Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
        <GettingStartedGuide />
      </Modal >
    </div>
  );
}