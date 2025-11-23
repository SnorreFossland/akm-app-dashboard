"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, Package, FileText, Eye, EyeOff } from 'lucide-react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

import { FileOperations } from '@/components/FileOperations';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ModelBuilderComponent from '@/components/model-builder/ModelBuilder';
import ModelBuilderModal from '@/components/model-builder/ModelBuilderModal';
import OutputPanel from '@/components/model-builder/OutputPanel';
import GettingStartedGuide from '@/components/model-builder/GettingStartedGuide';
import Guide from '@/components/model-builder/Guide';
import ModelComponent from '@/features/model-universe/components/ModelComponent';
import { ObjectCard } from '@/components/object-card';
import { OntologyCard } from '@/components/ontology-card';
import { setFocusModel, Model } from '@/features/model-universe/modelSlice';
import next from 'next/dist/server/next';

type ModelConversation = { id: string; title: string; messages: any[]; timestamp: number };
const debug = false;

type ContainerReportEntry = {
  containerName: string;
  information: string[];
  roles: string[];
  tasks: string[];
  views: string[];
  processes: string[];
  organisations: string[];
  products: string[];
  systems: string[];
};

export default function ModelBuilderPage() {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.modelUniverse);
  if (debug) console.log('31 ModelBuilderPage data:', data);
  const metis = useSelector((state: { modelUniverse: any }) => data.phData.metis);
  const domain = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const ontology = useSelector((state: { modelUniverse: any }) => data.phData.domain?.ontology);
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);
  const focusProject = useSelector((state: RootState) => state.modelUniverse.phFocus.focusProj);
  const focusObjectIds = data?.phFocus?.focusObjectIds ?? [];
  const focusRelshipIds = data?.phFocus?.focusRelshipIds ?? [];
  const focusSelectionExists = focusObjectIds.length > 0 || focusRelshipIds.length > 0;

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('ai-model');
  const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'model' | 'other-context'>('other-context');

  const [mdContent, setMdContent] = useState('');
  const [mdPreview, setMdPreview] = useState('Nothing to preview yet!');
  const [projectDocId, setProjectDocId] = useState<string | null>(null);
  const [projectContent, setProjectContent] = useState('');
  const [modelContent, setModelContent] = useState<any>('');
  const [modelPreview, setModelPreview] = useState('');
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [curMetamodel, setCurMetamodel] = useState<any>(null);
  const [containerCopyState, setContainerCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  // Persisted AI model selection for the builder
  const [selectedAiModel, setSelectedAiModel] = useState<'dummy' | 'deepseek-chat' | 'mistral' | 'gpt-5' | 'gpt-5-mini'>('dummy');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aiDashboard_selectedModel');
      if (saved) setSelectedAiModel(saved as any);
    } catch { }
    const focusModel = data?.phFocus?.focusModel;
    if (focusModel) {
      const models = data?.phData?.metis?.models || [];
      const curmod = models.find((m: any) => m.id === focusModel.id) || null;
      setCurrentModel(curmod);
    }
  }, []);

  // Sync currentModel from focus
  useEffect(() => {
    const focusedId = data?.phFocus?.focusModel?.id;
    const models = data?.phData?.metis?.models || [];
    const next = models.find((m: any) => m.id === focusedId) || null;
    setCurrentModel((prev) => (prev?.id === next?.id ? prev : next));
  }, [data?.phData?.metis?.models, data?.phFocus?.focusModel?.id]);

  // Derive curMetamodel for selected model
  useEffect(() => {
    if (!currentModel) { setCurMetamodel(null); return; }
    const metamodels = (data?.phData?.metis?.metamodels || []) as any[];
    const nextMeta = metamodels.find((mm) => mm.id === currentModel.metamodelRef) || null;
    setCurMetamodel((prev: any) => (prev?.id === nextMeta?.id ? prev : nextMeta));
  }, [currentModel?.metamodelRef, data?.phData?.metis?.metamodels]);


  const handleViewInMarkdown = (response: string) => {
    const cleaned = response
      .replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '')
      .replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
    setMdPreview(cleaned);
    setShowRightPanel(true);
  };

  useEffect(() => {
    if (!focusProject) return;

    if (focusProject.id) {
      const matchingDoc = documents?.find((doc) => doc.id === focusProject.id);
      if (matchingDoc) {
        setProjectDocId(matchingDoc.id);
        setProjectContent(matchingDoc.content || '');
        return;
      }
    }

    if (focusProject.description) {
      setProjectDocId(null);
      setProjectContent(focusProject.description);
    }
  }, [focusProject, documents]);

  // Middle panel
  const middlePanelContent = {
    tabs: [
      // AI Modeller moved into a modal. See `modelModalMiddlePanelContent` below.
      {
        key: 'suite',
        label: (
          <span className="inline-flex items-center gap-1">
            <FileText className="w-4 h-4" /> Current Model
            {/* {currentModel?.name || 'Model'} */}
          </span>
        ),
        content: (
          <div className="space-y-4">
            {currentModel && (
              <ObjectCard model={{
                id: currentModel.id,
                name: currentModel.name,
                description: currentModel.description,
                objects: currentModel.objects?.map(obj => ({
                  id: obj.id || '',
                  name: obj.name || '',
                  description: obj.description || '',
                  proposedType: obj.proposedType || '',
                  typeRef: obj.typeRef || '',
                  typeName: obj.typeName || '',
                  category: obj.category || ''
                })) || [],
                relships: currentModel.relships || [],
                metamodelRef: currentModel.metamodelRef,
                modelviews: currentModel.modelviews
              }} />
            )}
          </div>
        )
      },
      // {
      //   key: 'model',
      //   label: 'Model',
      //   content: (
      //     <div className="text-xs w-full">
      //       {currentModel && <ModelComponent model={currentModel} />}
      //     </div>
      //   )
      // },
      {
        key: 'mimris',
        label: (
          <span className="inline-flex items-center gap-1">
            <Package className="w-4 h-4" /> Mimris
          </span>
        ),
        content: (
          <div className="w-full h-screen m-0 p-0">
            <iframe
              style={{ height: '100%', width: '100%' }}
              src="https://mimris.vercel.app/modelling"
              className="w-full h-full border-none rounded"
              title="Embedded Mimris Modeller"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )
      }
    ],
    defaultTab: 'suite'
  };

  // The content originally used inline for the 'ai-model' tab — now used by the modal.
  const modelModalMiddlePanelContent = {
    tabs: [
      {
        key: 'ai-model',
        label: 'AI Modelling Assistant',
        content: (
          <div className="flex flex-col h-[calc(100vh-11rem)] gap-2">
            <ModelBuilderComponent
              input={mdContent}
              setInput={setMdContent}
              selectedModel={selectedAiModel}
              setSelectedModel={setSelectedAiModel}
              onResponseChange={() => { }}
              onViewInPreview={(s: string) => setModelPreview(s)}
              onViewInMarkdown={handleViewInMarkdown}
              setShowLeftPanel={setShowLeftPanel}
              onAddContent={(content: string) => setModelContent(content)}
              modelContent={modelContent}
              setModelContent={setModelContent}
              modelPreview={modelPreview}
              setModelPreview={setModelPreview}
              setCurrentMessages={setCurrentMessages}
              gettingStartedGuide={<GettingStartedGuide />}
              guide={<Guide />}
            />
          </div>
        )
      }
    ],
    defaultTab: 'ai-model'
  };
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [showModelPreviewPanel, setShowModelPreviewPanel] = useState(true);
  const [modalToolTab, setModalToolTab] = useState<'ai' | 'edit'>('ai');
  const [previewWidthRatio, setPreviewWidthRatio] = useState(0.4);
  const [isPreviewResizing, setIsPreviewResizing] = useState(false);
  const previewSplitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModelModalOpen) {
      setShowModelPreviewPanel(true);
    }
  }, [isModelModalOpen]);

  useEffect(() => {
    if (isModelModalOpen) {
      setModelPreview('');
    }
  }, [isModelModalOpen, setModelPreview]);

  const getModelModalTabButtonClass = (active: boolean) =>
    `px-3 py-0.5 text-[11px] rounded transition ${active
      ? 'bg-orange-500 text-white shadow-sm'
      : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-orange-500/70'
    }`;

  const handleModelModalTabSelect = useCallback((tab: 'ai' | 'edit') => {
    setModalToolTab(tab);
    setShowModelPreviewPanel(tab === 'ai');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (!detail || detail.target !== 'model-builder') return;
      const preferred = detail.initialMode === 'edit' ? 'edit' : 'ai';
      const action = detail.action || 'open';

      if (action === 'toggle') {
        setIsModelModalOpen((prev) => {
          const shouldOpen = !prev;
          if (shouldOpen) {
            handleModelModalTabSelect(preferred as 'ai' | 'edit');
          } else {
            setShowModelPreviewPanel(true);
          }
          return shouldOpen;
        });
        return;
      }

      if (action === 'close') {
        setShowModelPreviewPanel(true);
        setIsModelModalOpen(false);
        return;
      }

      handleModelModalTabSelect(preferred as 'ai' | 'edit');
      setIsModelModalOpen(true);
    };
    window.addEventListener('ai-tools:open', handler as EventListener);
    return () => window.removeEventListener('ai-tools:open', handler as EventListener);
  }, [handleModelModalTabSelect]);

  const startPreviewResize = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined') return;
    if (modalToolTab !== 'ai' || !showModelPreviewPanel) return;
    event.preventDefault();
    setIsPreviewResizing(true);
  };

  useEffect(() => {
    if (!isPreviewResizing) return;

    const container = previewSplitContainerRef.current;
    const clampRatio = (value: number) => Math.min(0.75, Math.max(0.25, value));

    const updatePreviewWidth = (clientX: number) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const totalWidth = rect.width || 1;
      const previewWidth = rect.right - clientX;
      if (totalWidth <= 0) return;
      setPreviewWidthRatio(clampRatio(previewWidth / totalWidth));
    };

    const handleMouseMove = (event: MouseEvent) => updatePreviewWidth(event.clientX);
    const handleTouchMove = (event: TouchEvent) => {
      if (!event.touches.length) return;
      updatePreviewWidth(event.touches[0].clientX);
    };

    const stopResizing = () => setIsPreviewResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchend', stopResizing);
    window.addEventListener('mouseleave', stopResizing);
    window.addEventListener('touchcancel', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchend', stopResizing);
      window.removeEventListener('mouseleave', stopResizing);
      window.removeEventListener('touchcancel', stopResizing);
    };
  }, [isPreviewResizing]);

  // Left panel
  const leftPanelContent = {
    tabs: [
      {
        key: 'domain',
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
        key: 'project',
        label: 'Project Document',
        content: (
          <DocumentPanel
            mdContent={projectContent}
            setMdContent={setProjectContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType='left'
            showDocumentList={false}
            documentId={projectDocId || undefined}
            onSelect={(content, _name, doc) => {
              setProjectContent(content);
              if (doc?.id) {
                setProjectDocId(doc.id);
              }
            }}
          />
        )
      },
    ],
    defaultTab: 'domain'
  };

  const {
    report: containerProcessReport,
    markdown: containerReportMarkdown,
    isPOPSMetamodel,
  } = useMemo(() => {
    const metamodelName = (curMetamodel?.name || '').toLowerCase();
    const isPOPS = metamodelName.includes('pops');

    const sourceModel =
      modelContent && typeof modelContent === 'object' && 'objects' in (modelContent as any) && Array.isArray((modelContent as any).objects)
        ? (modelContent as Model | { objects: any[]; relships: any[] })
        : currentModel;

    if (!sourceModel || !Array.isArray((sourceModel as any).objects) || !Array.isArray((sourceModel as any).relships)) {
      return {
        report: [] as ContainerReportEntry[],
        markdown: '',
        isPOPSMetamodel: isPOPS,
      };
    }

    const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();
    const categorize = (object: any) => {
      const typeString = normalize(object?.typeName || object?.proposedType);
      if (debug) console.log('414 :', object.name, typeString);

      if (!typeString) return '';
      if (typeString.includes('container')) return 'container';
      if (typeString.includes('information') || typeString.includes('info')) return 'information';
      if (typeString.includes('role')) return 'role';
      if (typeString.includes('task')) return 'task';
      if (typeString.includes('view')) return 'view';
      if (typeString.includes('process')) return 'process';
      if (typeString.includes('organisation')) return 'organisation';
      if (typeString.includes('product')) return 'product';
      if (typeString.includes('system')) return 'system';
      return '';
    };

    const objectsById = new Map<string, any>();
    (sourceModel as any).objects.forEach((obj: any) => {
      if (obj?.id) {
        objectsById.set(String(obj.id), obj);
      }
    });

    const containsRelationships = ((sourceModel as any).relships || []).filter(
      (rel: any) => normalize(rel?.name) === 'contains'
    );

    if (!containsRelationships.length) {
      return {
        report: [] as ContainerReportEntry[],
        markdown: '',
        isPOPSMetamodel: isPOPS,
      };
    }

    const membershipMap = new Map<string, Set<string>>();
    containsRelationships.forEach((rel: any) => {
      const fromId = rel?.fromobjectRef ? String(rel.fromobjectRef) : null;
      const toId = rel?.toobjectRef ? String(rel.toobjectRef) : null;
      if (!fromId || !toId) return;
      if (!membershipMap.has(fromId)) {
        membershipMap.set(fromId, new Set<string>());
      }
      membershipMap.get(fromId)!.add(toId);
    });

    const toUniqueNames = (items: Set<string>) =>
      Array.from(items).filter(Boolean).filter((value, index, array) => array.indexOf(value) === index);

    const report: ContainerReportEntry[] = [];

    (sourceModel as any).objects
      .filter((obj: any) => categorize(obj) === 'container' || categorize(obj) === 'process')
      .forEach((container: any) => {
        const containedIds = membershipMap.get(String(container.id));
        const informationSet = new Set<string>();
        const roleSet = new Set<string>();
        const taskSet = new Set<string>();
        const viewSet = new Set<string>();
        const processSet = new Set<string>();
        const organisationSet = new Set<string>();
        const productSet = new Set<string>();
        const systemSet = new Set<string>();

        if (containedIds && containedIds.size > 0) {
          containedIds.forEach((memberId) => {
            const member = objectsById.get(memberId);
            if (!member) return;
            const category = categorize(member);
            const name = member?.name?.trim?.() || member?.description?.trim?.() || '';
            if (!category) return;

            if (category === 'information') {
              if (name) informationSet.add(name);
            } else if (category === 'role') {
              if (name) roleSet.add(name);
            } else if (category === 'task') {
              if (name) taskSet.add(name);
            } else if (category === 'view') {
              if (name) viewSet.add(name);
            } else if (category === 'process') {
              if (name) processSet.add(name);
            } else if (category === 'organisation') {
              if (name) organisationSet.add(name);
            } else if (category === 'product') {
              if (name) productSet.add(name);
            } else if (category === 'system') {
              if (name) systemSet.add(name);
            }
          });
        }

        const containerName = container?.name?.trim?.() || 'Untitled Container';
        const information = informationSet.size > 0 ? toUniqueNames(informationSet) : ['None'];
        const roles = roleSet.size > 0 ? toUniqueNames(roleSet) : ['None'];
        const tasks = taskSet.size > 0 ? toUniqueNames(taskSet) : ['None'];
        const views = viewSet.size > 0 ? toUniqueNames(viewSet) : ['None'];
        const processes = processSet.size > 0 ? toUniqueNames(processSet) : ['None'];
        const organisations = organisationSet.size > 0 ? toUniqueNames(organisationSet) : ['None'];
        const products = productSet.size > 0 ? toUniqueNames(productSet) : ['None'];
        const systems = systemSet.size > 0 ? toUniqueNames(systemSet) : ['None'];

        report.push({
          containerName,
          information,
          roles,
          tasks,
          views,
          processes,
          organisations,
          products,
          systems,
        });
      });

    const markdownLines: string[] = [];
    report.forEach((entry) => {
      markdownLines.push(`### ${entry.containerName}`);
      if (isPOPS) {
        markdownLines.push(`- **Processes:** ${entry.processes.join(', ')}`);
        markdownLines.push(`- **Organisations:** ${entry.organisations.join(', ')}`);
        markdownLines.push(`- **Products:** ${entry.products.join(', ')}`);
        markdownLines.push(`- **Systems:** ${entry.systems.join(', ')}`);
      } else {
        markdownLines.push(`- **Information:** ${entry.information.join(', ')}`);
        markdownLines.push(`- **Roles:** ${entry.roles.join(', ')}`);
        markdownLines.push(`- **Tasks:** ${entry.tasks.join(', ')}`);
        markdownLines.push(`- **Views:** ${entry.views.join(', ')}`);
      }
      markdownLines.push('');
    });

    return {
      report,
      markdown: markdownLines.join('\n').trim(),
      isPOPSMetamodel: isPOPS,
    };
  }, [currentModel, modelContent, curMetamodel]);

  // Right panel
  const rightPanelContent = {
    tabs: [
      {
        key: 'info',
        label: 'Model Info',
        content: (
          <div className="h-full overflow-auto px-4 py-4 space-y-4 text-sm text-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-300">Container Report</h3>
                <p className="text-xs text-gray-500">
                  Derived from container <span className="italic">&ldquo;contains&rdquo;</span> relationships in the current model.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!containerReportMarkdown) {
                      setContainerCopyState('error');
                      setTimeout(() => setContainerCopyState('idle'), 2000);
                      return;
                    }

                    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
                      setContainerCopyState('error');
                      setTimeout(() => setContainerCopyState('idle'), 2000);
                      return;
                    }

                    navigator.clipboard.writeText(containerReportMarkdown)
                      .then(() => {
                        setContainerCopyState('copied');
                        setTimeout(() => setContainerCopyState('idle'), 2000);
                      })
                      .catch(() => {
                        setContainerCopyState('error');
                        setTimeout(() => setContainerCopyState('idle'), 2000);
                      });
                  }}
                  disabled={!containerReportMarkdown}
                  className="px-2 py-1 text-xs rounded border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Copy Markdown
                </button>
                {containerCopyState === 'copied' && (
                  <span className="text-xs text-green-400">Copied!</span>
                )}
                {containerCopyState === 'error' && (
                  <span className="text-xs text-red-400">Copy failed</span>
                )}
              </div>
            </div>
            {containerProcessReport.length === 0 ? (
              <p className="text-sm text-gray-400">
                No containers were found. Generate or select a model to populate this report.
              </p>
            ) : (
              containerProcessReport.map((entry, index) => (
                <div
                  key={`${entry.containerName}-${index}`}
                  className="space-y-3 rounded-md border border-gray-800 bg-gray-900/40 p-3"
                >
                  <h4 className="text-base font-semibold text-gray-200">{entry.containerName}</h4>
                  <div className="space-y-1 text-sm text-gray-200">
                    {isPOPSMetamodel ? (
                      <>
                        {entry.processes.length ? (
                          <p>
                            Processes:{' '}
                            {entry.processes.join(', ')}
                          </p>
                        ) : null}

                        {entry.organisations.length ? (
                          <p>
                            Organisations:{' '}
                            {entry.organisations.join(', ')}
                          </p>
                        ) : null}

                        {entry.products.length ? (
                          <p>
                            Products:{' '}
                            {entry.products.join(', ')}
                          </p>
                        ) : null}

                        {entry.systems.length ? (
                          <p>
                            Systems:{' '}
                            {entry.systems.join(', ')}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p>
                          Information:{' '}
                          {entry.information.length ? entry.information.join(', ') : 'None'}
                        </p>
                        <p>
                          Roles:{' '}
                          {entry.roles.length ? entry.roles.join(', ') : 'None'}
                        </p>
                        <p>
                          Tasks:{' '}
                          {entry.tasks.length ? entry.tasks.join(', ') : 'None'}
                        </p>
                        <p>
                          Views:{' '}
                          {entry.views.length ? entry.views.join(', ') : 'None'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      },
      {
        key: 'preview',
        label: 'Preview Diagram',
        content: (
          <div className="p-2 h-full">
            {currentModel ? (
              <ObjectCard
                model={currentModel}
                showListTabs={false}
                focusObjectIds={focusObjectIds}
                focusRelshipIds={focusRelshipIds}
                filterToSelection={focusSelectionExists}
              />
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-sm text-gray-300 space-y-2">
                <p>No model selected.</p>
                <p className="text-xs text-gray-500">Select or build a model to see its diagram here.</p>
              </div>
            )}
          </div>
        )
      }
    ],
    defaultTab: 'info'
  };

  // Model suite selector for top bar
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = data.phData.metis.models.find((m: any) => m.name === e.target.value) || null;
    setCurrentModel(sel);
    if (sel) dispatch(setFocusModel({ id: sel.id, name: sel.name }));
  };

  const moduleOperations = (
    <div className="flex items-center justify-between gap-4 bg-gray-800 text-xs w-full h-10 border-b border-gray-700 px-2">
      <div className="flex flex-1 flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="ms-1 font-bold text-gray-400">ModelSuite:</span>
          <span className="text-gray-300">{metis?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="model-select" className="me-1 font-bold text-gray-400">Current Model:</label>
          <select id="model-select" className="font-bold inline-block bg-dark text-gray-100 border rounded border-gray-300" onChange={handleModelChange} value={currentModel?.name}>
            {metis?.models.map((m: { name: string }) => (
              <option key={m.name} value={m.name} className="ps-2 text-xl font-bold inline-block bg-gray-900 text-gray-400">{m.name}</option>
            ))}
          </select>
        </div>
        <div className="text-gray-400">
          {curMetamodel?.name || 'Default'}
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <span className="font-bold">No.ofObj:</span>
          <span className="px-1 inline-block bg-gray-900">{currentModel?.objects?.length}</span>
        </div>
      </div>
      {/* <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-6 px-2 py-0 text-xs text-white bg-orange-700/80"
          onClick={() => {
            handleModelModalTabSelect('ai');
            setIsModelModalOpen(true);
          }}
        >
          Open AI Modeller
        </Button>
      </div> */}
    </div>
  );

  const previewVisible = modalToolTab === 'ai' && showModelPreviewPanel;
  const normalizedPreviewWidthPct = Math.min(75, Math.max(25, previewWidthRatio * 100));
  const previewWidthPct = previewVisible ? normalizedPreviewWidthPct : 0;
  const chatWidthPct = previewVisible ? 100 - normalizedPreviewWidthPct : 100;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="w-full border-b-2 border-gray-600">
        <FileOperations />
      </div>
      <ThreePanelLayout
        moduleOperations={moduleOperations}
        leftPanelContent={leftPanelContent}
        middlePanelContent={middlePanelContent}
        rightPanelContent={rightPanelContent}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        className="h-full min-w-0 bg-background text-gray-100"
      >
        {/* Inline modal anchored to the right of the middle panel (AI-Chat style) */}
        {isModelModalOpen && (
          <div
            className="fixed top-[calc(var(--header-height,56px)+0.5rem)] right-4 z-50"
            style={{ width: 'min(1100px,96vw)', maxHeight: 'calc(100vh - var(--header-height,56px) - 1rem)' }}
          >
            <div
              className="bg-popover rounded-md shadow-lg overflow-hidden flex flex-col border-2 border-orange-400/70"
              style={{ height: '100%', maxHeight: 'calc(100vh - var(--header-height,56px) - 1rem)' }}
            >
              <div className="flex flex-col border-b border-gray-700 bg-orange-900/50 flex-shrink-0">
                <div className="flex items-center justify-between gap-2 p-2">
                  <h3 className="text-sm font-semibold text-gray-300 ms-2">AI Modeller</h3>
                  <div className="flex items-center gap-2">
                    {modalToolTab === 'ai' && (
                      <button
                        onClick={() => setShowModelPreviewPanel((prev) => !prev)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors"
                      >
                        {showModelPreviewPanel ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Show Preview
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowModelPreviewPanel(true);
                        setIsModelModalOpen(false);
                      }}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-0 flex-1 min-h-0 overflow-hidden">
                <div ref={previewSplitContainerRef} className="h-full min-h-0 flex overflow-hidden bg-background">
                  <div
                    className="flex-1 min-w-0 h-full overflow-auto p-4"
                    style={previewVisible ? {
                      flexBasis: `${chatWidthPct}%`,
                      maxWidth: `${chatWidthPct}%`
                    } : { flex: '1 1 100%' }}
                  >
                    <div className="flex-1 flex flex-col min-h-full">
                      {/* Render the ai-model tab content from the prepared modelModalMiddlePanelContent */}
                      {modelModalMiddlePanelContent?.tabs?.[0]?.content}
                    </div>
                  </div>
                  {previewVisible && (
                    <div
                      className="relative  w-4 flex justify-stretch justify-center cursor-col-resize"
                      onMouseDown={startPreviewResize}
                      onTouchStart={startPreviewResize}
                    >
                      <span className="absolute inset-y-0 w-1 h-full rounded-full bg-gradient-to-b from-orange-600/90 via-orange-500/80 to-yellow-400/70 border border-orange-300/50 shadow-[0_0_12px_rgba(255,159,0,0.45)]" />
                    </div>
                  )}
                  {previewVisible && (
                    <div
                      className="h-full overflow-auto bg-gray-900/70 border-l border-gray-700"
                      style={{
                        width: `${previewWidthPct}%`,
                        flexBasis: `${previewWidthPct}%`,
                        maxWidth: `${previewWidthPct}%`,
                        minWidth: '280px'
                      }}
                    >
                      <OutputPanel
                        modelPreview={modelPreview}
                        setModelPreview={setModelPreview}
                        modelContent={modelContent}
                        setmodelContent={setModelContent}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType="right"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ThreePanelLayout>

      {/* Context Document Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsLibraryOpen(false)}>
          <div className="bg-background rounded-lg p-4 w-[720px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-blue-400">Context Document Library</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setIsLibraryOpen(false)}>Close</button>
            </div>
            <div className="text-sm text-gray-400 mb-2">Select a document to load its content into the Context panel.</div>
            <div className="space-y-1">
              {(!documents || documents.length === 0) && (
                <div className="text-gray-500 text-sm">No documents in library.</div>
              )}
              {documents?.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between border border-gray-700 rounded p-2 hover:bg-gray-800">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-gray-300 truncate">{doc.name}</div>
                    <div className="text-xs text-gray-500 truncate">{new Date(doc.updatedAt || doc.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="text-xs"
                      onClick={() => {
                        setMdContent(doc.content || '');
                        setIsLibraryOpen(false);
                        setActiveLeftTab('other-context');
                      }}
                    >Load</Button>
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => {
                        const blob = new Blob([doc.content || ''], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${doc.name || 'document'}.md`; a.click(); URL.revokeObjectURL(url);
                      }}
                    >Download</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
