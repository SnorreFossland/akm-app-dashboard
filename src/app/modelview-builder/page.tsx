"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Network, Package } from 'lucide-react';

import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
// import ModelComponent from '@/features/model-universe/components/ModelComponent';
import ModelviewBuilder from '@/components/modelview-bilder/ModelviewBuilder';
// import { ModelviewCard } from '@/components/modelview-card';
import { FileOperations } from '@/components/FileOperations';
import { setFocusModel } from '@/features/model-universe/modelSlice';
import { ObjectCard } from '@/components/object-card';
import { ObjectviewCard } from '@/components/objectview-card';
import { ModelviewCard } from '@/components/modelview-card';
import OutputPanel from '@/components/modelview-bilder/OutputPanel';
import GettingStartedGuide from '@/components/modelview-bilder/GettingStartedGuide';
import Guide from '@/components/modelview-bilder/Guide';
import ModelSuiteSelector from '@/components/ModelSuiteSelector';

type Model = { id?: string; name?: string; description?: string; objects?: any[]; relships?: any[] };

export default function ModelviewBuilderPage() {
  const data = useSelector((state: RootState) => state.modelUniverse);
  const metis = useSelector((state: { modelUniverse: any }) => data.phData.metis);
  const domain = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const dispatch = useDispatch();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [curMetamodel, setCurMetamodel] = useState<any>(null);
  const [curModelview, setCurModelview] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>("");

  // const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
  // const [metis, setMetis] = useState<Metis | null >(null);
  const [model, setModel] = useState<{ id?: string; name?: string; description?: string; objects?: any[]; relships?: any[] } | null>(null);
  // const [curmod, setCurmod] = useState<any | null>(null);
 
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);

  const [focusModelLocal, setFocusModelLocal] = useState<{ id: string; name: string } | null>(null);
  const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);


  const [mvContent, setMvContent] = useState<string>('');
  const [mvPreview, setMvPreview] = useState<string>('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!');
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  // Keep currentModel in sync with Redux focus, without causing render loops
  useEffect(() => {
    const focusedId = data?.phFocus?.focusModel?.id;
    const models = data?.phData?.metis?.models || [];

    const next = models.find((m: any) => m.id === focusedId) || null;
    setCurrentModel((prev: typeof currentModel) => (prev?.id === next?.id ? prev : next));
  }, [data?.phData?.metis?.models, data?.phFocus?.focusModel?.id]);

  // Derive curMetamodel only when currentModel or the metamodel list changes
  useEffect(() => {
    if (!currentModel) {
      setCurMetamodel(null);
      return;
    }
    const metamodels = (data?.phData?.metis?.metamodels as { id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] }[]) || [];
    const nextMeta = metamodels.find((mm) => mm.id === currentModel.metamodelRef) || null;
    setCurMetamodel((prev: any) => (prev?.id === nextMeta?.id ? prev : nextMeta));
  }, [currentModel?.metamodelRef, data?.phData?.metis?.metamodels]);

  const handleResponseChange = (response: any) => {
    console.log("Response changed:", response);
  };

  // Initialize current model when metis loads
 useEffect(() => {
    if (!currentModel && metis?.models?.length) {
      const m = metis.models[0];
      setCurrentModel(m);
      dispatch(setFocusModel({ id: m.id, name: m.name }));
    }
    if (currentModel && !curModelview && currentModel.modelviews?.length) {
      const mv = currentModel.modelviews[0];
      setCurModelview(mv);
      setFocusModelview(mv ? { id: mv.id, name: mv.name } : null);
    }
  }, [metis, currentModel, curModelview, dispatch]);

  useEffect(() => {
    if (currentModel && focusModelview) {
      const mv = currentModel.modelviews?.find((v: any) => v.id === focusModelview.id) || null;
      console.log("100 Setting current modelview to:", mv);
      setCurModelview(mv);
    } else {
      const mv = currentModel?.modelviews[0];
      setCurModelview(mv);
    }
  }, [currentModel, focusModelview]);

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
  const handleViewInPreview = (response: string) => {
    const cleanResponse = (response: string) => {
      ''
      const cleaned = response.trim();
      // Add IRTV-specific cleaning logic here
      return cleaned;
    };
    const cleanedResponse = cleanResponse(response);
    setMvPreview(cleanedResponse);
    setShowRightPanel(true);
  };

  // File handling
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file import logic
  };

  const handleAddContent = (content: string) => {
    setMvContent(content);
  };

  const handleExportLibrary = () => {
    // Handle library export logic
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = data.phData.metis.models.find(model => model.name === event.target.value);
    setCurrentModel(selectedModel || null);
    setFocusModelLocal(selectedModel || null);
    setFocusModelview(selectedModel?.modelviews[0] || null);
    if (selectedModel) {
      dispatch(setFocusModel({ id: selectedModel.id, name: selectedModel.name }));
    }
  };


  const leftPanelContent = {
    tabs: [
      {
        key: 'suite',
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
      },
    ],
    defaultTab: 'suite'
  };

  const middlePanelContent = {
    tabs: [
      {
        key: 'modelviewChat',
        label: 'AI Modelview Chat',
        content: (
          <div className="flex flex-col gap-2">
            <ModelviewBuilder
              input={mdContent}
              setInput={setMdContent}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onResponseChange={handleResponseChange}
              onViewInMarkdown={handleViewInMarkdown}
              onViewInPreview={handleViewInPreview}
              setShowLeftPanel={setShowLeftPanel}
              onAddContent={handleAddContent}
              mvContent={mvContent ?? ''}
              setMvContent={setMvContent}
              mvPreview={mvPreview}
              setMvPreview={setMvPreview}
              setCurrentMessages={setCurrentMessages}
              startupGuide={<GettingStartedGuide />}
              guide={<Guide />}
            />
          </div>
        )
      },
      {
        key: 'previewModelview',
        label: 'Modelview Preview',
        content: (
          <OutputPanel
            mvPreview={mvPreview}
            setMvPreview={setMvPreview}
            mvContent={mvContent}
            setMvContent={setMvContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType='right'
          />
        )
      },
      {
        key: 'suite',
        label: 'Modelview',
        content: (
          <div className="text-xs w-full">
            {curModelview && (
              <ModelviewCard
                // ModelviewCard expects a single `modelview` prop, not `modelviews`
                modelview={{
                  name: curModelview.name || 'Default View',
                  description: curModelview.description || '',
                  objectviews: curModelview.objectviews || [],
                  relshipviews: curModelview.relshipviews || []
                } as any}
              />
            )}
          </div>
        )
      },
      {
        key: 'mimris',
        label: (
          <span className="inline-flex items-center gap-1">
            <Package className="w-4 h-4" />
            Mimris
            {/* {model?.name || 'Mimris'} */}
          </span>
        ),
        content: (
          <div className="w-full h-screen m-0 p-0">
            <iframe
              style={{ height: "100%", width: "100%" }}
              ref={iframeRef}
              src="https://mimris.vercel.app/modelling"
              // src="http://localhost:3000/modelling"
              className="w-full h-full border-none rounded"
              title="Embedded Mimris Modeller"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )
      },
    ],
    defaultTab: 'modelviewChat'
  };

  const rightPanelContent = {
    tabs: [
      {
        key: 'previewModelview',
        label: 'Modelview Preview',
        content: (
          <OutputPanel
            mvPreview={mvPreview}
            setMvPreview={setMvPreview}
            mvContent={mvContent}
            setMvContent={setMvContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType='right'
          />
        )
      },
      {
        key: 'previewModelview2',
        label: 'Preview Modelview',
        content: (
          <div className="space-y-4">
            {mvPreview?.length ? (
              <ObjectviewCard modelview={mvPreview as any} />
            ) : (
              <div className="text-sm text-gray-400 p-2">No previewmodelview yet.</div>
            )}
          </div>
        )
      },
    ],
    defaultTab: 'previewModelview'
  };

  const handleModelSelectByName = (modelName: string) => {
    const selectedModel = data.phData.metis.models.find((m: any) => m.name === modelName) || null;
    setCurrentModel(selectedModel);
    setFocusModelLocal(selectedModel ? { id: selectedModel.id, name: selectedModel.name } : null);
    setFocusModelview(selectedModel?.modelviews?.[0] || null);
    if (selectedModel) {
      dispatch(setFocusModel({ id: selectedModel.id, name: selectedModel.name }));
    }
  };

  const handleModelviewSelectById = (modelviewId: string | null) => {
    if (!currentModel) {
      setFocusModelview(null);
      return;
    }
    const mv = currentModel.modelviews?.find((v: any) => v.id === modelviewId) || null;
    setFocusModelview(mv ? { id: mv.id, name: mv.name } : null);
    // If you want to propagate to Redux or other slices, do it here.
  };

  const modelSelector = (
    <ModelSuiteSelector
      metis={metis}
      currentModel={currentModel}
      curMetamodel={curMetamodel}
      currentModelviewId={focusModelview?.id ?? null}
      onModelSelect={handleModelSelectByName}
      onModelviewSelect={handleModelviewSelectById}
    />
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

      {/* Library Modal */}
      {isLibraryOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50"
          onClick={() => setIsLibraryOpen(false)}
        >
          <div
            className="bg-background rounded-lg p-4 w-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-400">IRTV Document Library</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportLibrary}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                  disabled={!documents || documents.length === 0}
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
              </div>
            </div>
            {/* Add library content here */}
          </div>
        </div>
      )}
    </div>
  );
}
