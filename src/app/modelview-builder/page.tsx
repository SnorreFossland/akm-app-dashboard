"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Network, Package } from 'lucide-react';

import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ModelComponent from '@/features/model-universe/components/ModelComponent';
import ModelviewBuilder from '@/components/modelview-bilder/ModelviewBuilder';
import { ModelviewCard } from '@/components/modelview-card';
import { FileOperations } from '@/components/FileOperations';
import { setFocusModel } from '@/features/model-universe/modelSlice';
import { ObjectCard } from '@/components/object-card';
import OutputPanel from '@/components/modelview-bilder/OutputPanel';
import GettingStartedGuide from '@/components/modelview-bilder/GettingStartedGuide';
import Guide from '@/components/modelview-bilder/Guide';

export default function ModelviewBuilderPage() {
  const data = useSelector((state: RootState) => state.modelUniverse);
  const metis = useSelector((state: { modelUniverse: any }) => data.phData.metis);
  const domain = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const dispatch = useDispatch();
  const iframeRef = useRef<HTMLIFrameElement>(null);


  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>(domain.description);

  const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
  // const [metis, setMetis] = useState<Metis | null >(null);
  const [model, setModel] = useState<{ id?: string; name?: string; description?: string; objects?: any[]; relships?: any[] } | null>(null);
  const [curmod, setCurmod] = useState<Model | null>(null);
  const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);

  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);

  const [focusModelLocal, setFocusModelLocal] = useState<{ id: string; name: string } | null>(null);
  const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);

  const [contextItems, setContextItems] = useState("");
  const [mvContent, setMvContent] = useState<string>('');
  const [mvPreview, setMvPreview] = useState<string>('');
  const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!');
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  useEffect(() => {
    setCurrentModel(data?.phData?.metis?.models.find(model => model.id === data.phFocus?.focusModel?.id) || null);
    currentModel && setModel(currentModel);
    setCurMetamodel((data?.phData?.metis?.metamodels as { id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] }[]).find(metamodel => metamodel.id === currentModel?.metamodelRef) || null);
  });

  const handleResponseChange = (response: any) => {
    console.log("Response changed:", response);
  };

  // Initialize current model when metis loads
  // React.useEffect(() => {
  //   if (!currentModel && metis?.models?.length) {
  //     const m = metis.models[0];
  //     setCurrentModel(m);
  //     dispatch(setFocusModel({ id: m.id, name: m.name }));
  //   }
  // }, [metis, currentModel, dispatch]);

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
              mvContent={mvContent}
              // mvContent={typeof mvContent === 'string' ? mvContent : ''}
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
        key: 'suite',
        label: 'Model',
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
        key: 'preview',
        label: 'Modelview Preview',
        content: (
          <div className="max-h-[calc(100vh-14rem)] overflow-auto">
            {currentModel?.modelviews?.length ? (
              <ModelviewCard modelviews={currentModel.modelviews} />
            ) : (
              <div className="p-4 text-sm text-gray-400">No modelviews available for the selected model.</div>
            )}
          </div>
        )
      },
      {
        key: 'previewModel',
        label: 'Model Preview',
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
      }
    ],
    defaultTab: 'preview'
  };

  const modelSelector = (
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
  )

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
