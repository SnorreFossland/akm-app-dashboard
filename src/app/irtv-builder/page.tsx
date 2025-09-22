"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, Package, FileText } from 'lucide-react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

import { FileOperations } from '@/components/FileOperations';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import IrtvBuilderComponent from '@/components/irtv-builder/IrtvBuildercomponent';
import OutputPanel from '@/components/irtv-builder/OutputPanel';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
import Guide from '@/components/irtv-builder/Guide';
import ModelComponent from '@/features/model-universe/components/ModelComponent';
import { ObjectCard } from '@/components/object-card';
import { OntologyCard } from '@/components/ontology-card';
import { setFocusModel, Model } from '@/features/model-universe/modelSlice';
import next from 'next/dist/server/next';

type IrtvConversation = { id: string; title: string; messages: any[]; timestamp: number };

export default function IrtvBuilderPage() {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.modelUniverse);
  const metis = useSelector((state: { modelUniverse: any }) => data.phData.metis);
  const domain = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const ontology = useSelector((state: { modelUniverse: any }) => data.phData.domain?.ontology);
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('ai-irtv');
  const [activeLeftTab, setActiveLeftTab] = useState<'conversations' | 'model' | 'other-context'>('other-context');

  const [mdContent, setMdContent] = useState('');
  const [mdPreview, setMdPreview] = useState('Nothing to preview yet!');
  const [irtvContent, setIrtvContent] = useState<any>('');
  const [irtvPreview, setIrtvPreview] = useState('');
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [curMetamodel, setCurMetamodel] = useState<any>(null);

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

  // Left panel
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
        key: 'ontology',
        label: 'Current Ontology',
        content: (
          <div className="grid gap-4">
            {ontology ? (
              <OntologyCard domainData={domain} ontologyData={ontology} />
            ) : (
              <div className="text-center py-8">
                <Network className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No ontologies defined yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Use the Ontology Builder to create your first ontology
                </p>
              </div>
            )}
          </div>
        )
      },
      {
        key: 'model',
        label: 'Model',
        content: (
          <div className="space-y-4">
            {currentModel && (
              <ObjectCard model={{
                id: currentModel.id,
                name: currentModel.name,
                description: currentModel.description,
                objects: currentModel.objects?.map((obj: any) => ({
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
      }
    ],
    defaultTab: 'ontology'
  };

  // Middle panel
  const middlePanelContent = {
    tabs: [
      {
        key: 'ai-irtv',
        label: 'AI IRTV Modelling Assistant',
        content: (
          <div className="flex flex-col gap-2">
            <IrtvBuilderComponent
              input={mdContent}
              setInput={setMdContent}
              selectedModel={selectedAiModel}
              setSelectedModel={setSelectedAiModel}
              onResponseChange={() => { }}
              onViewInPreview={(s: string) => setIrtvPreview(s)}
              onViewInMarkdown={handleViewInMarkdown}
              setShowLeftPanel={setShowLeftPanel}
              onAddContent={(content: string) => setIrtvContent(content)}
              irtvContent={irtvContent}
              setIrtvContent={setIrtvContent}
              irtvPreview={irtvPreview}
              setIrtvPreview={setIrtvPreview}
              setCurrentMessages={setCurrentMessages}
              gettingStartedGuide={<GettingStartedGuide />}
              guide={<Guide />}
            />
          </div>
        )
      },
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
    defaultTab: 'ai-irtv'
  };

  // Right panel
  const rightPanelContent = {
    tabs: [
      {
        key: 'preview',
        label: 'Model Preview',
        content: (
          <OutputPanel
            irtvPreview={irtvPreview}
            setIrtvPreview={setIrtvPreview}
            irtvContent={irtvContent}
            setIrtvContent={setIrtvContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType="right"
          />
        )
      }
    ],
    defaultTab: 'preview'
  };

  // Model suite selector for top bar
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = data.phData.metis.models.find((m: any) => m.name === e.target.value) || null;
    setCurrentModel(sel);
    if (sel) dispatch(setFocusModel({ id: sel.id, name: sel.name }));
  };

  const moduleOperations = (
    <div className="flex justify-between items-center justify-center bg-gray-800 text-xs">
      <div className="px-1">
        <span className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</span>
        <span className="text-gray-300">{metis?.name}</span>
      </div>
      <div className="px-1">
        <label htmlFor="model-select" className="me-1 font-bold text-gray-400 inline-block">Current Model:</label>
        <select id="model-select" className="ps-2 text-xl font-bold inline-block bg-gray-900 text-orange-400" onChange={handleModelChange} value={currentModel?.name}>
          {metis?.models.map((m: { name: string }) => (
            <option key={m.name} value={m.name} className="ps-2 text-xl font-bold inline-block bg-gray-900 text-orange-400">{m.name}</option>
          ))}
        </select>
      </div>
      <div className="px-1 me-auto">
        <span className="text-gray-400">{curMetamodel?.name || 'Default'}</span>
      </div>
      <h3 className="flex ms-1 pl-1 font-bold text-gray-400">No.ofObj:
        <span className="px-1 inline-block bg-gray-900">{currentModel?.objects?.length}</span>
      </h3>
    </div>
  );

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
        <></>
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
