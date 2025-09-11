// src/features/model/components/ModelComponent.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, List, Network, Package } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingCircularProgress } from "@/components/loading";



// import { Button } from '@/components/ui/button';
import { handleSaveToLocalFile } from './HandleSaveToLocalFile';
// import { handleGetFile } from './HandleGetFile.ts.bak';
import { handleGetLocalFile } from './HandleGetLocalFile';
// import { handleGetLocalFileClick } from './HandleGetLocalFileClick';
// import { handleSaveToGithub } from './HandleSaveToGithub.ts.bak';
// Add these imports to the existing import from '../modelSlice' (around line 25):

import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo } from '../modelSlice';
import { handleGetDefaultFile } from './HandleGetDefaultFile';

import Header from '@/components/Header'

import { ObjectCard } from '@/components/object-card';
import { OntologyCard } from '@/components/ontology-card';
import { ModelviewCard } from '@/components/modelview-card'; // Adjust path as needed
import { Model } from '@/features/model-universe/modelSlice';


type ModelView = {
  id: string;
  name: string;
};
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

// import { set } from 'zod';
// import { handleClearStore } from './HandleClearStore';


function ModelComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.modelUniverse);
  const prompt = useSelector((state: { prompt: any }) => data.phData.domain?.prompt);
  const domainData = useSelector((state: { modelUniverse: any }) => data.phData.domain);
  const ontologyData = useSelector((state: { modelUniverse: any }) => data.phData.domain?.ontology);

  const [currentOntology, setCurrentOntology] = useState<any>(data.phData?.domain?.ontology || null);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [currentModelview, setCurrentModelview] = useState<ModelView | null>(null);
  const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);

  const [focusModel, setFocusModel] = useState<{ id: string; name: string } | null>(null);
  const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);
  const [focusObject, setFocusObject] = useState<{ id: string; name: string } | null>(null);
  const [focusObjectview, setFocusObjectview] = useState<{ id: string; name: string } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'failed'>('idle');
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState(null);

  const [metis, setMetis] = useState<any>(null);

  // const [focusRelationship, setFocusRelationship] = useState<any>(null);
  // const [focusRelationshipview, setFocusRelationshipview] = useState<any>(null);


  const [showModel, setShowModel] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState('model-summary');
  const [activeTab, setActiveTab] = useState('model-summary');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);

  // const [detailsOpen, setDetailsOpen] = useState(false);
  console.log('49 ModelComponent:', data);


  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!data.phData) {
      handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
    }
  }, [data.phData, dispatch]);

  useEffect(() => {
    if (data.phFocus) {
      setFocusModel(data.phFocus.focusModel);
      setFocusModelview(data.phFocus.focusModelview);
      setMetis(data.phData.metis);
      setCurrentModel(data.phData.metis?.models?.find(model => model.id === focusModel?.id) || null);
      setCurrentModelview((currentModel?.modelviews.find((mv: { id: string }) => mv.id === focusModelview?.id) as ModelView) || null);
    }
  }, [data.phFocus, data.phData.metis, focusModel?.id, focusModelview?.id, currentModel?.modelviews]);

  // Helper to update project info while avoiding strict payload type errors for extra fields (org, repo, path, file, branch, username)
  const handleProjChange = (patch: Record<string, any>) => {
    dispatch(updateProjectInfo(patch as any));
  };

  return (
    <div className="h-full bg-background text-gray-100">
      {data
        ?
        // <Card className="p-0 m-0 max-h-[calc(100vh-8px)] overflow-hidden">
        <Tabs defaultValue="model-summary" value={activeTab} onValueChange={setActiveTab} className="flex flex-col my-0 h-full">
          {/* <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="m-1"> */}

          <TabsList className="grid w-full grid-cols-3 max-w-lg my-0 h-7 mx-2 relative z-20">
            <TabsTrigger
              value="model-summary"
              className="flex items-center gap-2 group-data-[state=active]:bg-blue-600/20 group-data-[state=active]:text-blue-400"
            >
              Model Suite Summary
            </TabsTrigger>
            <TabsTrigger
              value="model-list"
              className="flex items-center gap-2 group-data-[state=active]:bg-purple-600/20 group-data-[state=active]:text-purple-400"
            >
              <List className="w-4 h-4" />
              Model list
            </TabsTrigger>
            <TabsTrigger
              value="model-objects"
              className="flex items-center gap-2 group-data-[state=active]:bg-blue-600/20 group-data-[state=active]:text-blue-400"
            >
              <Package className="w-4 h-4" />
              Current Model
            </TabsTrigger>
          </TabsList>

          <TabsContent value="model-summary" className="m-0 px-1 py-2 rounded bg-background text-gray-200 text-xs">
            <div className="m-1 py-1 rounded">
              <div className="">
                {data && data.phData && data.phData.metis && data.phData.metis.models && (
                  // Replace the section from line 262-317 with this editable version:
                  <div className="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <h4 className="text-gray-400 font-bold">Model Suite:</h4>
                    <div className="p-2 mb-1 rounded">
                      <h5 className="text-gray-400 font-bold">Name</h5>
                      <input
                        type="text"
                        value={data.phData.metis.name}
                        onChange={(e) => dispatch(updateMetisInfo({
                          name: e.target.value,
                          description: data.phData.metis.description
                        }))}
                        className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full"
                      />
                      <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                      <textarea
                        value={data.phData.metis.description}
                        onChange={(e) => dispatch(updateMetisInfo({
                          name: data.phData.metis.name,
                          description: e.target.value
                        }))}
                        className="bg-background p-1 border border-gray-500 rounded w-full resize-vertical"
                        rows={4}
                      />
                    </div>
                    <div className="flex flex-wrap">
                      <div className="px-4 col text-left w-2/3">
                        <h4 className="px-1 mb-1 text-gray-400 font-bold">Models:</h4>
                        <div className="border border-gray-600 p-1 max-h-[calc(100vh-23rem)] overflow-y-auto">
                          {data.phData.metis.models.map((model: any, index: number) => (
                            <div key={model.id} className="flex flex-col border border-gray-500 p-1 mb-1 last:border-b-0">
                              <h5 className="text-gray-400 font-bold">Name</h5>
                              <div className="bg-background p-2 flex items-center">
                                <span className="text-gray-400 mr-2">{index}:</span>
                                <input
                                  type="text"
                                  value={model.name}
                                  onChange={(e) => dispatch(updateModelInfo({
                                    id: model.id,
                                    name: e.target.value,
                                    description: model.description
                                  }))}
                                  className="bg-transparent border border-gray-500 rounded px-2 py-1 flex-1"
                                />
                              </div>
                              <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                              <div className="bg-background p-2">
                                <textarea
                                  value={model.description}
                                  onChange={(e) => dispatch(updateModelInfo({
                                    id: model.id,
                                    name: model.name,
                                    description: e.target.value
                                  }))}
                                  className="bg-transparent border border-gray-500 rounded px-2 py-1 w-full resize-vertical"
                                  rows={4}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-2 col text-left mb-4 w-1/3">
                        <div className="col text-left">
                          <h4 className="px-1 text-gray-400 font-bold mb-1">GitHub Repository:</h4>
                          <div className="border border-gray-600 p-2">
                            {data.phFocus && 'focusProj' in data.phFocus ? (
                              <>
                                <h5 className="text-gray-400 font-bold px-1">id</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.id || ''}
                                  onChange={(e) => dispatch(updateProjectInfo({ id: e.target.value }))}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">proj.no.</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.projectNumber || ''}
                                  readOnly
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">name</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.name || ''}
                                  onChange={(e) => handleProjChange({ name: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">org</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.org || ''}
                                  onChange={(e) => handleProjChange({ org: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.repo || ''}
                                  onChange={(e) => handleProjChange({ repo: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">path</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.path || ''}
                                  onChange={(e) => handleProjChange({ path: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">file</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.file || ''}
                                  onChange={(e) => handleProjChange({ file: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">branch</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.branch || ''}
                                  onChange={(e) => handleProjChange({ branch: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                                <h5 className="text-gray-400 font-bold px-1">username</h5>
                                <input
                                  type="text"
                                  value={(data.phFocus as any).focusProj?.username || ''}
                                  onChange={(e) => handleProjChange({ username: e.target.value })}
                                  className="font-bold whitespace-nowrap bg-background p-1 border border-gray-500 rounded w-full mb-2"
                                />
                              </>
                            ) : (
                              <p className="text-gray-400">No project information available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="model-list" className="flex-1 overflow-auto mt-0">
            <div className="h-full">
              {data.phData?.metis?.models?.length > 0 ? (
                <div className="grid gap-4">
                  {data.phData.metis.models.map((model, index) => (
                    <div key={model.id || index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-2">
                      <h3 className="text-lg font-medium text-white mb-2">
                        {model.name || `Model ${index + 1}`}
                      </h3>
                      <p className="text-gray-300 text-sm mb-3">
                        {model.description || 'No description provided'}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400">Objects:</span>
                          <span className="text-white ml-2">
                            {model.objects?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Relationships:</span>
                          <span className="text-white ml-2">
                            {model.relships?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Model Views:</span>
                          <span className="text-white ml-2">
                            {model.modelviews?.length || 0}
                          </span>
                        </div>
                      </div>
                      {data.phFocus?.focusModel?.id === model.id && (
                        <div className="mt-2 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                          Currently focused model
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No models in suite yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Use the Model Builder to create your first model
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="model-objects" className="my-0 px-1 py-2 rounded bg-background  overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 text-gray-200">
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
          </TabsContent>
        </Tabs>
        // </Card>
        : <div className="flex justify-center items-center h-screen">
          <LoadingCircularProgress />
        </div>
      }
    </div>
  );
}

export default ModelComponent;
