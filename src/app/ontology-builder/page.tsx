"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { setDomainData, setOntologyData, Model } from '@/features/model-universe/modelSlice';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

import OntologyBuilder from '@/components/ontology-builder/OntologyBuilder';
import ChatComponent from '@/components/ontology-builder/ChatComponent';
// import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { OntologyCard } from '@/components/ontology-card';
import { LoadingCircularProgress } from "@/components/loading";
import Guide from '@/components/ontology-builder/Guide';
import GettingStartedGuide from '@/components/ontology-builder/GettingStartedGuide';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from '@/components/FileOperations';

export interface ChatComponentProps {
  input: string;
  setInput: (input: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onResponseChange: (response: string) => void;
  onViewInMarkdown: (content: string) => void;
  setShowLeftPanel: (show: boolean) => void;
  chatInput?: string;
  onAddMD: () => void;
  mdContent: string;
  setMdContent: (content: string) => void;
  mdPreview: string;
  setMdPreview: (content: string) => void;
  setCurrentMessages: (messages: any[]) => void;
  previewMessageIndex?: number | null;
  gettingStartedGuide?: React.ReactNode;
  guide?: React.ReactNode;  // Add this line
}
interface OntologyBuilderPageProps {
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

export default function OntologyBuilderPage() {
  const dispatch = useDispatch();
  const pathname = usePathname();

  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
  const metis = data?.phData?.metis
  const documents = data.phData.documents;
  const domainData = data.phData.domain;

  const [ontology, setOntology] = useState<Ontology | null>(data.phData.ontology);

  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);

  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [conceptName, setConceptName] = useState(data?.phData?.concept?.name || "");
  const [conceptDescription, setConceptDescription] = useState(data?.phData?.concept?.description || "");
  const [conceptPresentation, setConceptPresentationState] = useState(data?.phData?.concept?.presentation || "");
  const [suggestedOntologyData, setSuggestedOntologyData] = useState<Ontology | null>(null);
  const [suggestedDomainData, setSuggestedDomainData] = useState<Domain | null>(null);

  const [activeTab, setActiveTab] = useState("ontology-builder");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>('')
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState<string>('');
  const [existingConcepts, setExistingConcepts] = useState<any[]>([]);
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);
  const [suggestedConceptData, setSuggestedConceptData] = useState<any>(null);

  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState('');

  // Sample data for ontology - replace with actual data
  const printPromptsDiv = <div>Sample prompt content</div>;

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleAddMD = () => {
    mdFileInputRef.current?.click()
  }
  useEffect(() => {
    console.log('128 OntologyBuilderPage mounted, data:', data);
    if (data.phData.ontology) {
      setOntology(data.phData.ontology);
    }
  }, []);

  useEffect(() => {
    if (data.phData.ontology) {
      setOntology(data.phData.ontology);
    }
  }, [data.phData.ontology]);
  useEffect(() => {
    if (data.phData.domain) {
      setDomainData(data.phData.domain);
    }
  }, [data.phData.domain]);
  const handleResponseChange = (response: string) => {
    // Handle response change
  };

  const handleViewInMarkdown = (response: string) => {
    const cleanResponse = (response: string) => {
      let cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
      cleaned = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
      return cleaned;
    };
    const cleanedResponse = cleanResponse(response);
    setMdPreview(cleanedResponse);
    setShowRightPanel(true);
  };

  const handleSaveToLibrary: () => void = () => {
    const contentToSave = mdContent;
    const firstLine = contentToSave.includes('Ontology Name')
      ? contentToSave.split('Ontology Name:**')[1].split('\n')[0]?.trim() || ''
      : (contentToSave.split('\n')[0] || 'Document');

    // if (pathname === '/domain-builder') {
    //   const secondLine = contentToSave.includes('Domain Description')
    //     ? contentToSave.split('Domain Description:**')[1].split('\n')[1]?.trim() || ''
    //     : 'AIChat: Document';

    //   const domain = {
    //     name: firstLine,
    //     description: secondLine,
    //     presentation: contentToSave,
    //     prompt: '',
    //     additionalContext: '',
    //   }
    //   dispatch(setDomainData({ ...domain }));
    // } else if (pathname === '/ontology-builder') {
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

    dispatch(setOntologyData(updatedOntologyData));
    // setSuggestedOntologyData(null);
    // }
  };

  // Define left panel content
  const leftPanelContent = {
    tabs: [
      {
        key: 'current-domain',
        label: 'Current Domain',
        content: (
          <div className="space-y-4 px-2 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            {data.phData.domain ? (
              <div className="p-2 bg-gray-800 rounded">
                {/* <div className="text-xl text-gray-400">{data.phData.domain.name}</div> */}
                {/* <div className="text-sm text-gray-400">{data.phData.domain.description}</div> */}
                {/* <div className="text-sm text-gray-400 mt-1">Definition:</div> */}
                <MarkdownPreview
                  mdPreview={data.phData.domain.presentation || 'No domain definition available'}
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
        key: 'current-context',
        label: 'Current Ontology',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
            <Card className="p-1 h-full">
              <CardTitle className="text-sm font-bold">Current Ontology</CardTitle>
              <div className="flex justify-end pb-1 pt-0 mx-2">
                <button
                  title="Save to Library"
                  onClick={handleSaveToLibrary}
                  className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                >
                  <BookmarkPlus className="h-4 w-4" />
                  Save to Library
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
                <OntologyCard ontologyData={ontology} />
              </div>
            </Card>
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

  const middlePanelContent = {
    tabs: [ 
      {
        key: 'chat',
        label: 'AI Ontology chat',
        content: (
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
              currentDocument={currentDocument}
              setCurrentDocument={setCurrentDocument}
              mdPreview={mdPreview}
              setMdPreview={setMdPreview}
              setCurrentMessages={setCurrentMessages}
              gettingStartedGuide={<GettingStartedGuide />}
              guide={<Guide />}
            />
          </div>
        )
      },
      {
        key: 'ontology',
        label: 'Current Ontology',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
            <Card className="p-1 h-full">
              <CardTitle className="text-sm font-bold">Current Ontology</CardTitle>
              <div className="flex justify-end pb-1 pt-0 mx-2">
                <button
                  title="Save to Library"
                  onClick={handleSaveToLibrary}
                  className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                >
                  <BookmarkPlus className="h-4 w-4" />
                  Save to Library
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
                <OntologyCard ontologyData={ontology} />
              </div>
            </Card>
          </div>
        )
      },
      // {
      //   key: 'ontology-builder',
      //   label: 'AI Ontology Builder',
      //   content: (
      //     <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
      //       <div className="flex overflow-hidden">
      //         <OntologyBuilder
      //           suggestedOntologyData={suggestedOntologyData}
      //           setSuggestedOntologyData={setSuggestedOntologyData}
      //           gettingStartedGuide={<GettingStartedGuide />}
      //           guide={<Guide />}
      //         />
      //       </div>
      //     </div>
      //   )
      // }
    ],
    defaultTab: 'ontology-builder'
  };

  // Define right panel content
  const rightPanelContent = {
    tabs: [
      {
        key: 'preview',
        label: 'Suggested Ontology',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
            <Card className="p-1 h-full">
              <div className="flex justify-end pb-1 pt-0 mx-2">
                <button
                  title="Save to Library"
                  onClick={handleSaveToLibrary}
                  className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                >
                  <BookmarkPlus className="h-4 w-4" />
                  Save to Library
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
                <OntologyCard ontologyData={suggestedOntologyData} />
              </div>
            </Card>
          </div>
        )
      }
    ],
    defaultTab: 'ontology'
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

  // Handle model selection changes
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = metis?.models.find((m: any) => m.name === event.target.value) || null;
    setCurrentModel(selected);
    // try to set a sensible curMetamodel when changing models
    const mm = (metis?.metamodels || []).find((mm: any) => mm.id === selected?.metamodelRef) || null;
    setCurMetamodel(mm);
  };

  const modelSelector = (false) ? (
    <div className="flex justify-between bg-gray-800 text-xs">
      <div className="px-1">
        <label htmlFor="metamodel-select" className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</label>
        <span className="text-gray-300">{metis?.name}</span>
      </div>
      <div className="px-1">
        <label htmlFor="model-select" className="me-1 font-bold text-gray-400 inline-block">Current Model:</label>
        <select id="model-select" className="ps-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={handleModelChange} value={currentModel?.name}>
          {metis?.models.map((model: { name: string }) => (
            <option key={model.name} value={model.name}>{model.name}</option>
          ))}
        </select>
      </div>
      <div className="px-1 me-auto">
        {/* <label htmlFor="model-view-select" className="me-2 font-bold text-gray-400 inline-block"></label> */}
        <span className="text-gray-400">{curMetamodel?.name || "Default"}</span>
      </div>
      <h3 className="flex ms-1 pl-1 font-bold text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length}</span></h3>
    </div>
  ) : (
    <div className="flex justify-between bg-gray-800 text-xs">
      <div className="px-1">
        <label htmlFor="metamodel-select" className="ms-1 font-bold text-gray-400 inline-block">Document:</label>
        <span className="text-gray-300">{documents?.[0]?.name ?? 'No document'}</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex-row h-screen">
      <div className="w-full border-b-2 border-gray-600">
        <FileOperations />
      </div>
      <ThreePanelLayout
        moduleOperations={modelSelector}
        leftPanelContent={leftPanelContent}
        middlePanelContent={middlePanelContent}
        rightPanelContent={rightPanelContent}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        className="h-full min-w-0 bg-background text-gray-100"
      >
        <></>
      </ThreePanelLayout>

      {/* Add the modal at the end of the component */}
      <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
        <GettingStartedGuide />
      </Modal>
    </div>
  );
}