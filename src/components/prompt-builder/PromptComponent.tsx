// src/features/model/components/ModelComponent.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingCircularProgress } from "@/components/loading";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";

import { handleGetDefaultFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';


import { faEdit, faPaperPlane, faTrash, faLink } from "@fortawesome/free-solid-svg-icons";


// import { Button } from '@/components/ui/button';
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
// import { handleGetFile } from './HandleGetFile.ts.bak';
// import { handleGetLocalFileClick } from './HandleGetLocalFileClick';
// import { handleSaveToGithub } from './HandleSaveToGithub.ts.bak';
// Add these imports to the existing import from '../modelSlice' (around line 25):

import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo } from '@/features/model-universe/modelSlice';


import Header from '@/components/Header'

import { PromptCard } from '@/components/prompt-card';
import { ObjectCard } from '@/components/object-card';
import { OntologyCard } from '@/components/ontology-card';
import { Model } from '@/features/model-universe/modelSlice';
import { setDomainData, deleteDomainPrompt } from '@/features/model-universe/modelSlice';


type ModelView = {
  id: string;
  name: string;
};

interface IconButtonProps {
  onClick: () => void;
  icon: any;
  className?: string;
  iconWidth?: string;
  iconSize?: SizeProp;
}



// import { set } from 'zod';
// import { handleClearStore } from './HandleClearStore';


function PromptComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.modelUniverse);
  // Removed the selection of 'markdown' as it is not part of the store
  const prompts = useSelector((state: RootState) => state.modelUniverse.phData.domain.prompt);
  const [currentPrompt, setCurrentPrompt] = useState<any>(prompts || null);
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

  const [editedPrompt, setEditedPrompt] = useState<string>('')
  const [phase, setPhase] = useState("initial");
  const [dispatchDone, setDispatchDone] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [domainInput, setDomainInput] = useState<string>('');

  // const [focusRelationship, setFocusRelationship] = useState<any>(null);
  // const [focusRelationshipview, setFocusRelationshipview] = useState<any>(null);


  const [showModel, setShowModel] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState('domain-concepts');
  const [activeTab, setActiveTab] = useState('current-knowledge');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);

  // const [detailsOpen, setDetailsOpen] = useState(false);
  console.log('97 ModelComponent:', data);


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

  const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
    return (
      <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
        <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
      </Button>
    );
  };

  const handleModelviewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // const selectedModelview = currentModel.modelviews.find((mv: { name: string }) => mv.name === event.target.value);
    // setCurrentModelview(selectedModelview);
  };

  // if (status === 'loading') return <div>Loading...</div>;
  // if (status === 'failed') return <div>Error: {error}</div>;

  // if (!metis || !currentModel || !currentModelview) return null;

  // Dispatch the edited prompt to the Redux store
  const handleDispatchEditedPrompt = () => {
    if (!editedPrompt.trim()) {
      alert("No edited prompt available to dispatch.");
      return;
    }
    console.log("205 Dispatching Edited Prompt:", editedPrompt);

    // Get current domain data
    const currentDomainData = data?.phData?.domain || {};

    // Create updated domain data with new prompt
    const updatedData = {
      ...currentDomainData,
      prompt: editedPrompt
    };

    // Use setDomainData instead of setDomainPrompt
    dispatch(setDomainData(updatedData));
    setDispatchDone(true);
    setEditedPrompt("");
  };

  // Delete the prompt from the Redux store
  const handleDeletePrompt = () => {
    dispatch(deleteDomainPrompt());
    setEditedPrompt("");
    setDomainInput("");
    setPhase("initial");
  };

  // Reusable ActionCardTitleButton component
  interface ActionCardTitleButtonProps {
    title: string;
    done: boolean;
    onClick: () => void;
    icon: any;
  }
  const ActionCardTitleButton: React.FC<ActionCardTitleButtonProps> = ({ title, done, onClick, icon }) => {
    return (
      <CardTitle className="flex justify-center m-1 mb-auto bg-gray-700 border border-gray-500">
        <div className={`flex justify-between items-center flex-grow ps-2 ${done ? "text-green-600" : "text-green-200"}`}>
          {title}
          <div className="flex items-center ml-auto">
            {!done ? (
              <div style={{ marginLeft: 8, marginRight: 8 }}>
                <LoadingCircularProgress />
              </div>
            ) : (
              <div style={{ marginLeft: 8, marginRight: 8, color: done ? "green" : "gray" }}>
                <FontAwesomeIcon icon={faCheckCircle} size="2x" />
              </div>
            )}
            <IconButton onClick={onClick} icon={icon} />
          </div>
        </div>
      </CardTitle>
    );
  };

  return (
    <div className='model-universe-a-component w-full flex flex-col'>
      <div className="flex bg-background flex-1 overflow-hidden">
        <div className=" w-full overflow-y-auto">
          <div className="pt-0 w-full h-full">
            {data
              ? <Card className="p-0 m-0 max-h-[calc(100vh-80px)] overflow-hidden">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="m-1">
                  <TabsList className="m-0 mb-0 bg-transparent rounded-t-md flex space-x-1">
                    <TabsTrigger
                      value="domain-prompts"
                      className={` mt-3 rounded-t-md ${activeSubTab === "domain-prompts" ? " rounded-tl-md rounded-tr-md bg-gray-800 text-gray-800" : ""
                        }`}
                    >
                      Generated Prompts
                    </TabsTrigger>
                    {/* <TabsTrigger
                      value="domain-concepts"
                      className={` mt-3 rounded-t-md ${activeSubTab === "domain-concepts" ? " rounded-tl-md rounded-tr-md bg-gray-800 text-gray-800" : ""
                        }`}
                    >
                      Domain
                    </TabsTrigger> */}

                  </TabsList>
                  <TabsContent value="domain-concepts" className="m-0 px-1 py-2 h-full rounded bg-background text-gray-200">
                    <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                        <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                          <TabsTrigger value="introduction" className="pb-2 mt-3">
                            ...
                          </TabsTrigger>
                          {/* <TabsTrigger value="final-suggested-prompt" className="pb-2 mt-3">
                                    AI Suggested Prompt
                                </TabsTrigger> */}
                          <TabsTrigger value="existing-prompt" className="pb-2 mt-3">
                            Stored Prompt
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="introduction" className="m-0 px-1 py-2 rounded bg-background">

                        </TabsContent>
                        {/* <TabsContent value="final-suggested-prompt" className="m-0 px-1 py-2 rounded bg-background">
                                <div className=" py-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-20rem)]">
                                    <ReactMarkdown className="prose prose-sm p-2 text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full min-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                        {finalPrompt}
                                    </ReactMarkdown>
                                </div>
                                <div className="mb-auto min-w-[50%]">
                                    <DispatchCardTitle
                                        dispatchDone={dispatchDone}
                                        handleDispatchFinalPrompt={handleDispatchFinalPrompt}
                                        extraClassName="float-bottom"
                                    />
                                </div>
                            </TabsContent> */}
                        <TabsContent value="existing-prompt" className="m-0 px-1 py-2 rounded bg-background">
                          <div className="m-2 p-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                            <div className="text-white px-2 bg-gray-900 max-h-[calc(100vh-21rem)] overflow-y-auto">
                              {!editedPrompt ? (
                                <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                  {`${data?.phData?.domain?.prompt || "No prompt in store."}`}
                                </ReactMarkdown>
                              ) : (
                                <Textarea
                                  className="p-2 bg-gray-900 text-lg text-gray-300"
                                  value={editedPrompt}
                                  onChange={(e) => setEditedPrompt(e.target.value)}
                                  rows={20}
                                  placeholder="Edit the stored prompt here..."
                                />
                              )}
                            </div>
                            <div className="flex justify-between bg-gray-700">
                              <IconButton
                                onClick={() => { setEditedPrompt(data?.phData?.domain?.prompt || ""); setPhase("final"); }}
                                icon={faEdit}
                                className="mr-2 w-full"
                              />
                              <IconButton
                                onClick={handleDispatchEditedPrompt}
                                icon={faPaperPlane}
                                className="mr-2 w-full"
                              />
                              <IconButton
                                onClick={handleDeletePrompt}
                                icon={faTrash}
                                className="ml-2 bg-red-700 w-full"
                              />
                            </div>
                            <ActionCardTitleButton
                              title="Next step:  Go to Domain Builder"
                              done={true}
                              onClick={() => window.location.href = "/domain-builder"}
                              icon={faLink}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </Card>
                  </TabsContent>

                  <TabsContent value="domain-prompts" className="m-0 px-1 py-2 h-full rounded bg-background text-gray-200">
                    {data && data.phData && data.phData.domain && (
                      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        {/* <h4 className="px-1 text-gray-400 font-bold">Concepts:</h4> */}
                        <div className=" ">
                          <PromptCard promptData={currentPrompt} />
                        </div>
                      </div>
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

export default PromptComponent;