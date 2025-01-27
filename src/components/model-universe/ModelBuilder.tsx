"use client"
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { LoadingCircularProgress } from '@/components/loading';
import { ObjectSchema } from "@/objectSchema";
import { ObjectCard, Model } from '@/components/object-card';
import { ModelviewSchema } from "@/modelviewSchema";
import { ModelviewCard } from '@/components/modelview-card';
import ReactMarkdown from 'react-markdown';

import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel } from '@/features/model-universe/modelSlice';

import { SystemPrompt, SystemBehaviorGuidelines, ExistingOntology, UserPrompt, UserInput, ExistingContext, MetamodelPrompt } from '@/app/model-universe/prompts';

const debug = false;

const Modelbuilder = () => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suggestedConceptsData, setSuggestedConceptsData] = useState<string>("");
    const [suggestedRoles, setSuggestedRoles] = useState("");
    const [suggestedTasks, setSuggestedTasks] = useState("");
    const [suggestedViews, setSuggestedViews] = useState("");
    const [concepts, setConcepts] = useState("");
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('current-knowledge');
    const [activeSubTab, setActiveSubTab] = useState('model-summary');
    const [showModel, setShowModel] = useState(true);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    const [model, setModel] = useState<Model | null>(null);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [modelview, setModelview] = useState<Modelview | null>(null);
    const [focusMod, setFocusMod] = useState<{ id: any; name: any; } | null>(null);
    const [existingInfoObjects, setExistingInfoObjects] = useState<{ objects: { id: any; name: any; description: any; typeName: any; }[], relships: { id: any; name: any; nameFrom: any; nameTo: any; }[] }>({ objects: [], relships: [] });
    const [existingConcepts, setExistingConcepts] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [userPrompt, setUserPrompt] = useState("");
    const [userInput, setUserInput] = useState("");
    const [contextItems, setContextItems] = useState("");
    const [contextOntology, setContextOntology] = useState("");
    const [contextMetamodel, setContextMetamodel] = useState("");
    const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);
    const [modelviewSystemPrompt, setNewModelviewSystemPrompt] = useState("");
    const [modelviewUserPrompt, setNewModelviewUserPrompt] = useState("");
    const [modelviewUserInput, setNewModelviewUserInput] = useState("");
    const [modelviewContextItems, setNewModelviewContextItems] = useState("");
    const [modelviewContextOntology, setNewModelviewContextOntology] = useState("");
    const [modelviewContextMetamodel, setNewModelviewContextMetamodel] = useState("");

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleDispatchIrtvData = () => {
        console.log('69 HandleDispatch:', dispatchDone, modelview, model);
        if (!model && !modelview) {
            alert('No IRTV to dispatch');
            return;
        }
        if (model) {
            dispatch(setNewModel(model));
        }
        if (modelview) {
            dispatch(setNewModelview([modelview]));
        }
        setDispatchDone(true);
    };

    useEffect(() => {
        if (data) {
            const metis = data.phData?.metis;
            if (!metis) {
                console.error('Data does not contain metis:', data);
                return;
            }

            if (metis?.metamodels) {
                const metamodel = metis.metamodels.find((mmodel) => mmodel.name.includes('IRTV'));
                if (metamodel) {
                    setCurMetamodel(metamodel);
                }
            }

            const filteredObjTypes = curMetamodel?.objecttypes.filter((objtype: any) => 
                objtype.typeName !== 'Element' && 
                objtype.typeName !== 'EntityType' &&
                objtype.typeName !== 'Generic' &&
                objtype.typeName !== 'Label' 
            );

            const filteredRelTypes = curMetamodel?.relshiptypes.filter((reltype: any) => 
                reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Element') && 
                reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'EntityType') &&
                reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Generic') &&
                reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Label') &&
                reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Element') &&
                reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'EntityType') &&
                reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Generic') &&
                reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Label')
            );

            const metatypesString = (curMetamodel) && `**${curMetamodel.name}**\n
                ${filteredObjTypes?.map(objtype => `id: ${objtype.id}, name: ${objtype.name}, typeviewRef: ${objtype.typeviewRef}`).join('\n')}\n\n
                ${filteredRelTypes?.map(reltype => `id: ${reltype.id},name: ${reltype.name}, from: ${reltype.fromobjtypeRef}, to: ${reltype.toobjtypeRef}`).join('\n')}\n\n
                ${curMetamodel.objecttypeviews.map(objtypeview => `${objtypeview.id}, ${objtypeview.name}`).join('\n')}
            `   // TODO: from to use name instead of id, the same for objecttypeviews and typeName instead of typeviewRef
        
            const contextmetatypesString = `## **Metamodel**\n\n ${ metatypesString }`

            if (!debug) console.log('122 metatypesString:', curMetamodel);

            const models = metis.models;
            const irtvmod = models?.find(model => curMetamodel && (model.metamodelRef === curMetamodel.id))//|| model.name.includes('IRTV')));
            if (irtvmod) {
                setCurmod(irtvmod);
                setFocusMod({ id: irtvmod.id, name: irtvmod.name });
            }
            console.log('127 Curmod:', curmod, irtvmod, models);

            const filteredRelationships = curmod?.relships?.filter(rel => {
                const fromObject = curmod?.objects?.find(obj => obj.id === rel.fromobjectRef);
                const toObject = curmod?.objects?.find(obj => obj.id === rel.toobjectRef);
                return fromObject?.typeName === 'Information' && toObject?.typeName === 'Information' && rel;
            }) || [];

            const existingObjects = curmod?.objects?.map(obj => ({ id: obj.id, name: obj.name, description: obj.description, typeName: obj.typeName })) || [];
            const existingRelationships = filteredRelationships?.map(rel => ({ id: rel.id, name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo })) || [];

            setExistingInfoObjects({
                objects: existingObjects?.filter(obj => obj && obj.typeName === 'Information') || [],
                relships: existingRelationships.filter(rel => 
                    existingObjects.some(obj => obj.id === rel.nameFrom || obj.id === rel.nameTo)
                ) || []
            });

            const existInfoConcepts = ({
                concepts: existingInfoObjects.objects.map((obj: any) => ({ name: obj.name, description: obj.description })),
                relships: existingInfoObjects.relships.map((rel: any) => ({ name: rel.name, description: rel.nameFrom + ' ' + rel.nameTo }))
            });

            let conceptString = `**Objects**\n\n ${data.phData.ontology?.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            if (existInfoConcepts.concepts.length > 0) {
                conceptString += `**Objects**\n\n${existInfoConcepts.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
                conceptString += `**Relationships**\n\n${existInfoConcepts.relships.map((r: any) => `- ${r.name} - ${r.description} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
            }
            setExistingConcepts(conceptString);
            setSystemPrompt(SystemPrompt);
            setSystemBehaviorGuidelines(SystemBehaviorGuidelines);
            setContextOntology(ExistingOntology);
            setUserPrompt(UserPrompt);
            setUserInput(UserInput);
            setContextItems((conceptString !== '') ? `${ExistingContext} \n\n ${conceptString}` : "");
            setContextMetamodel(`${MetamodelPrompt} \n\n ${contextmetatypesString}`);
            if (debug) console.log('159 Context Items:', contextmetatypesString);

        } else {
            console.error('Data does not contain data:', data);
        }
    }, [data, curMetamodel]);

    useEffect(() => {
        setPrintPromptsDiv(
            <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                <DialogTitle>---- System Prompt</DialogTitle>
                <ReactMarkdown>{systemPrompt}</ReactMarkdown>
                <DialogTitle>---- System behaviour Guidelines Prompt</DialogTitle>
                <ReactMarkdown>{systemBehaviorGuidelines}</ReactMarkdown>
                <DialogTitle>---- Ontology Prompt</DialogTitle>
                <ReactMarkdown>{contextOntology}</ReactMarkdown>
                <DialogTitle>---- User Prompt</DialogTitle>
                <ReactMarkdown>{userPrompt}</ReactMarkdown>
                <DialogTitle>---- User Input</DialogTitle>
                <ReactMarkdown>{userInput}</ReactMarkdown>
                <DialogTitle>---- Context Prompt</DialogTitle>
                <ReactMarkdown>{contextItems}</ReactMarkdown>
                <DialogTitle>---- Metamodel Prompt</DialogTitle>
                <ReactMarkdown>{contextMetamodel}</ReactMarkdown>
            </div>
        );
    }, [model]);

    const handleModelBuilder = async () => {
        setIsLoading(true);
        setStep(1);
        setActiveTab('model');

        try {
            const res = await fetch("/api/genmodel", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiModelName: "gpt-4o-2024-08-06",
                    schemaName: 'ObjectSchema',
                    systemPrompt: systemPrompt || "",
                    systemBehaviorGuidelines: systemBehaviorGuidelines || "",
                    userPrompt: userPrompt || "",
                    userInput: userInput || "",
                    contextItems: contextItems || "",
                    contextOntology: contextOntology || "",
                    contextMetamodel: contextMetamodel || ""
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

            // Add a check to ensure the JSON is complete
            try {
                const parsed = JSON.parse(data);
                const validatedData = ObjectSchema.parse(parsed);
                setModel({ ...validatedData, id: curmod?.id });
                setStep(3);
            } catch (parseError) {
                console.error("JSON Parsing Error:", parseError);
                alert("Received malformed data from the server. Please try again.");
            }
        } catch (e) {
            console.error("Validation failed:", e instanceof Error ? e.message : e);
            alert("An error occurred while generating the model. Please check the console for details.");
        }

        setIsLoading(false);
        setStep(3);
    };


    return (
        <div className="flex  h-[calc(100vh-5rem)] w-full">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <div className="m-1 mb-5">
                    <details>
                        <summary>
                            <FontAwesomeIcon icon={faQuestionCircle} width="16" height="16" /> IRTV Model
                        </summary>
                        <div className="bg-gray-600 p-2">
                            <p>Build a Concept Model assisted by AI</p>
                            <p>This process involves several key steps, each contributing to the development of a structured and comprehensive model for a given domain.
                                The goal is to build a  Model that leverages AI to facilitate the creation and integration of concepts within the domain.
                            </p>
                            <p><strong>Establish the Concept Ontology (Conceptual Framework) for the Domain:</strong></p>
                            <p style={{ marginLeft: '20px' }}>The Concept Ontology refers to the foundational structure that defines the essential concepts, theories, models, and frameworks within a specific domain or field. It serves as a shared vocabulary that enables clear communication and collaboration among practitioners. This ontology includes:
                                It encompasses the concepts, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                            <ul>
                                <li><strong>• Core Concepts: </strong>Fundamental ideas and categories that are central to the domain.</li>
                                <li><strong>• Principles and Theories: </strong>The underlying rules and logical structures that guide the domain’s knowledge and practices.</li>
                                <li><strong>• Relationships: </strong>The connections and interactions between concepts that help explain how they relate to one another.</li>
                            </ul>
                            <p style={{ marginLeft: '20px' }}>By establishing this ontology, you create a well-organized framework that supports knowledge sharing, problem-solving, and further advancement within the field.</p>
                        </div>
                    </details>
                </div>
                <CardTitle className="flex justify-between items-center flex-grow ps-1">
                    Model Explorer:
                </CardTitle>
                <div className="flex flex-wrap items-start m-1">
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 ${(model?.objects?.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        Model Builder (Create Concept IRTV-Model):
                        <div className="flex items-center ml-auto">
                            {(isLoading && step === 2) ? (
                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                    <LoadingCircularProgress />
                                </div>
                            ) : (
                                <div style={{ marginLeft: 8, marginRight: 8, color: model?.objects?.length > 0 ? 'green' : 'gray' }}>
                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                </div>
                            )}
                            <Button onClick={async () => {
                                await handleModelBuilder();
                                setActiveTab('model');
                            }}
                                className={`rounded text-xl p-4 ${(model?.objects?.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                            >
                                <FontAwesomeIcon icon={faRobot} size="1x" />
                            </Button>
                        </div>
                    </CardTitle>

                    {/* <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 ${(modelview?.objectviews.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        Workspace Builder (Create IRTV-Modelview):
                        <div className="flex items-center ml-auto">
                            {(isLoading && step === 2) ? (
                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                    <LoadingCircularProgress />
                                </div>
                            ) : (
                                <div style={{ marginLeft: 8, marginRight: 8, color: modelview?.objectviews.length > 0 ? 'green' : 'gray' }}>
                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                </div>
                            )}
                            <Button onClick={async () => {
                                await handleModelviewBuilder();
                                setActiveTab('modelview');
                            }}
                                className={`rounded text-xl p-4 ${(modelview?.objectviews.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                            >
                                <FontAwesomeIcon icon={faRobot} size="1x" />
                            </Button>
                        </div>
                    </CardTitle> */}
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
                                {!dispatchDone && step ===3 ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                    </div>
                                )}
                                <Button
                                    onClick={() => {
                                        handleDispatchIrtvData();
                                    }}
                                    className={`rounded text-xl ${dispatchDone ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
                                    <FontAwesomeIcon icon={faPaperPlane} width="26px" size="1x" />
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                </div>
            </div>

            <div className="border-solid rounded border-4 border-blue-800 h-full w-full">
                {data
                    ? <Card className="p-1">
                        <CardTitle className="flex justify-center text-white m-1">Active Knowledge Canvas (IRTV)</CardTitle>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="m-1 mb-0 bg-transparent">
                                <TabsTrigger value="current-knowledge" className='pb-2 mt-3'>Current Knowledge</TabsTrigger>
                                <TabsTrigger value="model" className='pb-2 mt-3'>GPT Suggested Model</TabsTrigger>
                                <TabsTrigger value="modelview" className='pb-2 mt-3'>GPT Suggested Modelview</TabsTrigger>
                            </TabsList>

                            <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background">
                                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="bg-gray-700 mx-1 px-1 mt-0">
                                    <TabsList className=" mb-0 bg-gray-700 mt-0">
                                        <TabsTrigger value="model-summary" className='pb-2 mt-3'>Current Model Summary</TabsTrigger>
                                        <TabsTrigger value="model-objects" className='pb-2 mt-3'>Current Model</TabsTrigger>
                                        <TabsTrigger value="model-modelviews" className='pb-2 mt-3'>Current Modelview</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="model-summary" className="m-0 px-1 py-2 rounded bg-background text-gray-200">
                                        <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                            <div className="">
                                                {data && data.phData && data.phData.metis && data.phData.metis.models && (
                                                    <>
                                                        <div className="flex justify-left items-center py-2 text-left">
                                                            <h4 className="px-2 text-gray-400 font-bold">AKM File</h4>
                                                            <h4 className="px-2 mb-1 font-bold whitespace-nowrap bg-gray-700">{data.phSource}.json</h4>
                                                        </div>
                                                        <div className="flex flex-wrap">
                                                            <div className="px-2 col text-left mb-4 w-1/3">
                                                                <h4 className="text-gray-400 font-bold">Model Suite:</h4>
                                                                <div className="border border-gray-600 p-2">
                                                                    <h5 className="text-gray-400 font-bold">Name</h5>
                                                                    <h4 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phData.metis.name}</h4>
                                                                    <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                                                    <h4 className=" bg-gray-800 p-1">{data.phData.metis.description}</h4>
                                                                </div>
                                                                <div className="col text-left">
                                                                    <h4 className="text-gray-400 font-bold">Project:</h4>
                                                                    <div className="border border-gray-600 p-2">
                                                                        <h5 className="text-gray-400 font-bold px-1">id</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.id}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">proj.no.</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.projectNumber}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">name</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.name}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.org}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">repo</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.repo}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">path</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.path}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">file</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.file}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">branch</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.branch}</h5>
                                                                        <h5 className="text-gray-400 font-bold px-1">username</h5>
                                                                        <h5 className="font-bold whitespace-nowrap bg-gray-800 p-1">{data.phFocus?.focusProj?.username}</h5>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="px-4 col text-left w-2/3">
                                                                <h4 className="px-1 text-gray-400 font-bold">Models:</h4>
                                                                <div className="border border-gray-600 p-2">
                                                                    {data.phData.metis.models.map((model: any, index) => (
                                                                        <div key={model.id} className="flex flex-col">
                                                                            <h5 className="text-gray-400 font-bold">Name</h5>
                                                                            <h4 className="bg-gray-800 p-2"> <span className="text-gray-400">{index}: </span>{model.name}</h4>
                                                                            <h5 className="text-gray-400 p-1 font-bold">Description</h5>
                                                                            <h4 className="bg-gray-800 p-2">{model.description}</h4>
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
                                    <TabsContent value="model-objects" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                        <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                        </div>
                                        {data && data.phData && data.phData.metis && data.phData.metis.models && (
                                            <ObjectCard model={{ name: curmod?.name, description: data.phData.metis.models[0].description, objects: data.phData.metis.models[0].objects, relships: data.phData.metis.models[0].relships }} />
                                        )}
                                    </TabsContent>
                                    {/* <TabsContent value="model-modelviews" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                        <div className="mx-1 bg-gray-700 rounded overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                            <ModelviewCard modelviews={data?.phData?.metis?.models[0].modelviews.map((modelview: any) => ({
                                                ...modelview,
                                                objectviews: Array.isArray(modelview.objectviews) ? modelview.objectviews : [modelview.objectviews]
                                            }))} />
                                        </div>
                                    </TabsContent> */}
                                </Tabs>
                            </TabsContent>

                            <TabsContent value="model" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                {showModel && model && (
                                    <>
                                        <div className="flex justify-end pb-1 pt-0 mx-2">
                                            <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                                Show Prompt
                                            </button>
                                        </div>
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
                                        <div className="mx-1 bg-gray-700 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                            <ObjectCard model={{ ...model, description: model.description || '' }} />
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                            <TabsContent value="modelview" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                <>
                                    <div className="flex justify-end pb-1 pt-0 mx-2">
                                        <button onClick={handleOpenModal} className="bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                            Show Prompt
                                        </button>
                                    </div>
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
                                    <div className="mx-1 ">
                                        <ModelviewCard modelviews={[modelview]} />
                                    </div>
                                </>
                            </TabsContent>
                        </Tabs>
                    </Card>
                    : <div className="flex justify-center items-center h-screen">
                        <LoadingCircularProgress />
                    </div>
                }
            </div>

        </div>
    );
}

export default Modelbuilder;