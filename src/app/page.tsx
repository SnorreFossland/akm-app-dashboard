"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from 'next/navigation';
import type { RootState } from "@/store";
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { FileOperations } from "@/components/FileOperations";
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import UniverseComponent from "@/features/model-universe/components/UniverseComponent";
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';

import { ThreePanelLayout } from "@/components/ThreePanelLayout";
import { ObjectCard } from '@/components/object-card';
import { Model, saveMarkdownDocument, deleteMarkdownDocument, MarkdownDocument } from '@/features/model-universe/modelSlice';

export default function Home() {
  const data = useSelector((state: RootState) => state.modelUniverse);
  const documents = useSelector((state: RootState) => data.phData.documents);
  const dispatch = useDispatch();
  const router = useRouter();
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [focusModel, setFocusModel] = useState<{ id: string; name: string } | null>(null);

  // State for panel management
  const [activeTab, setActiveTab] = useState("ai-chat");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(400);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [activeLeftTab, setActiveLeftTab] = useState<'document' | 'library' | 'guide'>('guide');
  const [activeRightTab, setActiveRightTab] = useState<'model' | 'help'>('help'); // Changed default to 'help' since model is moved

  // Document management
  const [mdContent, setMdContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [docName, setDocName] = useState<string>('Welcome');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Refs for panel management
  const leftPanelWidthRef = useRef(leftPanelWidth);
  const rightPanelWidthRef = useRef(rightPanelWidth);
  const showLeftPanelRef = useRef(showLeftPanel);
  const mdFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Panel sizing constants
  const MIN_PANEL_WIDTH = 300;
  const MAX_PANEL_WIDTH = () => window.innerWidth * 0.6;

  useEffect(() => {
    if (data.phFocus) {
      setFocusModel(data.phFocus.focusModel);
      setCurrentModel(data.phData.metis?.models?.find(model => model.id === focusModel?.id) || null);
    }
  }, [data.phFocus, data.phData.metis, focusModel?.id]);

  // Update refs when state changes
  useEffect(() => {
    leftPanelWidthRef.current = leftPanelWidth;
  }, [leftPanelWidth]);

  useEffect(() => {
    rightPanelWidthRef.current = rightPanelWidth;
  }, [rightPanelWidth]);

  useEffect(() => {
    showLeftPanelRef.current = showLeftPanel;
  }, [showLeftPanel]);

  // Handle window resize to keep panels within bounds
  useEffect(() => {
    const handleResize = () => {
      const leftPanelActualWidth = showLeftPanel ? leftPanelWidth + 8 : 0;
      const minimumMiddleWidth = 150;
      const dragBarWidth = 8;
      const padding = 80;
      const maxRightWidth = Math.max(
        MIN_PANEL_WIDTH,
        window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - dragBarWidth - padding
      );

      // Adjust right panel if it's too wide
      if (rightPanelWidth > maxRightWidth) {
        setRightPanelWidth(maxRightWidth);
      }

      // Adjust left panel if it's too wide
      const maxLeftWidth = Math.min(window.innerWidth * 0.5, 800);
      if (leftPanelWidth > maxLeftWidth) {
        setLeftPanelWidth(maxLeftWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [leftPanelWidth, rightPanelWidth, showLeftPanel]);

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
        const dragBarWidth = 8;
        const padding = 40;
        const maxRightWidth = Math.max(
          MIN_PANEL_WIDTH,
          window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - dragBarWidth - padding
        );

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
    };

    document.addEventListener('mousemove', onMove, { capture: true });
    document.addEventListener('mouseup', onEnd, { capture: true });
    document.addEventListener('touchmove', onMove, { capture: true });
    document.addEventListener('touchend', onEnd, { capture: true });
    document.addEventListener('touchcancel', onEnd, { capture: true });
  };

  // Handler functions
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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

  const handleSelectFromLibrary = (content: string, name: string, _doc?: MarkdownDocument) => {
    setMdContent(content);
    setDocName(name);
    setIsEditing(false);
    setActiveLeftTab('document'); // Switch to document tab
    setIsLibraryOpen(false); // Close the library modal after selection

    console.log("Selected document from library:", { content, name });
  };

  const handleSaveDocument = (content: string, name: string) => {
    dispatch(saveMarkdownDocument({ id: Date.now().toString(), name, type: 'markdown', content, createdAt: new Date().toISOString() }));
  };

  const handleShowInLeftPanel = (content: string, name: string) => {
    setMdContent(content);
    setDocName(name);
    setActiveLeftTab('document');
    setIsLibraryOpen(false);
  };

  const leftPanelContent = {
    tabs: [
      {
        key: 'current-context',
        label: 'Current Context',
        content: (
          <div className="p-4">
            <div className="space-y-4 p-1 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
              This Left panel is the Input area for the activity in your Workplace. It can be current context or additional context you want to add to your documents/Models.
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Current Context</h3>
              <p className="text-sm text-gray-300 mb-4">
                is the context you are working on. It can be:
              </p>
              <ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
                <li>
                  a document you are editing or refining.
                </li>
                <li>
                  a Domain description / definition for your current project or product.
                </li>
                <li>
                  an Ontology with terms and relationships.
                </li>
                <li>
                  a Model with objects and relationships.
                </li>
              </ul>
              ...
              <p>You can add additional context by loading a file, or by typing or pasting text, lists etc.</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Additional Context</h3>
              <p className="text-sm text-gray-300 mb-4">
                is the context you add to your work. It can be:
              </p>
              <ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
                <li>
                  a document you want to add.
                </li>
                <li>
                  a text or subdomain you want to add to your current Domain description / definition for your current project or product.
                </li>
                <li>
                  terms and relationships you want to add to your current Ontology with.
                </li>
                <li>
                  objects and relationship you want to add to your model.
                </li>
              </ul>
              ...
              <p>You can add additional context by loading a file, or by typing or pasting text, lists etc.</p>
            </div>
          </div>
        )
      },
      // {
      //   key: 'getting-started',
      //   label: 'Guide',
      //   content: <GettingStartedGuide />
      // },
      // {
      //   key: 'document',
      //   label: 'New Context',
      //   content: (
      //     <DocumentPanel
      //       mdContent={mdContent}
      //       setMdContent={setMdContent}
      //       onSave={(content: string) => handleSaveDocument(content, docName)}
      //       isLibraryOpen={isLibraryOpen}
      //       setIsLibraryOpen={setIsLibraryOpen}
      //       panelType='left'
      //     />
      //   )
      // },
      // {
      //   key: 'object-card',
      //   label: 'Model Card',
      //   content: currentModel ? (
      //     <ObjectCard model={{
      //       id: currentModel.id,
      //       name: currentModel.name,
      //       description: currentModel.description,
      //       objects: currentModel.objects?.map(obj => ({
      //         id: obj.id || '',
      //         name: obj.name || '',
      //         description: obj.description || '',
      //         proposedType: obj.proposedType || '',
      //         typeRef: obj.typeRef || '',
      //         typeName: obj.typeName || '',
      //         category: obj.category || ''
      //       })) || [],
      //       relships: currentModel.relships || [],
      //       metamodelRef: currentModel.metamodelRef,
      //       modelviews: currentModel.modelviews
      //     }} />
      //   ) : <div className="p-4 text-gray-400">No model selected</div>
      // }
    ],
    defaultTab: 'current-context'
  };

  // Define right panel content without the Model tab
  const rightPanelContent = {
    tabs: [
      // {
      //   key: 'document',
      //   label: 'Preview',
      //   content: (
      //     <DocumentPanel
      //       mdContent={mdContent}
      //       setMdContent={setMdContent}
      //       onSave={(content: string) => handleSaveDocument(content, docName)}
      //       isLibraryOpen={isLibraryOpen}
      //       setIsLibraryOpen={setIsLibraryOpen}
      //       panelType='right'
      //     />
      //   )
      // },
      {
        key: 'help',
        label: '...',
        content: (
          <div className="p-4">
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">This is the Output Panel</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Use this panel to view and interact with the output from the AI chat.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Preview response text from AI chat</li>
                  <li>• Edit the response</li>
                  <li>• Save the response preview to the library (store it for later use)</li>
                  <li>• Save to a local file</li>
                </ul>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Modelling</h3>
                <p className="text-sm text-gray-300">
                  Use this panel to approve, edit and modify your AI generated Mimris model artifacts.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ],
    defaultTab: 'help'
  };

  return (
    <>
      {/* {showFileOperations && ( */}
      <div className="mb-2 pb-2 border-b border-gray-700">
        <FileOperations />
      </div>
      {/* )} */}
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
        <Tabs defaultValue="overview" className="flex flex-col flex-1">
          {/* Main Tabs */}
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto pt-2 z-20">
            <TabsTrigger value="overview">AI Chat</TabsTrigger>
            <TabsTrigger value="model">Current Universe</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="flex-1 px-1 mt-0">
            <div className="p-2 flex h-full">
              {/* Guide Sidebar */}
              {showGuide && (
                <div className="flex flex-col items-center mb-2 me-2 px-1 border border-yellow-800 rounded-lg w-full max-w-md h-full">
                  <div className="flex items-center justify-between w-full px-1">
                    <div className="text-lg font-semibold text-orange-500/60">
                      Guide
                    </div>
                    {showGuide && (
                      <button
                        onClick={() => setShowGuide(false)}
                        title="Close Guide"
                        className="ml-auto"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 bg-yellow-900/60 ">
                    <div className="flex flex-col gap-2">
                      <div className="space-y-4 p-1 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        <div className="p-4 border border-gray-700 rounded-lg bg-secondary/80">
                          <h3 className="text-lg font-semibold text-white mb-2">Workplace</h3>
                          <p className="text-sm text-gray-300 mb-4">
                            The AI Assisted Workplace is designed to help you create and enhance documents and to build and analyze models using AI.
                          </p>
                          <p className="text-sm text-gray-300 mb-4">The workplace has three panels: left, middle (main), and right.</p>
                          <ul className="space-y-2 text-sm text-gray-300">
                            <li>• The left panel is setting the input context.</li>
                            <li>• The middle panel is where the work happens and showing the current status on documents and models</li>
                            <li>• The right panel is for preview and edit output from the AI Chat and reports from the current models.</li>
                          </ul>
                        </div>
                        <div className="p-4 border border-gray-700 rounded-lg bg-secondary/80">
                          <h3 className="text-lg font-semibold text-white mb-2">Quick Tips</h3>
                          <ul className="space-y-2 text-sm text-gray-300">
                            <li>• Drag panel borders to resize</li>
                            <li>• Use tabs to switch between views</li>
                            <li>• Save frequently used documents</li>
                            <li>• Explore the AI tools for assistance</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto bg-gray-800/20">
                <div className="flex items-center gap-2">
                  {!showGuide && (
                    <button
                      onClick={() => setShowGuide(true)}
                      className="text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                      title="Show Guide"
                    >
                      <HelpCircle className="bg-yellow-700 text-white rounded h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white my-2">
                      Welcome to the AI Assisted Workplace
                    </h1>
                    <p className="text-xl text-gray-300 mb-6">
                      Your comprehensive platform for AI-powered model building and analysis
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-green-400 mb-3">Quick Start</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        New to the platform? Start with our guided tutorials and examples.
                      </p>
                      <Button
                        onClick={() => router.push('/ai-chat')}
                        className="w-full bg-green-600 hover:bg-green-700 mt-auto">
                        Get Started
                      </Button>
                    </Card>

                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-blue-400 mb-3">AI Chat</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Interact with AI assistant using predefined Template prompts to get the most out of AI Chat!
                      </p>
                      <Button
                        onClick={() => router.push('/ai-chat')}
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
                        Open Chat
                      </Button>
                    </Card>

                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-blue-400 mb-3">Prompt Generator</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Interact with AI assistant to generate the perfect prompt!
                      </p>
                      <Button
                        onClick={() => router.push('/prompt-builder')}
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">
                        Generate Prompt
                      </Button>
                    </Card>

                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-orange-400 mb-3">Scope Domain</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Scope and Define the actual Domain with AI assistance.
                      </p>
                      <Button
                        onClick={() => router.push('/domain-builder')}
                        className="w-full bg-orange-600/70 hover:bg-orange-700 mt-auto">
                        Define Domain
                      </Button>
                    </Card>
                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-orange-400 mb-3">Ontology Builder</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Create and manage the atual Ontology Concepts and Relationships with AI assistance.
                      </p>
                      <Button
                        onClick={() => router.push('/ontology-builder')}
                        className="w-full bg-orange-600/70 hover:bg-orange-700 mt-auto">
                        Build Ontology Concepts
                      </Button>
                    </Card>
                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">

                    </Card>

                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-purple-400 mb-3">POPS Model Builder</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Create and manage sophisticated POPS models with AI assistance.
                      </p>
                      <Button
                        onClick={() => router.push('/domain-builder')}
                        className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">
                        Build POPS Models
                      </Button>
                    </Card>

                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-purple-400 mb-3">IRTV Model Builder</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Create and manage sophisticated IRTV models with AI assistance.
                      </p>
                      <Button
                        onClick={() => router.push('/domain-builder')}
                        className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">
                        Build IRTV Models
                      </Button>
                    </Card>

                    <Card className="p-6 bg-gray-800/50 border-gray-600 flex flex-col">
                      <CardTitle className="text-purple-400 mb-3">META Model Builder</CardTitle>
                      <p className="text-gray-300 mb-4 flex-grow">
                        Create and manage sophisticated META models with AI assistance.
                      </p>
                      <Button
                        onClick={() => router.push('/domain-builder')}
                        className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">
                        Build META Models
                      </Button>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="flex-1 px-1 mt-0">
            <div className="flex-1 overflow-auto bg-gray-800/20 p-0">
              <UniverseComponent />
            </div>
          </TabsContent>

          <TabsContent value="about" className="flex-1 px-1 mt-0">
            <div className="flex-1 overflow-auto bg-gray-800/20 p-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Platform Overview</h2>

                <div className="space-y-6">
                  <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-green-400 mb-3">Features</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• AI-powered model generation and analysis</li>
                      <li>• Interactive domain and ontology building</li>
                      <li>• Advanced prompt engineering tools</li>
                      <li>• Real-time collaboration and sharing</li>
                      <li>• Comprehensive documentation system</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-400 mb-3">Available Tools</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-200">AI & Chat</h4>
                        <p className="text-sm text-gray-400">Interactive AI assistants for model building</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-200">Domain Builder</h4>
                        <p className="text-sm text-gray-400">Define and structure your problem domains</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-200">Ontology Builder</h4>
                        <p className="text-sm text-gray-400">Create comprehensive ontologies</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-200">Model Builder</h4>
                        <p className="text-sm text-gray-400">Build and refine complex models</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>


          <TabsContent value="help" className="flex-1 px-1 mt-0">
            <div className="flex-1 overflow-auto bg-gray-800/20 p-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Help & Support</h2>
                <div className="space-y-6">
                  <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-orange-400 mb-3">Getting Help</h3>
                    <div className="space-y-3">
                      <p className="text-gray-300">
                        Need assistance? Here are the best ways to get help:
                      </p>
                      <ul className="space-y-2 text-gray-300">
                        <li>• Check the Getting Started guide in the left panel</li>
                        <li>• Use the AI Chat for interactive assistance</li>
                        <li>• Browse the documentation library</li>
                        <li>• Explore example models and templates</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-red-400 mb-3">Common Issues</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-200">Panel Management</h4>
                        <p className="text-sm text-gray-400">Use the toggle buttons in the header to show/hide left and right panels</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">Saving Work</h4>
                        <p className="text-sm text-gray-400">Click on <span className="font-semibold">save</span> to your library</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">Navigation</h4>
                        <p className="text-sm text-gray-400">Use the sidebar to switch between different tools</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ThreePanelLayout>

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
  );
}
