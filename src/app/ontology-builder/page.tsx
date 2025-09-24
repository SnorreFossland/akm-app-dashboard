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

  const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
  const metis = data?.phData?.metis
  const documents = data.phData.documents;
  const domainData = data.phData.domain;

  const [ontology, setOntology] = useState<Ontology | null>(data.phData.domain?.ontology);

  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);



  const [input, setInput] = useState<string>("");
  const [chatInput, setChatInput] = useState('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-5-mini');

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
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
              {/* <div className="flex justify-end pb-1 pt-0 mx-2">
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
              </div> */}
              <div className="mx-1 bg-gray-700">
                <OntologyCard
                  domainData={domainData}
                  ontologyData={ontology}
                  highlightConceptName={leftSelectedConcept}
                  highlightRelationship={leftSelectedRel as any}
                  selectedConceptNames={leftSelectedConcepts}
                  selectedRelationships={leftSelectedRels as any}
                  filterToSelection={leftFilterToSelection}
                  onSelectConcept={(name) => { setLeftSelectedRel(null); setLeftSelectedConcept(name); }}
                  onSelectRelationship={(rel) => { setLeftSelectedConcept(null); setLeftSelectedRel(rel as any); }}
                />
                {ontology && (
                  <>
                    <div className="mt-2 sticky top-0 z-20 bg-background/90 backdrop-blur flex items-center justify-between px-2 py-1 border border-gray-700 rounded">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Select:</span>
                        <button
                          className={`px-2 py-0.5 rounded border ${!leftMultiSelect ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700'}`}
                          onClick={() => setLeftMultiSelect(false)}
                        >
                          Single
                        </button>
                        <button
                          className={`px-2 py-0.5 rounded border ${leftMultiSelect ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700'}`}
                          onClick={() => setLeftMultiSelect(true)}
                        >
                          Multi
                        </button>
                        <div className="ml-2 flex items-center gap-1">
                          <label className="text-gray-400">Filter to selection</label>
                          <input type="checkbox" checked={leftFilterToSelection} onChange={(e) => setLeftFilterToSelection(e.target.checked)} />
                          <button className="ml-1 px-2 py-0.5 rounded border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700" onClick={() => { setLeftSelectedConcepts([]); setLeftSelectedRels([]); setLeftSelectedConcept(null); setLeftSelectedRel(null); }}>Clear</button>
                        </div>
                      </div>
                      <div>
                        <button
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 border border-blue-500"
                          onClick={() => setLeftGraphOpen(true)}
                        >
                          Open Graph
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 bg-background rounded hidden">
                      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur px-2 py-1">
                        <h4 className="text-sm font-semibold text-gray-300">Graph</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Select:</span>
                          <button
                            className={`px-2 py-0.5 rounded ${!leftMultiSelect ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setLeftMultiSelect(false)}
                          >
                            Single
                          </button>
                          <button
                            className={`px-2 py-0.5 rounded ${leftMultiSelect ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setLeftMultiSelect(true)}
                          >
                            Multi
                          </button>
                          <div className="ml-2 flex items-center gap-1">
                            <label className="text-gray-400">Filter to selection</label>
                            <input type="checkbox" checked={leftFilterToSelection} onChange={(e) => setLeftFilterToSelection(e.target.checked)} />
                            <button className="ml-1 px-2 py-0.5 rounded bg-gray-700 text-gray-200" onClick={() => { setLeftSelectedConcepts([]); setLeftSelectedRels([]); setLeftSelectedConcept(null); setLeftSelectedRel(null); }}>Clear</button>
                          </div>
                          <div className="ml-3 flex items-center gap-1">
                            <button
                              className="px-2 py-0.5 rounded bg-green-700 text-white"
                              title="Save current selection set"
                              onClick={() => {
                                const name = prompt('Save selection set as:');
                                if (!name) return;
                                const set = { name, concepts: leftSelectedConcepts, rels: leftSelectedRels };
                                try {
                                  const arr = JSON.parse(localStorage.getItem('ontology_left_sets') || '[]');
                                  arr.push(set);
                                  localStorage.setItem('ontology_left_sets', JSON.stringify(arr));
                                  setLeftSavedSets(arr);
                                } catch { localStorage.setItem('ontology_left_sets', JSON.stringify([set])); setLeftSavedSets([set]); }
                              }}
                            >Save Set</button>
                            <select className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded"
                              onChange={(e) => setLeftLoadKey(e.target.value)} value={leftLoadKey}
                            >
                              <option value="">Load…</option>
                              {leftSavedSets.map((s: any, i: number) => (
                                <option key={`${s.name}-${i}`} value={`${i}`}>{s.name}</option>
                              ))}
                            </select>
                            <button
                              className="px-2 py-0.5 rounded bg-blue-700 text-white disabled:opacity-50"
                              disabled={!leftLoadKey}
                              onClick={() => {
                                const idx = parseInt(leftLoadKey || '-1', 10);
                                if (isNaN(idx) || idx < 0) return;
                                const s = leftSavedSets[idx];
                                if (!s) return;
                                setLeftMultiSelect(true);
                                setLeftSelectedConcepts(s.concepts || []);
                                setLeftSelectedRels(s.rels || []);
                              }}
                            >Apply</button>
                            <button
                              className="px-2 py-0.5 rounded bg-red-700 text-white disabled:opacity-50"
                              disabled={!leftLoadKey}
                              onClick={() => {
                                const idx = parseInt(leftLoadKey || '-1', 10);
                                if (isNaN(idx) || idx < 0) return;
                                const arr = [...leftSavedSets];
                                arr.splice(idx, 1);
                                localStorage.setItem('ontology_left_sets', JSON.stringify(arr));
                                setLeftSavedSets(arr);
                                setLeftLoadKey('');
                              }}
                            >Delete</button>
                            <button
                              className="px-2 py-0.5 rounded bg-gray-700 text-gray-200"
                              title="Export sets (JSON)"
                              onClick={() => {
                                try {
                                  const arr = JSON.parse(localStorage.getItem('ontology_left_sets') || '[]');
                                  const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = 'ontology-left-sets.json';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch { }
                              }}
                            >Export</button>
                            <button
                              className="px-2 py-0.5 rounded bg-gray-700 text-gray-200"
                              title="Import sets (JSON)"
                              onClick={() => leftSetFileInputRef.current?.click()}
                            >Import</button>
                            <input
                              type="file"
                              accept="application/json"
                              ref={leftSetFileInputRef}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target?.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  try {
                                    const parsed = JSON.parse(String(reader.result || '[]'));
                                    const arr = Array.isArray(parsed) ? parsed : [];
                                    localStorage.setItem('ontology_left_sets', JSON.stringify(arr));
                                    setLeftSavedSets(arr);
                                  } catch { }
                                };
                                reader.readAsText(file);
                                // reset input
                                (e.target as HTMLInputElement).value = '';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-2 overflow-auto max-h-[calc(100vh-16rem)]">
                        <OntologyGraph
                          ontology={ontology as any}
                          baseline={ontology as any}
                          selectedConcept={leftSelectedConcept}
                          selectedRelationship={leftSelectedRel as any}
                          selectedConcepts={leftSelectedConcepts}
                          selectedRelationships={leftSelectedRels as any}
                          enableZoomPan={true}
                          enableLasso={leftMultiSelect}
                          autoFitOnResize={true}
                          onSelectConcept={(name) => {
                            setLeftSelectedRel(null);
                            setLeftSelectedConcept(name);
                            setLeftSelectedConcepts(prev => {
                              if (leftMultiSelect) {
                                const exists = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                return exists ? prev.filter(n => (n || '').trim().toLowerCase() !== (name || '').trim().toLowerCase()) : [...prev, name];
                              }
                              return [name];
                            });
                            const existsInRight = (suggestedOntologyData?.concepts || []).some(c => (c?.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                            if (existsInRight) {
                              setRightSelectedConcept(name);
                              setRightSelectedConcepts(prev => {
                                if (rightMultiSelect) {
                                  const present = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                  return present ? prev : [...prev, name];
                                }
                                return [name];
                              });
                            }
                          }}
                          onSelectRelationship={(rel) => {
                            setLeftSelectedConcept(null);
                            setLeftSelectedRel(rel);
                            setLeftSelectedRels(prev => {
                              const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                              if (leftMultiSelect) {
                                const exists = prev.some(r => key(r) === key(rel));
                                return exists ? prev.filter(r => key(r) !== key(rel)) : [...prev, rel];
                              }
                              return [rel];
                            });
                            const existsInRight = (suggestedOntologyData?.relationships || []).some(r =>
                              (r?.name || '').trim().toLowerCase() === (rel?.name || '').trim().toLowerCase() &&
                              (r?.nameFrom || '').trim().toLowerCase() === (rel?.nameFrom || '').trim().toLowerCase() &&
                              (r?.nameTo || '').trim().toLowerCase() === (rel?.nameTo || '').trim().toLowerCase()
                            );
                            if (existsInRight) {
                              setRightSelectedRel(rel);
                              setRightSelectedRels(prev => {
                                const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                                if (rightMultiSelect) {
                                  const exists = prev.some(r => key(r) === key(rel));
                                  return exists ? prev : [...prev, rel];
                                }
                                return [rel];
                              });
                            }
                          }}
                        />
                        {(leftSelectedConcept || leftSelectedRel) && (
                          <div className="mt-2 text-xs text-gray-200 bg-gray-900/60 rounded p-2">
                            {leftSelectedConcept && (
                              <div>
                                <div className="font-semibold">Concept</div>
                                <div className="text-gray-300">{leftSelectedConcept}</div>
                                <div className="text-gray-400">
                                  {(ontology?.concepts || []).find(c => (c?.name || '').trim().toLowerCase() === (leftSelectedConcept || '').trim().toLowerCase())?.description || '—'}
                                </div>
                              </div>
                            )}
                            {leftSelectedRel && (
                              <div>
                                <div className="font-semibold">Relationship</div>
                                <div className="text-gray-300">{leftSelectedRel.nameFrom} — {leftSelectedRel.name} → {leftSelectedRel.nameTo}</div>
                                <div className="text-gray-400">
                                  {(ontology?.relationships || []).find(r =>
                                    (r?.name || '').trim().toLowerCase() === (leftSelectedRel?.name || '').trim().toLowerCase() &&
                                    (r?.nameFrom || '').trim().toLowerCase() === (leftSelectedRel?.nameFrom || '').trim().toLowerCase() &&
                                    (r?.nameTo || '').trim().toLowerCase() === (leftSelectedRel?.nameTo || '').trim().toLowerCase()
                                  )?.description || '—'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Dialog open={leftGraphOpen} onOpenChange={setLeftGraphOpen}>
                      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh]">
                        <DialogHeader>
                          <DialogTitle>Current Ontology — Graph</DialogTitle>
                          <DialogDescription>Use the controls under the card to change selection and filters.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col h-[72vh]">
                          {/* Controls are shown under the card; modal includes only graph + details */}
                          <div className="flex-1 min-h-0 overflow-auto p-2">
                            <OntologyGraph
                              ontology={ontology as any}
                              baseline={ontology as any}
                              selectedConcept={leftSelectedConcept}
                              selectedRelationship={leftSelectedRel as any}
                              selectedConcepts={leftSelectedConcepts}
                              selectedRelationships={leftSelectedRels as any}
                              enableZoomPan={true}
                              enableLasso={leftMultiSelect}
                              autoFitOnResize={true}
                              fitTrigger={leftFitTrigger}
                              onSelectConcept={(name) => {
                                setLeftSelectedRel(null);
                                setLeftSelectedConcept(name);
                                setLeftSelectedConcepts(prev => {
                                  if (leftMultiSelect) {
                                    const exists = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                    return exists ? prev.filter(n => (n || '').trim().toLowerCase() !== (name || '').trim().toLowerCase()) : [...prev, name];
                                  }
                                  return [name];
                                });
                                const existsInRight = (suggestedOntologyData?.concepts || []).some(c => (c?.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                if (existsInRight) {
                                  setRightSelectedConcept(name);
                                  setRightSelectedConcepts(prev => {
                                    if (rightMultiSelect) {
                                      const present = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                      return present ? prev : [...prev, name];
                                    }
                                    return [name];
                                  });
                                }
                              }}
                              onSelectRelationship={(rel) => {
                                setLeftSelectedConcept(null);
                                setLeftSelectedRel(rel);
                                setLeftSelectedRels(prev => {
                                  const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                                  if (leftMultiSelect) {
                                    const exists = prev.some(r => key(r) === key(rel));
                                    return exists ? prev.filter(r => key(r) !== key(rel)) : [...prev, rel];
                                  }
                                  return [rel];
                                });
                                const existsInRight = (suggestedOntologyData?.relationships || []).some(r =>
                                  (r?.name || '').trim().toLowerCase() === (rel?.name || '').trim().toLowerCase() &&
                                  (r?.nameFrom || '').trim().toLowerCase() === (rel?.nameFrom || '').trim().toLowerCase() &&
                                  (r?.nameTo || '').trim().toLowerCase() === (rel?.nameTo || '').trim().toLowerCase()
                                );
                                if (existsInRight) {
                                  setRightSelectedRel(rel);
                                  setRightSelectedRels(prev => {
                                    const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                                    if (rightMultiSelect) {
                                      const exists = prev.some(r => key(r) === key(rel));
                                      return exists ? prev : [...prev, rel];
                                    }
                                    return [rel];
                                  });
                                }
                              }}
                            />
                            {(leftSelectedConcept || leftSelectedRel) && (
                              <div className="mt-2 text-xs text-gray-200 bg-gray-900/60 rounded p-2">
                                {leftSelectedConcept && (
                                  <div>
                                    <div className="font-semibold">Concept</div>
                                    <div className="text-gray-300">{leftSelectedConcept}</div>
                                    <div className="text-gray-400">
                                      {(ontology?.concepts || []).find(c => (c?.name || '').trim().toLowerCase() === (leftSelectedConcept || '').trim().toLowerCase())?.description || '—'}
                                    </div>
                                  </div>
                                )}
                                {leftSelectedRel && (
                                  <div>
                                    <div className="font-semibold">Relationship</div>
                                    <div className="text-gray-300">{leftSelectedRel.nameFrom} — {leftSelectedRel.name} → {leftSelectedRel.nameTo}</div>
                                    <div className="text-gray-400">
                                      {(ontology?.relationships || []).find(r =>
                                        (r?.name || '').trim().toLowerCase() === (leftSelectedRel?.name || '').trim().toLowerCase() &&
                                        (r?.nameFrom || '').trim().toLowerCase() === (leftSelectedRel?.nameFrom || '').trim().toLowerCase() &&
                                        (r?.nameTo || '').trim().toLowerCase() === (leftSelectedRel?.nameTo || '').trim().toLowerCase()
                                      )?.description || '—'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setLeftGraphOpen(false)} className="bg-gray-700 text-gray-100">Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
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
    defaultTab: 'current-domain'
  };

  const middlePanelContent = {
    tabs: [
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
                {/* <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                </Dialog> */}
              </div>
              <div className="mx-1 bg-gray-700">
                <OntologyCard domainData={domainData} ontologyData={ontology} />
              </div>
            </Card>
          </div>
        )
      },
      {
        key: 'ontology-builder',
        label: 'AIOB_old',
        // label: 'AI Ontology Builder old',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded p-1">
            <div className="flex overflow-hidden">
              <OntologyBuilder
                suggestedOntologyData={suggestedOntologyData}
                setSuggestedOntologyData={setSuggestedOntologyData}
                gettingStartedGuide={<GettingStartedGuide />}
                guide={<Guide />}
              />
            </div>
          </div>
        )
      },
      {
        key: 'chat',
        label: 'AIOC tmp',
        // label: 'AI Ontology chat tm',
        content: (
          <div className="flex-1 overflow-hidden bg-gray-800/20 rounded">
            <ChatComponent
              input={input}
              setInput={setInput}
              selectedModel={selectedModel as any}
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
              guide={<Guide />}
            />
          </div>
        )
      }
    ],
    defaultTab: 'ontology'
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
              <CardTitle className="text-sm font-bold">
                <div className="flex items-center justify-between w-full gap-2 px-2">
                  <span className="min-w-0 truncate">{ontology?.name || 'Suggested Ontology'}</span>
                  <button
                    title="Save to Library"
                    onClick={handleSaveToLibrary}
                    className={`text-xs ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save to Library
                  </button>
                </div>
              </CardTitle>
              <div className="mx-1 bg-gray-700">
                <OntologyCard
                  domainData={domainData}
                  ontologyData={suggestedOntologyData}
                  highlightConceptName={rightSelectedConcept}
                  highlightRelationship={rightSelectedRel as any}
                  selectedConceptNames={rightSelectedConcepts}
                  selectedRelationships={rightSelectedRels as any}
                  filterToSelection={rightFilterToSelection}
                  onSelectConcept={(name) => { setRightSelectedRel(null); setRightSelectedConcept(name); }}
                  onSelectRelationship={(rel) => { setRightSelectedConcept(null); setRightSelectedRel(rel as any); }}
                />
                {suggestedOntologyData && (
                  <>
                    <div className="mt-2 sticky top-0 z-20 bg-background/90 backdrop-blur flex items-center justify-between px-2 py-1 border border-gray-700 rounded">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Select:</span>
                        <button
                          className={`px-2 py-0.5 rounded border ${!rightMultiSelect ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700'}`}
                          onClick={() => setRightMultiSelect(false)}
                        >
                          Single
                        </button>
                        <button
                          className={`px-2 py-0.5 rounded border ${rightMultiSelect ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700'}`}
                          onClick={() => setRightMultiSelect(true)}
                        >
                          Multi
                        </button>
                        <div className="ml-2 flex items-center gap-1">
                          <label className="text-gray-400">Filter to selection</label>
                          <input type="checkbox" checked={rightFilterToSelection} onChange={(e) => setRightFilterToSelection(e.target.checked)} />
                          <button className="ml-1 px-2 py-0.5 rounded border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700" onClick={() => { setRightSelectedConcepts([]); setRightSelectedRels([]); setRightSelectedConcept(null); setRightSelectedRel(null); }}>Clear</button>
                          {(rightHiddenConceptsCount > 0 || rightHiddenRelsCount > 0) && (
                            <span className="ml-2 text-[11px] text-amber-300">
                              Hidden by filter: {rightHiddenConceptsCount} concept(s), {rightHiddenRelsCount} rel(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 border border-blue-500"
                          onClick={() => setRightGraphOpen(true)}
                        >
                          Open Graph
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 bg-background rounded hidden">
                      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur px-2 py-1">
                        <h4 className="text-sm font-semibold text-gray-300">Graph (highlight additions)</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Show:</span>
                          <button
                            className={`px-2 py-0.5 rounded ${rightGraphFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setRightGraphFilter('all')}
                          >
                            All
                          </button>
                          <button
                            className={`px-2 py-0.5 rounded ${rightGraphFilter === 'newOnly' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setRightGraphFilter('newOnly')}
                          >
                            New Only
                          </button>
                          <button
                            className={`px-2 py-0.5 rounded ${rightGraphFilter === 'changedOnly' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setRightGraphFilter('changedOnly' as any)}
                          >
                            Changed Only
                          </button>
                          <span className="mx-2 h-4 w-px bg-gray-600" />
                          <span className="text-gray-400">Select:</span>
                          <button
                            className={`px-2 py-0.5 rounded ${!rightMultiSelect ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setRightMultiSelect(false)}
                          >
                            Single
                          </button>
                          <button
                            className={`px-2 py-0.5 rounded ${rightMultiSelect ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                            onClick={() => setRightMultiSelect(true)}
                          >
                            Multi
                          </button>
                          <div className="ml-2 flex items-center gap-1">
                            <label className="text-gray-400">Filter to selection</label>
                            <input type="checkbox" checked={rightFilterToSelection} onChange={(e) => setRightFilterToSelection(e.target.checked)} />
                            <button className="ml-1 px-2 py-0.5 rounded bg-gray-700 text-gray-200" onClick={() => { setRightSelectedConcepts([]); setRightSelectedRels([]); setRightSelectedConcept(null); setRightSelectedRel(null); }}>Clear</button>
                          </div>
                          <div className="ml-3 flex items-center gap-1">
                            <button
                              className="px-2 py-0.5 rounded bg-gray-700 text-gray-200"
                              title="Export sets (JSON)"
                              onClick={() => {
                                try {
                                  const arr = JSON.parse(localStorage.getItem('ontology_right_sets') || '[]');
                                  const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = 'ontology-right-sets.json';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch { }
                              }}
                            >Export</button>
                            <button
                              className="px-2 py-0.5 rounded bg-gray-700 text-gray-200"
                              title="Import sets (JSON)"
                              onClick={() => rightSetFileInputRef.current?.click()}
                            >Import</button>
                            <input
                              type="file"
                              accept="application/json"
                              ref={rightSetFileInputRef}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = (e.target as HTMLInputElement)?.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  try {
                                    const parsed = JSON.parse(String(reader.result || '[]'));
                                    const arr = Array.isArray(parsed) ? parsed : [];
                                    localStorage.setItem('ontology_right_sets', JSON.stringify(arr));
                                    setRightSavedSets(arr);
                                  } catch { }
                                };
                                reader.readAsText(file);
                                (e.target as HTMLInputElement).value = '';
                              }}
                            />
                          </div>
                          <div className="ml-3 flex items-center gap-1">
                            <button
                              className="px-2 py-0.5 rounded bg-green-700 text-white"
                              title="Save current selection set"
                              onClick={() => {
                                const name = prompt('Save selection set as:');
                                if (!name) return;
                                const set = { name, concepts: rightSelectedConcepts, rels: rightSelectedRels };
                                try {
                                  const arr = JSON.parse(localStorage.getItem('ontology_right_sets') || '[]');
                                  arr.push(set);
                                  localStorage.setItem('ontology_right_sets', JSON.stringify(arr));
                                  setRightSavedSets(arr);
                                } catch {
                                  localStorage.setItem('ontology_right_sets', JSON.stringify([set]));
                                  setRightSavedSets([set]);
                                }
                              }}
                            >Save Set</button>
                            <select className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded" onChange={(e) => setRightLoadKey(e.target.value)} value={rightLoadKey}>
                              <option value="">Load…</option>
                              {rightSavedSets.map((s: any, i: number) => (
                                <option key={`${s.name}-${i}`} value={`${i}`}>{s.name}</option>
                              ))}
                            </select>
                            <button
                              className="px-2 py-0.5 rounded bg-blue-700 text-white disabled:opacity-50"
                              disabled={!rightLoadKey}
                              onClick={() => {
                                const idx = parseInt(rightLoadKey || '-1', 10);
                                if (isNaN(idx) || idx < 0) return;
                                const s = rightSavedSets[idx];
                                if (!s) return;
                                setRightMultiSelect(true);
                                setRightSelectedConcepts(s.concepts || []);
                                setRightSelectedRels(s.rels || []);
                              }}
                            >Apply</button>
                            <button
                              className="px-2 py-0.5 rounded bg-red-700 text-white disabled:opacity-50"
                              disabled={!rightLoadKey}
                              onClick={() => {
                                const idx = parseInt(rightLoadKey || '-1', 10);
                                if (isNaN(idx) || idx < 0) return;
                                const arr = [...rightSavedSets];
                                arr.splice(idx, 1);
                                localStorage.setItem('ontology_right_sets', JSON.stringify(arr));
                                setRightSavedSets(arr);
                                setRightLoadKey('');
                              }}
                            >Delete</button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 overflow-auto max-h-[calc(100vh-16rem)]">
                        <OntologyGraph
                          ontology={suggestedOntologyData as any}
                          baseline={ontology as any}
                          selectedConcept={rightSelectedConcept}
                          selectedRelationship={rightSelectedRel as any}
                          selectedConcepts={rightSelectedConcepts}
                          selectedRelationships={rightSelectedRels as any}
                          filterMode={rightGraphFilter}
                          enableZoomPan={true}
                          enableLasso={rightMultiSelect}
                          autoFitOnResize={true}
                          onSelectConcept={(name) => {
                            setRightSelectedRel(null);
                            setRightSelectedConcept(name);
                            setRightSelectedConcepts(prev => {
                              if (rightMultiSelect) {
                                const exists = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                return exists ? prev.filter(n => (n || '').trim().toLowerCase() !== (name || '').trim().toLowerCase()) : [...prev, name];
                              }
                              return [name];
                            });
                            const existsInLeft = (ontology?.concepts || []).some(c => (c?.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                            if (existsInLeft) {
                              setLeftSelectedConcept(name);
                              setLeftSelectedConcepts(prev => {
                                if (leftMultiSelect) {
                                  const present = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                  return present ? prev : [...prev, name];
                                }
                                return [name];
                              });
                            }
                          }}
                          onSelectRelationship={(rel) => {
                            setRightSelectedConcept(null);
                            setRightSelectedRel(rel);
                            setRightSelectedRels(prev => {
                              const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                              if (rightMultiSelect) {
                                const exists = prev.some(r => key(r) === key(rel));
                                return exists ? prev.filter(r => key(r) !== key(rel)) : [...prev, rel];
                              }
                              return [rel];
                            });
                            const existsInLeft = (ontology?.relationships || []).some(r =>
                              (r?.name || '').trim().toLowerCase() === (rel?.name || '').trim().toLowerCase() &&
                              (r?.nameFrom || '').trim().toLowerCase() === (rel?.nameFrom || '').trim().toLowerCase() &&
                              (r?.nameTo || '').trim().toLowerCase() === (rel?.nameTo || '').trim().toLowerCase()
                            );
                            if (existsInLeft) {
                              setLeftSelectedRel(rel);
                              setLeftSelectedRels(prev => {
                                const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                                if (leftMultiSelect) {
                                  const exists = prev.some(r => key(r) === key(rel));
                                  return exists ? prev : [...prev, rel];
                                }
                                return [rel];
                              });
                            }
                          }}
                        />
                        {(rightSelectedConcept || rightSelectedRel) && (
                          <div className="mt-2 text-xs text-gray-200 bg-gray-900/60 rounded p-2">
                            {rightSelectedConcept && (
                              <div>
                                <div className="font-semibold">Concept</div>
                                <div className="text-gray-300">{rightSelectedConcept}</div>
                                <div className="text-gray-400">
                                  {(suggestedOntologyData?.concepts || []).find(c => (c?.name || '').trim().toLowerCase() === (rightSelectedConcept || '').trim().toLowerCase())?.description || '—'}
                                </div>
                              </div>
                            )}
                            {rightSelectedRel && (
                              <div>
                                <div className="font-semibold">Relationship</div>
                                <div className="text-gray-300">{rightSelectedRel.nameFrom} — {rightSelectedRel.name} → {rightSelectedRel.nameTo}</div>
                                <div className="text-gray-400">
                                  {(suggestedOntologyData?.relationships || []).find(r =>
                                    (r?.name || '').trim().toLowerCase() === (rightSelectedRel?.name || '').trim().toLowerCase() &&
                                    (r?.nameFrom || '').trim().toLowerCase() === (rightSelectedRel?.nameFrom || '').trim().toLowerCase() &&
                                    (r?.nameTo || '').trim().toLowerCase() === (rightSelectedRel?.nameTo || '').trim().toLowerCase()
                                  )?.description || '—'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Dialog open={rightGraphOpen} onOpenChange={setRightGraphOpen}>
                      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh]">
                        <DialogHeader>
                          <DialogTitle>Suggested Ontology — Graph</DialogTitle>
                          <DialogDescription>Use the controls under the card to change selection and filters.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col h-[72vh]">
                          {/* Controls are shown under the card; modal includes only graph + details */}
                          <div className="flex-1 min-h-0 overflow-auto p-2">
                            <OntologyGraph
                              ontology={suggestedOntologyData as any}
                              baseline={ontology as any}
                              selectedConcept={rightSelectedConcept}
                              selectedRelationship={rightSelectedRel as any}
                              selectedConcepts={rightSelectedConcepts}
                              selectedRelationships={rightSelectedRels as any}
                              filterMode={rightGraphFilter}
                              enableZoomPan={true}
                              enableLasso={rightMultiSelect}
                              autoFitOnResize={true}
                              fitTrigger={rightFitTrigger}
                              onSelectConcept={(name) => {
                                setRightSelectedRel(null);
                                setRightSelectedConcept(name);
                                setRightSelectedConcepts(prev => {
                                  if (rightMultiSelect) {
                                    const exists = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                    return exists ? prev.filter(n => (n || '').trim().toLowerCase() !== (name || '').trim().toLowerCase()) : [...prev, name];
                                  }
                                  return [name];
                                });
                                const existsInLeft = (ontology?.concepts || []).some(c => (c?.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                if (existsInLeft) {
                                  setLeftSelectedConcept(name);
                                  setLeftSelectedConcepts(prev => {
                                    if (leftMultiSelect) {
                                      const present = prev.some(n => (n || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
                                      return present ? prev : [...prev, name];
                                    }
                                    return [name];
                                  });
                                }
                              }}
                              onSelectRelationship={(rel) => {
                                setRightSelectedConcept(null);
                                setRightSelectedRel(rel);
                                setRightSelectedRels(prev => {
                                  const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                                  if (rightMultiSelect) {
                                    const exists = prev.some(r => key(r) === key(rel));
                                    return exists ? prev.filter(r => key(r) !== key(rel)) : [...prev, rel];
                                  }
                                  return [rel];
                                });
                                const existsInLeft = (ontology?.relationships || []).some(r =>
                                  (r?.name || '').trim().toLowerCase() === (rel?.name || '').trim().toLowerCase() &&
                                  (r?.nameFrom || '').trim().toLowerCase() === (rel?.nameFrom || '').trim().toLowerCase() &&
                                  (r?.nameTo || '').trim().toLowerCase() === (rel?.nameTo || '').trim().toLowerCase()
                                );
                                if (existsInLeft) {
                                  setLeftSelectedRel(rel);
                                  setLeftSelectedRels(prev => {
                                    const key = (r: any) => `${(r?.name || '').trim().toLowerCase()}|${(r?.nameFrom || '').trim().toLowerCase()}|${(r?.nameTo || '').trim().toLowerCase()}`;
                                    if (leftMultiSelect) {
                                      const exists = prev.some(r => key(r) === key(rel));
                                      return exists ? prev : [...prev, rel];
                                    }
                                    return [rel];
                                  });
                                }
                              }}
                            />
                            {(rightSelectedConcept || rightSelectedRel) && (
                              <div className="mt-2 text-xs text-gray-200 bg-gray-900/60 rounded p-2">
                                {rightSelectedConcept && (
                                  <div>
                                    <div className="font-semibold">Concept</div>
                                    <div className="text-gray-300">{rightSelectedConcept}</div>
                                    <div className="text-gray-400">
                                      {(suggestedOntologyData?.concepts || []).find(c => (c?.name || '').trim().toLowerCase() === (rightSelectedConcept || '').trim().toLowerCase())?.description || '—'}
                                    </div>
                                  </div>
                                )}
                                {rightSelectedRel && (
                                  <div>
                                    <div className="font-semibold">Relationship</div>
                                    <div className="text-gray-300">{rightSelectedRel.nameFrom} — {rightSelectedRel.name} → {rightSelectedRel.nameTo}</div>
                                    <div className="text-gray-400">
                                      {(suggestedOntologyData?.relationships || []).find(r =>
                                        (r?.name || '').trim().toLowerCase() === (rightSelectedRel?.name || '').trim().toLowerCase() &&
                                        (r?.nameFrom || '').trim().toLowerCase() === (rightSelectedRel?.nameFrom || '').trim().toLowerCase() &&
                                        (r?.nameTo || '').trim().toLowerCase() === (rightSelectedRel?.nameTo || '').trim().toLowerCase()
                                      )?.description || '—'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setRightGraphOpen(false)} className="bg-gray-700 text-gray-100">Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </Card>
          </div>
        )
      }
    ],
    defaultTab: 'preview'
  };

// Current middle panel content (for modal)
  const middlePanelContentModal = {
    tabs: [
      {
        key: 'chat',
        label: 'AI Ontology Chat',
        content: (
          <div className="flex-1 overflow-hidden bg-gray-800/20 rounded h-full">
            <div className="flex overflow-hidden h-full">
              <ChatComponent
                mdContent={mdContent}
                setMdContent={setMdContent}
                suggestedOntologyData={suggestedOntologyData}
                setSuggestedOntologyData={setSuggestedOntologyData}
                onImplementSuggestedOntology={handleSaveToLibrary}
                startupGuide={<GettingStartedGuide />}
                guide={<Guide />}
              />
            </div>
          </div>
        )
      },
      {
        key: 'chatold',
        label: 'AI Old Chat',
        content: showEditorModal ? (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded h-full">
            <OntologyBuilder
              // isOpen={true}
              // onClose={() => setShowEditorModal(false)}
              moduleOperations={modelSelector}
              leftPanelContent={leftPanelContent}
              middlePanelContent={middlePanelContent} // Only chat tab
              rightPanelContent={rightPanelContent}
              showLeftPanel={showLeftPanel}
              setShowLeftPanel={setShowLeftPanel}
              showRightPanel={showRightPanel}
              setShowRightPanel={setShowRightPanel}
              className="h-full min-w-0 bg-background text-gray-100"
            />
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-400">
            Open the editor to use the AI Ontology Chat
          </div>
        )
      },

    ],
    defaultTab: 'chat'
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
    <div className="flex-1 flex-row h-screen">
      <div className="w-full border-b-2 border-gray-600">
        <FileOperations />
      </div>

      <ThreePanelLayout
        moduleOperations={modelSelector}
        leftPanelContent={leftPanelContent}
        middlePanelContent={middlePanelContent} // <-- Use filtered content without aiGwChat tab
        rightPanelContent={rightPanelContent}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        className="h-full min-w-0 bg-background text-gray-100"
      >
        <></>
      </ThreePanelLayout>

      {/* Ontology editor modal - only mounted when explicitly opened */}
      {showEditorModal && (
        <OntologyEditorModal
          isOpen={true}
          onClose={() => setShowEditorModal(false)}
          moduleOperations={modelSelector}
          leftPanelContent={leftPanelContent}
          middlePanelContent={middlePanelContentModal} // <-- Use only aiGwChat tab in modal
          rightPanelContent={rightPanelContent}
          showLeftPanel={showLeftPanel}
          setShowLeftPanel={setShowLeftPanel}
          showRightPanel={showRightPanel}
          setShowRightPanel={setShowRightPanel}
          className="h-full min-w-0 bg-background text-gray-100"
        />
      )}

      {/* Floating "Open AI Assistant" button - Centered with AI icon */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          aria-label="Open AI Assistant"
          title="Open AI Ontology Chat Editor"
          onClick={() => setShowEditorModal(true)}
          className="inline-flex items-center justify-center gap-3 rounded-full px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white shadow-lg ring-1 ring-black/10 transition-all duration-200 hover:scale-105"
        >
          <FontAwesomeIcon icon={faRobot} className="w-5 h-5" />
          <span className="text-sm font-semibold">Open AI Assistant</span>
        </button>
      </div>
    </div>
  );
}
