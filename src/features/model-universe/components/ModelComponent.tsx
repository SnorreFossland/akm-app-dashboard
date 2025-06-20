// src/features/model/components/ModelComponent.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { clearStore, clearModel } from '../modelSlice';
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


// import { set } from 'zod';
// import { handleClearStore } from './HandleClearStore';


function ModelComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.modelUniverse);
  const [currentOntology, setCurrentOntology] = useState<any>(data.phData?.ontology || null);
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

  const [activeSubTab, setActiveSubTab] = useState('domain-concepts');
  const [activeTab, setActiveTab] = useState('current-knowledge');
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
      // setFocusObject(data.phFocus.focusObject);
      // setFocusObjectview(data.phFocus.focusObjectview);
      // setFocusRelationship(data.phFocus.focusRelship);
      // setFocusRelationshipview(data.phFocus.focusRelshipview);
      // }
      // if (data.phData.metis) {
      setMetis(data.phData.metis);
      setCurrentModel(data.phData.metis?.models?.find(model => model.id === focusModel?.id) || null);
      setCurrentModelview(currentModel?.modelviews.find((mv: { id: string }) => mv.id === focusModelview?.id) || null);

    }
  }, [data.phFocus, data.phData.metis, focusModel?.id, focusModelview?.id, currentModel?.modelviews]);



  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = data.phData.metis.models.find(model => model.name === event.target.value);
    dispatch({ type: 'modelUniverse/setFocusModel', payload: selectedModel });
    setCurrentModel(selectedModel || null);
    setFocusModel(selectedModel || null);
    setFocusModelview(selectedModel?.modelviews[0] || null);
    // if (selectedModel) {
    //   setCurrentModelview(selectedModel.modelviews[0]);
    // }
  };

  const handleModelviewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // const selectedModelview = currentModel.modelviews.find((mv: { name: string }) => mv.name === event.target.value);
    // setCurrentModelview(selectedModelview);
  };

  // if (status === 'loading') return <div>Loading...</div>;
  // if (status === 'failed') return <div>Error: {error}</div>;

  // if (!metis || !currentModel || !currentModelview) return null;

  return (
    <div className='model-universe-a-component w-fullflex flex-col'>
      <Header metisName={data.phSource} />
      {/* <Header metisName={data.phData.metis?.name} /> */}
      <div className="bg-background">
        <div className="flex bg-background justify-center items-center">
          {/* <button
            className="bg-gray-700 text-white rounded m-1 py-0.5 px-2 text-xs"
            onClick={() => handleGetFile(dispatch, setFileStatus, setFileContent)} disabled={fileStatus === 'loading'}>
            {fileStatus === 'loading' ? 'Loading...' : 'Load from GitHub'}
          </button> */}
          {/* <button
            className="bg-gray-700 text-white rounded m-1 py-0.5 px-2 text-xs"
            onClick={() => handleSaveToGithub(dispatch, data, setSaveStatus, setPullRequestUrl)} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : 'Save to GitHub'}
          </button> */}
          <button
            className="bg-blue-800 dark:bg-blue-800 text-gray-100 dark:text-gray-100 border border-blue-700 rounded m-1 py-0 px-2 text-xs hover:bg-blue-700 dark:hover:bg-blue-700"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            Open Local File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleGetLocalFile(e, dispatch)}
          />
          <button
            className="bg-blue-900 dark:bg-blue-900 text-gray-100 dark:text-gray-100 border border-blue-700 rounded m-1 py-0 px-2 text-xs hover:bg-blue-700 dark:hover:bg-blue-700"
            onClick={() => {
              handleSaveToLocalFile(data);
            }}
          >
            Save Local File
          </button>
          <button
            className="bg-red-900 dark:bg-red-900 text-gray-100 dark:text-gray-100 border-red-700 rounded m-1 py-0 px-2 text-xs hover:bg-red-700 dark:hover:bg-red-700 hover:border-red-400"
            onClick={() => {
              dispatch(clearModel(currentModel));
            }}
          >
            Clear Model
          </button>
          <button
            className="bg-red-900 dark:bg-red-900 text-gray-100 dark:text-gray-100 border-red-700 rounded m-1 py-0 px-2 text-xs hover:bg-red-700 dark:hover:bg-red-700 hover:border-red-400"
            onClick={() => {
              dispatch(clearStore());
              handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
            }}
          >
            Clear Store
          </button>

        </div>
        <div className="flex justify-between bg-gray-600 p-1">
          <div className=" px-1 bg-background">
            <label htmlFor="model-select" className="mx-1 font-bold text-gray-400 inline-block">Current Model:</label>
            <select id="model-select" className="px-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={handleModelChange} value={currentModel?.name}>
              {metis?.models.map((model: { name: string }) => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-background">
            <label htmlFor="model-view-select" className="mx-2 font-bold text-gray-400 inline-block">Model View:</label>
            <select id="model-view-select" className="px-2 py-0 inline-block text-gray-400 inline-block" onChange={handleModelviewChange} value={currentModelview?.name}>
              {currentModel?.modelviews?.map((modelView: ModelView) => (
                <option key={modelView.id} value={modelView.name}>{modelView.name}</option>
              ))}
            </select>
          </div>
          <h3 className="flex mx-1 pl-1 font-bold  bg-gray-700 text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length}</span></h3>
        </div>

      </div>
      <div className="flex bg-background flex-1 overflow-hidden">
        <div className=" w-full overflow-y-auto">
          <div className="pt-1 w-full h-full">
            {data
              ? <Card className="p-0 m-0 max-h-[calc(100vh-80px)] overflow-hidden">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="m-1">
                  <TabsList className="m-1 mb-0 bg-transparent rounded-t-md flex space-x-1">
                    <TabsTrigger
                      value="domain-concepts"
                      className={` mt-3 rounded-t-md ${activeSubTab === "domain-concepts" ? " rounded-tl-md rounded-tr-md bg-gray-800 text-gray-800" : ""
                        }`}
                    >
                      Domain
                    </TabsTrigger>
                    <TabsTrigger
                      value="model-summary"
                      className={` mt-3 rounded-t-md ${activeSubTab === "model-summary" ? " rounded-tl-md rounded-tr-md bg-gray-800 text-gray-800" : ""
                        }`}
                    >
                      Model Suite Summary
                    </TabsTrigger>
                    <TabsTrigger
                      value="model-objects"
                      className={`pb-2 mt-3  ${activeSubTab === "model-objects" ? "bg-gray-300 text-gray-800" : ""
                        }`}
                    >
                      Current Model
                    </TabsTrigger>
                    <TabsTrigger
                      value="model-modelviews"
                      className={`pb-2 mt-3 rounded-tl-md rounded-tr-md ${activeSubTab === "model-modelviews" ? "bg-gray-300 text-gray-800" : ""
                        }`}
                    >
                      Current Modelview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="domain-concepts" className="m-0 px-1 py-2 h-full rounded bg-background text-gray-200">
                    {data && data.phData && data.phData.domain && (
                      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        {/* <h4 className="px-1 text-gray-400 font-bold">Concepts:</h4> */}
                        <div className=" ">
                          <OntologyCard ontologyData={currentOntology} />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="model-summary" className="m-0 px-1 py-2 rounded bg-background text-gray-200">
                    <div className="m-1 py-1 rounded">
                      <div className="">
                        {data && data.phData && data.phData.metis && data.phData.metis.models && (
                          <div className="max-h-[calc(100vh-40rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                            <div className="flex flex-wrap">
                              <div className="px-2 col text-left mb-4 w-1/3">
                                <h4 className="text-gray-400 font-bold">Model Suite:</h4>
                                <div className="border border-gray-600 p-2">
                                  <h5 className="text-gray-400 font-bold">Name</h5>
                                  <h4 className="font-bold whitespace-nowrap bg-background p-1">{data.phData.metis.name}</h4>
                                  <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                  <h4 className=" bg-background p-1">{data.phData.metis.description}</h4>
                                </div>
                                <div className="col text-left">
                                  <h4 className="text-gray-400 font-bold">Repository:</h4>
                                  <div className="border border-gray-600 p-2">
                                    {data.phFocus && 'focusProj' in data.phFocus ? (
                                      <>
                                        <h5 className="text-gray-400 font-bold px-1">id</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.id}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">proj.no.</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.projectNumber}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">name</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.name}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.org}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.repo}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">path</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.path}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">file</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.file}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">branch</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.branch}</h5>
                                        <h5 className="text-gray-400 font-bold px-1">username</h5>
                                        <h5 className="font-bold whitespace-nowrap bg-background p-1">{(data.phFocus as any).focusProj?.username}</h5>
                                      </>
                                    ) : (
                                      <p className="text-gray-400">No project information available</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="px-4 col text-left w-2/3">
                                <h4 className="px-1 text-gray-400 font-bold">Models:</h4>
                                <div className="border border-gray-600 p-2">
                                  {data.phData.metis.models.map((model: any, index: number) => (
                                    <div key={model.id} className="flex flex-col">
                                      <h5 className="text-gray-400 font-bold">Name</h5>
                                      <h4 className="bg-background p-2"> <span className="text-gray-400">{index}: </span>{model.name}</h4>
                                      <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                      <h4 className="bg-background p-2">{model.description}</h4>
                                      <hr className="my-1" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
              </Card>
              : <div className="flex justify-center items-center h-screen">
                <LoadingCircularProgress />
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelComponent;