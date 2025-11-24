"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { setDomainData, setOntologyData, Model } from '@/features/model-universe/modelSlice';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

import OntologyBuilder from '@/components/ontology-builder/OntologyBuilder';
// import ChatComponent from '@/components/ontology-builder/ChatComponent_old';
import ChatComponent from '@/components/ontology-builder/ChatComponent';
// import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { OntologyCard } from '@/components/ontology-card';
import { OntologyGraph } from '@/components/ontology-graph';
import { LoadingCircularProgress } from "@/components/loading";
import Guide from '@/components/ontology-builder/Guide';
import GettingStartedGuide from '@/components/ontology-builder/GettingStartedGuide';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from '@/components/FileOperations';
import { setMessages } from '@/features/chat/chatSlice';
import ModalThreePanelLayout from '@/components/ModalThreePanelLayout';
import OntologyEditorModal from "@/components/OntologyEditorModal";
import { saveMarkdownDocument } from '@/features/model-universe/modelSlice';
import { OntologyBuilderHeader } from '@/components/ontology-builder/OntologyBuilderHeader';

export interface ChatComponentProps {
  input: string;
  setInput: (input: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onResponseChange: (response: string) => void;
  onViewInMarkdown: (content: string) => void;
  setShowLeftPanel: (show: boolean) => void;
  showLeftPanel?: boolean; // ADDED: include current panel visibility prop
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
  description?: string;
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
  const router = useRouter();

  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
  const metis = data?.phData?.metis;

  const documents = data.phData.documents;
  const focusProject = useSelector((state: RootState) => state.modelUniverse.phFocus.focusProj);
  const domainData = data.phData.domain;

  // Project document state (Redux-backed)
  const [projectDocId, setProjectDocId] = useState<string | null>(null);
  const [projectContent, setProjectContent] = useState('');
  useEffect(() => {
    if (focusProject) {
      if (focusProject.id) {
        const matchingDoc = documents?.find((doc: any) => doc.id === focusProject.id);
        if (matchingDoc) {
          setProjectDocId(matchingDoc.id);
          setProjectContent(matchingDoc.content || '');
          return;
        }
      }

      if (focusProject.description) {
        setProjectDocId(null);
        setProjectContent(focusProject.description);
        return;
      }
    }

    let doc = documents?.find((d: any) => d.type === 'project-plan');
    if (!doc) {
      const newDoc = {
        id: Date.now().toString(),
        name: 'Project Plan',
        type: 'project-plan',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dispatch(saveMarkdownDocument(newDoc));
      setProjectDocId(newDoc.id);
      setProjectContent('');
    } else {
      setProjectDocId(doc.id);
      setProjectContent(doc.content);
    }
  }, [documents, dispatch, focusProject]);

  const [ontology, setOntology] = useState<Ontology | null>(data.phData.domain?.ontology);

  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);



  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!');
  // const [selectedModel, setSelectedModel] = useState<string>('gpt-5-mini');

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAIAssistantActive, setIsAIAssistantActive] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [conceptName, setConceptName] = useState(data?.phData?.concept?.name || "");
  const [conceptDescription, setConceptDescription] = useState(data?.phData?.concept?.description || "");
  const [conceptPresentation, setConceptPresentationState] = useState(data?.phData?.concept?.presentation || "");
  const [suggestedOntologyData, setSuggestedOntologyData] = useState<Ontology | null>(null);
  const [suggestedDomainData, setSuggestedDomainData] = useState<Domain | null>(null);

  const [activeTab, setActiveTab] = useState("ontology-builder");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>(domainData?.presentation || '');
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [existingConcepts, setExistingConcepts] = useState<any[]>([]);
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);
  const [suggestedConceptData, setSuggestedConceptData] = useState<any>(null);

  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftSetFileInputRef = useRef<HTMLInputElement>(null);
  const rightSetFileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState('');
  // Graph selections (left = current ontology, right = suggested ontology)
  const [leftSelectedConcept, setLeftSelectedConcept] = useState<string | null>(null);
  const [leftSelectedRel, setLeftSelectedRel] = useState<{ name: string; nameFrom: string; nameTo: string } | null>(null);
  const [rightSelectedConcept, setRightSelectedConcept] = useState<string | null>(null);
  const [rightSelectedRel, setRightSelectedRel] = useState<{ name: string; nameFrom: string; nameTo: string } | null>(null);
  const [rightGraphFilter, setRightGraphFilter] = useState<'all' | 'newOnly' | 'changedOnly'>('all');
  // Multi-select and filtering state
  const [leftMultiSelect, setLeftMultiSelect] = useState<boolean>(false);
  const [rightMultiSelect, setRightMultiSelect] = useState<boolean>(false);
  const [leftFilterToSelection, setLeftFilterToSelection] = useState<boolean>(false);
  const [rightFilterToSelection, setRightFilterToSelection] = useState<boolean>(false);
  const [leftSelectedConcepts, setLeftSelectedConcepts] = useState<string[]>([]);
  const [leftSelectedRels, setLeftSelectedRels] = useState<{ name: string; nameFrom: string; nameTo: string }[]>([]);
  const [rightSelectedConcepts, setRightSelectedConcepts] = useState<string[]>([]);
  const [rightSelectedRels, setRightSelectedRels] = useState<{ name: string; nameFrom: string; nameTo: string }[]>([]);
  const [leftGraphOpen, setLeftGraphOpen] = useState(false);
  const [rightGraphOpen, setRightGraphOpen] = useState(false);
  const [leftFitTrigger, setLeftFitTrigger] = useState(0);
  const [rightFitTrigger, setRightFitTrigger] = useState(0);

  // Trigger a fit when opening modals
  useEffect(() => { if (leftGraphOpen) setLeftFitTrigger(v => v + 1); }, [leftGraphOpen]);
  useEffect(() => { if (rightGraphOpen) setRightFitTrigger(v => v + 1); }, [rightGraphOpen]);
  const { rightVisibleConcepts, rightVisibleRelKeys } = React.useMemo(() => {
    const n = (s: string) => (s || '').trim().toLowerCase();
    const visibleConcepts = new Set<string>();
    const visibleRelKeys = new Set<string>();
    const baseConcepts = new Set<string>((ontology?.concepts || []).map(c => n(c?.name || '')));
    const baseRelKeys = new Set<string>((ontology?.relationships || []).map(r => `${n(r?.name || '')}|${n(r?.nameFrom || '')}|${n(r?.nameTo || '')}`));
    const sugConcepts = (suggestedOntologyData?.concepts || []);
    const sugRels = (suggestedOntologyData?.relationships || []);
    if (rightGraphFilter === 'all') {
      sugConcepts.forEach(c => { if (c?.name) visibleConcepts.add(n(c.name)); });
      sugRels.forEach(r => {
        const key = `${n(r?.name || '')}|${n(r?.nameFrom || '')}|${n(r?.nameTo || '')}`;
        visibleRelKeys.add(key);
        if (r?.nameFrom) visibleConcepts.add(n(r.nameFrom));
        if (r?.nameTo) visibleConcepts.add(n(r.nameTo));
      });
    } else if (rightGraphFilter === 'newOnly') {
      const newConcepts = new Set<string>();
      sugConcepts.forEach(c => { const cn = n(c?.name || ''); if (cn && !baseConcepts.has(cn)) newConcepts.add(cn); });
      sugRels.forEach(r => {
        const key = `${n(r?.name || '')}|${n(r?.nameFrom || '')}|${n(r?.nameTo || '')}`;
        if (!baseRelKeys.has(key)) {
          visibleRelKeys.add(key);
          if (r?.nameFrom) visibleConcepts.add(n(r.nameFrom));
          if (r?.nameTo) visibleConcepts.add(n(r.nameTo));
        }
      });
      newConcepts.forEach(cn => visibleConcepts.add(cn));
    } else if (rightGraphFilter === 'changedOnly') {
      const baseConceptDesc = new Map<string, string>((ontology?.concepts || []).map(c => [n(c?.name || ''), (c?.description || '').trim()]));
      const baseRelDesc = new Map<string, string>((ontology?.relationships || []).map(r => [`${n(r?.name || '')}|${n(r?.nameFrom || '')}|${n(r?.nameTo || '')}`, (r?.description || '').trim()]));
      sugConcepts.forEach(c => {
        const cn = n(c?.name || '');
        const baseD = baseConceptDesc.get(cn) ?? '';
        const curD = (c?.description || '').trim();
        if (cn && baseConcepts.has(cn) && baseD !== curD) visibleConcepts.add(cn);
      });
      sugRels.forEach(r => {
        const key = `${n(r?.name || '')}|${n(r?.nameFrom || '')}|${n(r?.nameTo || '')}`;
        if (baseRelKeys.has(key)) {
          const baseD = baseRelDesc.get(key) ?? '';
          const curD = (r?.description || '').trim();
          if (baseD !== curD) {
            visibleRelKeys.add(key);
            if (r?.nameFrom) visibleConcepts.add(n(r.nameFrom));
            if (r?.nameTo) visibleConcepts.add(n(r.nameTo));
          }
        }
      });
    }
    return { rightVisibleConcepts: visibleConcepts, rightVisibleRelKeys: visibleRelKeys };
  }, [rightGraphFilter, suggestedOntologyData, ontology]);
  const { rightHiddenConceptsCount, rightHiddenRelsCount } = React.useMemo(() => {
    const n = (s: string) => (s || '').trim().toLowerCase();
    const hiddenC = rightSelectedConcepts.filter(c => !rightVisibleConcepts.has(n(c))).length;
    const hiddenR = rightSelectedRels.filter(r => !rightVisibleRelKeys.has(`${n(r?.name || '')}|${n(r?.nameFrom || '')}|${n(r?.nameTo || '')}`)).length;
    return { rightHiddenConceptsCount: hiddenC, rightHiddenRelsCount: hiddenR };
  }, [rightSelectedConcepts, rightSelectedRels, rightVisibleConcepts, rightVisibleRelKeys]);
  // Saved selection sets (persisted in localStorage)
  const [leftSavedSets, setLeftSavedSets] = useState<any[]>([]);
  const [rightSavedSets, setRightSavedSets] = useState<any[]>([]);
  const [leftLoadKey, setLeftLoadKey] = useState<string>('');
  const [rightLoadKey, setRightLoadKey] = useState<string>('');

  useEffect(() => {
    try {
      const ls = JSON.parse(localStorage.getItem('ontology_left_sets') || '[]');
      setLeftSavedSets(Array.isArray(ls) ? ls : []);
    } catch { setLeftSavedSets([]); }
    try {
      const rs = JSON.parse(localStorage.getItem('ontology_right_sets') || '[]');
      setRightSavedSets(Array.isArray(rs) ? rs : []);
    } catch { setRightSavedSets([]); }
  }, []);

  // Sample data for ontology - replace with actual data
  const printPromptsDiv = <div>Sample prompt content</div>;

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModelName = event.target.value;
    if (metis && metis.models) {
      const selectedModell = metis.models.find((model: { name: string }) => model.name === selectedModelName) || null;
      setCurrentModel(selectedModell);
    }
  };

  const handleAddMD = () => {
    mdFileInputRef.current?.click()
  }
  useEffect(() => {
    console.log('128 OntologyBuilderPage mounted, data:', data);
    if (data.phData.domain?.ontology) {
      setOntology(data.phData.domain.ontology);
    }
  }, []);

  useEffect(() => {
    if (data.phData.domain?.ontology) {
      setOntology(data.phData.domain.ontology);
    }
  }, [data.phData.domain?.ontology]);

  useEffect(() => {
    if (data.phData.domain) {
      setDomainData(data.phData.domain);
      setMdContent(data.phData.domain.presentation || '');
    }
  }, [data.phData.domain]);

  const handleClearChat = () => {
    dispatch(setMessages([]));
    setCurrentMessages([]);
    setInput('');
  };

  const handleSaveToLibraryAndClearChat = (content: string) => {
    dispatch(setMessages([]));
    setCurrentMessages([]);
    setInput('');
    setMdPreview('Nothing to preview yet!');
    console.log('Chat and preview cleared after saving to library:', content.substring(0, 50) + '...');
  };

  const handleResponseChange = (response: string) => {
    // Handle response change
  };

  const handleViewInMarkdown = (response: string) => {
    const cleanResponse = (response: string) => {
      const cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
      const cleaned2 = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
      return cleaned2;
    };
    const cleanedResponse = cleanResponse(response);
    setMdPreview(cleanedResponse);
    setShowRightPanel(true);
  };

  const handleSaveToLibrary: () => void = () => {
    if (!suggestedOntologyData) {
      alert('No ontology suggestions to apply');
      return;
    }

    const existing = (data?.phData?.domain?.ontology ?? { name: '', description: '', presentation: '', concepts: [], relationships: [] }) as Ontology;

    // Normalization helpers
    const norm = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

    // 1) Concepts: case-insensitive, trimmed name uniqueness
    const conceptMap = new Map<string, Concept>();
    (existing.concepts || []).forEach(c => {
      conceptMap.set(norm(c.name), { name: c.name.trim(), description: (c.description || '').trim() });
    });
    (suggestedOntologyData.concepts || []).forEach(c => {
      const key = norm(c.name);
      if (!conceptMap.has(key)) {
        conceptMap.set(key, { name: c.name.trim(), description: (c.description || '').trim() });
      }
    });

    const mergedConcepts = Array.from(conceptMap.values());

    // 2) Relationships: uniqueness on triple (name, from, to) case-insensitive + trimmed
    const relKey = (r: Relationship) => `${norm(r.name)}|${norm(r.nameFrom)}|${norm(r.nameTo)}`;
    const relMap = new Map<string, Relationship>();
    (existing.relationships || []).forEach(r => {
      relMap.set(relKey(r), {
        name: r.name.trim(),
        nameFrom: r.nameFrom.trim(),
        nameTo: r.nameTo.trim(),
        description: (r.description || '').trim(),
      });
    });
    (suggestedOntologyData.relationships || []).forEach(r => {
      const key = relKey(r);
      if (!relMap.has(key)) {
        relMap.set(key, {
          name: r.name.trim(),
          nameFrom: r.nameFrom.trim(),
          nameTo: r.nameTo.trim(),
          description: (r.description || '').trim(),
        });
      }
    });

    const mergedRelationships = Array.from(relMap.values());

    const newOntology: Ontology = {
      name: suggestedOntologyData.name?.trim() || existing.name || 'Generated Ontology',
      description: suggestedOntologyData.description?.trim() || existing.description || '',
      presentation: existing.presentation || '',
      concepts: mergedConcepts,
      relationships: mergedRelationships,
    };

    // Replace the domain's ontology with the deduped/merged one to avoid duplicate appends
    dispatch(setDomainData({
      ...data.phData.domain,
      ontology: newOntology,
    } as any));
  };

  const modelSelector = (false) ? (
    <div className="flex justify-between bg-gray-800 text-xs">
      <div className="px-1">
        <span className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</span>
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

  // Left panel: direct tabs for Domain Description and Project Plan
  const [leftPanelDefaultTab, setLeftPanelDefaultTab] = useState<'domain' | 'project'>('domain');

  const handleViewMode = useCallback(() => {
    setIsEditMode(false);
    setIsAIAssistantActive(false);
    setLeftPanelDefaultTab('domain');
  }, [setLeftPanelDefaultTab]);

  const handleToggleEdit = useCallback(() => {
    setIsAIAssistantActive(false);
    setIsEditMode((prev) => {
      const next = !prev;
      if (next) {
        setShowLeftPanel(true);
        setLeftPanelDefaultTab('project');
      } else {
        setLeftPanelDefaultTab('domain');
      }
      return next;
    });
  }, [setLeftPanelDefaultTab, setShowLeftPanel]);

  const handleOpenAIAssistant = useCallback(() => {
    setIsEditMode(false);
    setIsAIAssistantActive(true);
    setLeftPanelDefaultTab('domain');
    setShowLeftPanel(true);
    router.push('/ai-chat?mode=chat&sub=advanced');
  }, [router, setLeftPanelDefaultTab, setShowLeftPanel]);
  const leftPanelContent = {
    tabs: [
      {
        key: 'domain',
        label: 'Domain Description',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
            <DocumentPanel
              mdContent={mdContent}
              setMdContent={(c: string) => setMdContent(c)}
              documentId={domainData?.id || undefined}
              panelType='left'
              setIsLibraryOpen={setIsLibraryOpen}
              isLibraryOpen={isLibraryOpen}
              onSaveToLibrary={(content: string) => {
                if (!domainData) {
                  alert('No domain data to save to');
                  return;
                }
                dispatch(setDomainData({
                  ...domainData,
                  presentation: content,
                } as any));
                setMdContent(content);
                setStatusMsg('Domain description saved');
                setTimeout(() => setStatusMsg(''), 3000);
              }}
            />
          </div>
        )
      },
      {
        key: 'project',
        label: 'Project Plan',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
            <DocumentPanel
              mdContent={projectContent}
              setMdContent={(c: string) => setProjectContent(c)}
              documentId={projectDocId || undefined}
              panelType='left'
              setIsLibraryOpen={setIsLibraryOpen}
              isLibraryOpen={isLibraryOpen}
              showDocumentList
              onSelect={(content, _name, doc) => {
                setProjectContent(content);
                if (doc?.id) {
                  setProjectDocId(doc.id);
                }
              }}
              onSaveToLibrary={(content: string) => {
                const id = projectDocId || Date.now().toString();
                dispatch(saveMarkdownDocument({
                  id,
                  name: 'Project Plan',
                  type: 'project-plan',
                  content,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }));
                setProjectDocId(id);
                setProjectContent(content);
                setStatusMsg('Project plan saved');
                setTimeout(() => setStatusMsg(''), 3000);
              }}
            />
          </div>
        )
      },

    ],
    defaultTab: leftPanelDefaultTab
  };

  // Middle panel: only "Current Ontology" tab
  const middlePanelContent = {
    tabs: [
      {
        key: 'ontology',
        label: 'Ontology',
        content: (
          <div className="flex flex-col h-full">
            <div className="px-2 py-1 text-blue-400 font-semibold">Ontology Preview</div>
            <div className="flex-1 overflow-auto">
              <OntologyCard 
                domainData={domainData} 
                ontologyData={ontology ? {
                  ...ontology,
                  relationships: (ontology.relationships || []).map(r => ({
                    ...r,
                    description: r.description ?? ''
                  }))
                } : null}
              />
            </div>
          </div>
        )
      },
    ],
    defaultTab: 'ontology'
  };


  // Right panel: ontology preview (wrapped in tabs array for PanelGroup)
  const rightPanelContent = {
    tabs: [
      {
        key: 'ontology',
        label: 'Ontology',
        content: (
          <div className="flex flex-col h-full">
            <div className="px-2 py-1 text-blue-400 font-semibold">Ontology Preview</div>
            <div className="flex-1 overflow-auto">
              {/* <OntologyCard domainData={domainData} ontologyData={ontology} /> */}
            </div>
          </div>
        )
      },
    ],
    defaultTab: 'ontology',
  };

  // ensure layout uses actual state/setters
  return (
    <div className="flex-1 flex-row h-screen">
      <div className="w-full border-b-2 border-gray-600">
        <FileOperations />
      </div>
      <ThreePanelLayout
        leftPanelContent={leftPanelContent}
        middlePanelContent={middlePanelContent}
        rightPanelContent={rightPanelContent}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        className="h-full min-w-0 bg-background text-gray-100"
        middlePanelHeader={(
          <OntologyBuilderHeader
            onViewMode={handleViewMode}
            onToggleEdit={handleToggleEdit}
            onOpenAIAssistant={handleOpenAIAssistant}
            showLeftPanel={showLeftPanel}
            showRightPanel={showRightPanel}
            isEditActive={isEditMode}
            isAIAssistantActive={isAIAssistantActive}
          />
        )}
      >
        <></>
      </ThreePanelLayout>
    </div>
  );
}
