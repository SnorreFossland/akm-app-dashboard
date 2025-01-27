"use client"
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitle, Dialog, DialogContent, DialogFooter, DialogTitle, Button, LoadingCircularProgress, Tabs, TabsContent } from 'your-component-library';

import { ModelviewSchema } from "@/modelviewSchema";
import { ModelviewCard } from '@/components/modelview-card';

const ModelviewBuilder = () => {
    const [data, setData] = useState(null);
    const [curMetamodel, setCurMetamodel] = useState(null);
    const [model, setModel] = useState(null);
    const [modelview, setModelview] = useState(null);
    const [existingInfoObjects, setExistingInfoObjects] = useState({ objects: [], relships: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [dispatchDone, setDispatchDone] = useState(false);
    const [activeTab, setActiveTab] = useState('current-knowledge');
    const [activeSubTab, setActiveSubTab] = useState('model-summary');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showModel, setShowModel] = useState(false);

    useEffect(() => {
        if (data) {
            const irtvmod = models?.find((model: any) => model.metamodelRef === curMetamodel || model.name.includes('IRTV')) || models[0];

            const filteredRelationships = curmod?.relships?.filter((rel: any) => {
                return fromObject?.typeName === 'Information' && toObject?.typeName === 'Information' && rel;
            }) || [];

            setExistingInfoObjects({
                objects: existingObjects?.filter((obj: any) => obj && obj.typeName === 'Information') || [],
                relships: existingRelationships.filter((rel: any) => 
                    existingObjects.some((obj: any) => obj.id === rel.nameFrom || obj.id === rel.nameTo)
                ) || []
            });

            const existInfoConcepts = ({
                concepts: existingInfoObjects.objects.map((obj: any) => ({ name: obj.name, description: obj.description })),
                relships: existingInfoObjects.relships.map((rel: any) => ({ name: rel.name, description: rel.nameFrom + ' ' + rel.nameTo }))
            });

        }
    }, [data, curMetamodel]);

    useEffect(() => {
        setPrintPromptsDiv(
            <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                <DialogTitle>---- System Prompt</DialogTitle>
            </div>
        );
    }, [model]);

    const handleModelviewBuilder = async () => {
        setIsLoading(true);
        setActiveTab('modelview');
        setStep(2);

        const modelviewSystemPrompt = `
  You are a helpful assistant and a highly knowledgeable expert in schematic and diagramming presentation and layout.
  You are tasked with presenting the objects and relationships generated from previous step in a modelview.
  
  The modelview will include objectviews and relshipviews for each object and relationship.
  Give the objectviews and relshipviews id as uuids.
  
  You will place the objectviews in the modelview using the "loc" attribute with x and y coordinates as string with format "x y".
  Make room between the objects to show the relationships clearly.
  Align the objects horizontally and vertically to make the modelview look good.
  Make space both horizontally (x distance more than 100) and vertically (y distance more than 20) between the objectviews to show the relationships clearly.
  
  Position all Roles in a column to the left.
  Next on the right put the Tasks.
  Next to the right of the Tasks put the Views.
  Finally, to the right of the Views put the Information objects.
  
  Make sure to also give horizontal and vertical space between the objects to make the modelview look good.
      `;
        const modelviewUserPrompt = ` 
  Your first and primary objective is to generate a modelview with all the objects and relationships from the previous step.
  Next, you will create objectviews and relshipviews for each object and relationship.
  You will also create Roles, Tasks, and Views based on the concepts.
  Position all objectviews with enough space between them to show the relationships clearly.
  Make horizontal and vertical space between the objects to make the modelview look good.
      `;

        const modelviewContextItems = `
  ## Context:
    **Objects and Relationships:**
    ${model?.objects.map((obj: any) => `- ${obj.id} ${obj.name} ${obj.description}`).join('\n')} 
    ${model?.relships.map((rel: any) => `- ${rel.id} ${rel.name} ${rel.nameFrom} ${rel.nameTo}`).join('\n')}
      `;

        try {
            const res = await fetch("/api/genmodel", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schemaName: 'ModelviewSchema',
                    aiModelName: "gpt-4o-2024-08-06",
                    systemPrompt: modelviewSystemPrompt || "",
                    systemBehaviorGuidelines: "",
                    userPrompt: modelviewUserPrompt || "",
                    userInput: modelviewUserInput || "",
                    contextItems: modelviewContextItems || "",
                    contextOntology: modelviewContextOntology || "",
                    contextMetamodel: modelviewContextMetamodel || ""
                })
            });

            if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let data = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                data += decoder.decode(value, { stream: true });
            }

            const parsed = JSON.parse(data);
            const validatedData = ModelviewSchema.parse(parsed);
            setNewModelview(validatedData);
            setStep(4);
        } catch (e) {
            console.error("Validation failed:", e instanceof Error ? e.message : e);
        }

        setIsLoading(false);
    }


    return (
        <div className="flex h-[calc(100vh-5rem)] w-full">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <div className="m-1 mb-5">
                    <details>
                        <summary>
                            <FontAwesomeIcon icon={faQuestionCircle} width="16" height="16" /> IRTV Model
                        </summary>
                        <div className="bg-gray-600 p-2">
                            <p>This process involves several key steps, each contributing to the development of a structured and comprehensive model for a given domain.
                                The goal is to build a Model that leverages AI to facilitate the creation and integration of concepts within the domain.
                            </p>
                        </div>
                    </details>
                </div>
                <CardTitle className="flex justify-between items-center flex-grow ps-1">
                    Workspace Modelview Explorer:
                </CardTitle>
                <div className="flex flex-wrap items-start m-1">
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 ${(modelview?.objectviews.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        Workspace Builder (Create IRTV-Modelview):
                        <div className="flex items-center ml-auto">
                            {(isLoading && step === 2) ? (
                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                    <LoadingCircularProgress />
                                </div>
                            ) : null}
                        </div>
                    </CardTitle>
                </div>
                <div className="m-1 mt-auto">
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(dispatchDone) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        <div
                            className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                        >
                            Save to current Model Store
                            <div className="flex items-center ml-auto">
                                {!dispatchDone && step === 3 ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </CardTitle>
                </div>
            </div>

            <div className="border-solid rounded border-4 border-blue-800 h-full w-full">
                {data ? (
                    <Card className="p-1">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background">
                                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="bg-gray-700 mx-1 px-1 mt-0">
                                    <TabsContent value="model-summary" className="m-0 px-1 py-2 rounded bg-background text-gray-200">
                                        <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                            <div className="">
                                                {data && data.phData && data.phData.metis && data.phData.metis.models && (
                                                    <>
                                                        <div className="flex justify-left items-center py-2 text-left">
                                                            <h4 className="px-2 text-gray-400 font-bold">AKM File</h4>
                                                        </div>
                                                        <div className="flex flex-wrap">
                                                            <div className="px-4 col text-left w-2/3">
                                                                <h4 className="px-1 text-gray-400 font-bold">Models:</h4>
                                                                <div className="border border-gray-600 p-2">
                                                                    {data.phData.metis.models.map((model: any, index) => (
                                                                        <div key={model.id} className="flex flex-col">
                                                                            <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                                                            <hr className="my-1" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>

                            <TabsContent value="model" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                {showModel && model && (
                                    <>
                                        <div className="flex justify-end pb-1 pt-0 mx-2">
                                            <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs hover:bg-blue-700">
                                                Show Prompt
                                            </button>
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                            <TabsContent value="modelview" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                <>
                                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                        <DialogContent className="max-w-5xl">
                                            <DialogFooter>
                                                <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                                                    Close
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </>
                            </TabsContent>
                        </Tabs>
                    </Card>
                ) : null}
            </div>
        </div>
    );
};

export default ModelviewBuilder;