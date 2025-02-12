'use client';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setOntologyData } from '@/features/model-universe/modelSlice';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';
import { OntologyCard } from '@/components/ontology-card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SystemPrompt, SystemBehaviorGuidelines, ExistingOntology, UserPrompt, UserInput, ExistingContext, MetamodelPrompt } from '@/app/concept-builder/prompts';

const debug = false;

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

const ConceptBuilder = () => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [topicDescr, setTopicDescr] = useState("");
    const [ontologyUrl, setOntologyUrl] = useState("");
    const [impOntologyString, setImpOntologyString] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [userPrompt, setUserPrompt] = useState("");
    const [userInput, setUserInput] = useState("");
    const [contextItems, setContextItems] = useState("");
    const [contextOntology, setContextOntology] = useState("");
    const [contextMetamodel, setContextMetamodel] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);
    const [domainDesc, setDomainDesc] = useState("");
    const [descrString, setDescrString] = useState("");
    const [suggestedOntologyData, setSuggestedOntologyData] = useState<Ontology | null>(null);
    const [ontologyDataList, setOntologyDataList] = useState<Ontology | null>(null);
    const [suggestedConceptData, setSuggestedConceptData] = useState("");
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const ontologyReduxData = data.phData.ontology || null;
    const ontologyConcepts = ontologyReduxData?.concepts;
    const ontologyRelationships = ontologyReduxData?.relationships;
    const modelConceptss = data.phData.metis?.models.map((model: any) => (model.objects.length > 0) && model.objects?.map((o: any) => o.typename === "information" && o).filter(Boolean));
    const modelConcepts = modelConceptss?.flat().filter(Boolean);
    const modelRelationshipss = data.phData.metis?.models.map((model: any) => (model.relationships?.lenght > 0) && model.relationships?.map((r: any) => modelConcepts.find((o: any) => o.id === r.fromObj) && r).filter(Boolean));
    const modelRelationships = modelRelationshipss?.flat().filter(Boolean);
    const existingConcepts = ontologyConcepts?.concat(modelConcepts);
    const existingRelationships = ontologyRelationships?.concat(modelRelationships);

    const handleFetchOntology = async () => {
        try {
            const response = await fetch(`/proxy?url=${encodeURIComponent(ontologyUrl)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
            }
            let data = await response.json();
            if (Array.isArray(data)) {
                data = data[0];
            }

            if (typeof data === 'object' && data !== null) {
                // const dataArr = Object.values(data);
                const filteredMaster = Object.values(data).filter((item: any) => item.group === 'master-data');
                const filteredWP = Object.values(data).filter((item: any) => item.group === 'work-product-component');
                const conceptsNamesMaster = Array.from(new Set(filteredMaster.map((item: any) => item.entity_name + ' ')));
                const conceptsNamesWP = Array.from(new Set(filteredWP.map((item: any) => item.entity_name + ' ')));
                setImpOntologyString(`master-data:\n ${conceptsNamesMaster}, work-product-component:\n ${conceptsNamesWP}`);
            } else {
                console.error('Fetched data is neither an array nor an object:', data);
            }
        } catch (error) {
            console.error('Failed to fetch ontology data: ', error);
        }
    };

    const handleDispatchOntologyData = () => {
        if (!suggestedOntologyData) {
            alert('No Concept data to dispatch');
            return;
        }
        const updatedOntologyData = {
            phData: {
                ...data.phData,
                ontology: suggestedOntologyData,
            },
            phFocus: data.phFocus,
            phUser: data.phUser,
            phSource: data.phSource,
        };

        const uniqueConcepts = Array.from(new Map(updatedOntologyData.phData.ontology.concepts.map((item: Concept) => [item.name, item])).values());
        const uniqueRelationships = Array.from(new Map(updatedOntologyData.phData.ontology.relationships.map((item: Relationship) => [item.name, item])).values());

        updatedOntologyData.phData.ontology.concepts = uniqueConcepts;
        updatedOntologyData.phData.ontology.relationships = uniqueRelationships;
        
        dispatch(setOntologyData(updatedOntologyData));
        setSuggestedOntologyData(null);
        setDispatchDone(true);
    };

    useEffect(() => {
        let conceptString = '';
        if (existingConcepts && existingRelationships) {
            conceptString += `**Concepts**\n\n${existingConcepts?.map((c: any) => (c) && `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            conceptString += `**Relationships**\n\n${existingRelationships?.map((r: any) => (r) && `- ${r.name} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
        }

        setSystemPrompt(SystemPrompt);
        setSystemBehaviorGuidelines(SystemBehaviorGuidelines);
        setContextOntology((impOntologyString) ? `${ExistingOntology} ${impOntologyString}` : "");
        setUserPrompt(UserPrompt);
        setUserInput((topicDescr) ? `${UserInput} \n\n ${topicDescr}` : "");  // TODO: Is this and previous the same??
        setContextItems((conceptString !== '') ? `${ExistingContext} \n\n ${conceptString}` : "");
        setContextMetamodel(`${MetamodelPrompt}`);

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
    }, [topicDescr]);

    const handleConceptBuilder = async () => {
        setIsLoading(true);
        setStep(1);
        setActiveTab('suggested-concepts');

        if (!topicDescr || topicDescr === '') {
            alert(`Please provide a domain description.\nExamples:
            - E-Scooter Rental Services\n
            - Car sale administration\n
            - Energy generation\n
            - Data management\n
            - Financial services for Car rental in Scandinavia\n
        `);
            setIsLoading(false);
        }

        try {
            const res = (systemPrompt) && await fetch("/api/genmodel", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiModelName: "gpt-4o-2024-08-06",
                    schemaName: 'OntologySchema',
                    systemPrompt: systemPrompt || "",
                    systemBehaviorGuidelines: systemBehaviorGuidelines || "",
                    userPrompt: userPrompt || "",
                    userInput: userInput || "",
                    contextItems: contextItems || "",
                    contextOntology: contextOntology || "",
                    contextMetamodel: contextMetamodel || ""
                })
            });

            if (res instanceof Response && !res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

            const reader = (res instanceof Response) ? res.body?.getReader() : null;
            if (!reader) throw new Error("No reader available");
            const decoder = new TextDecoder();
            let data = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                data += decoder.decode(value, { stream: true });
            }

            const parsed = JSON.parse(data);
            if (parsed.ontologyData.concepts && Array.isArray(parsed.ontologyData.concepts)) {             
                setSuggestedOntologyData(parsed.ontologyData);
                setDescrString(parsed.ontologyData.description);
                setIsLoading(false);
                setStep(0);
            } else {
                console.error("Parsed data does not contain concepts or concepts is not an array");
                setStep(0);
            }
        } catch (e) {
            console.error("Validation failed:", e instanceof Error ? e.message : e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const graySuggestedOntologyData = () => {
            const retval = (suggestedOntologyData)
                ? {
                    ...ontologyReduxData,
                    name: suggestedOntologyData?.name || ontologyReduxData.name,
                    description: suggestedOntologyData?.description || ontologyReduxData.description,
                    presentation: suggestedOntologyData?.presentation || ontologyReduxData.presentation,
                    concepts: [
                        ...(suggestedOntologyData?.concepts || []).map((concept: Concept) => ({
                            ...concept,
                            color: 'gray'
                        })),
                        ...(ontologyReduxData?.concepts || []),
                    ],
                    relationships: [
                        ...(suggestedOntologyData?.relationships || []).map((rel: Relationship) => ({
                            ...rel,
                            name: rel.name || '',
                            description: rel.description || '',
                            nameFrom: rel.nameFrom || '',
                            nameTo: rel.nameTo || '',
                            color: 'gray'
                        })),
                        ...(ontologyReduxData?.relationships || []),
                    ] as Relationship[],
                }
                : ontologyReduxData;
            return retval;
        };

        if (suggestedOntologyData) {
            setOntologyDataList(graySuggestedOntologyData());
        } else {
            setOntologyDataList(ontologyReduxData);
        }
    }, [suggestedOntologyData, ontologyReduxData]);

    return (
        <div className="flex  h-[calc(100vh-5rem)] w-full">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <div className="m-1 mb-5">
                    <details>
                        <summary>
                            <FontAwesomeIcon icon={faQuestionCircle} width="16" height="16" />
                        </summary>
                        <div className="bg-gray-600 p-2">
                            <p>Explore the Concepts or Terms for a Domain assisted by AI</p>
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
                    Concept Builder:
                </CardTitle>
                <div className="flex flex-wrap items-start m-1">
                    <label htmlFor="chatOutput" className="text-white mt-2">Chat Output</label>
                    <Textarea
                        id="chatOutput"
                        className="flex-grow p-1 rounded bg-gray-800"
                        value={`${descrString}`}
                        disabled={isLoading}
                        onChange={(e) => setDescrString(e.target.value)}
                        rows={12}
                        placeholder="Chat output will be displayed here"
                    />

                    <label htmlFor="topicDescr" className="text-white">Domain Topic</label>
                    <Textarea
                        id="topicDescr"
                        className="flex-grow p-1 rounded bg-gray-600"
                        value={topicDescr}
                        disabled={isLoading}
                        onChange={(e) => setTopicDescr(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConceptBuilder();
                            }
                        }}
                        placeholder="Type Domain or topic"
                        rows={3}
                    />
                    <details className="m-2 w-full">
                        <summary className="text-white cursor-pointer">More ...</summary>
                        <div className="mt-2">
                            <div className="flex flex-col flex-grow">
                                <label htmlFor="suggestedConcepts" className="text-white mt-2">Domain name </label>
                                <Input
                                    id="suggestedConcepts"
                                    className="flex-grow p-1 rounded bg-gray-800"
                                    value={domainDesc}
                                    disabled={isLoading}
                                    onChange={(e) => setDomainDesc(e.target.value)}
                                    placeholder="Enter your domain name i.e.: E-Scooter Rental Services"
                                />
                                <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts</label>
                                <Input
                                    id="suggestedConcepts"
                                    className="flex-grow p-1 rounded bg-gray-800"
                                    value={suggestedConceptData || ""}
                                    disabled={isLoading}
                                    onChange={(e) => setSuggestedConceptData(e.target.value)}
                                    placeholder="Enter your concepts i.e.: Scooter, User, booking"
                                />
                            </div>
                            <div className="cursor-pointer">Import Ontology</div>
                            <div className="flex-grow bg-gray-700 text-gray-500">
                                <Textarea
                                    id="ontologyUrl"
                                    className="ontology-input flex-grow bg-gray-600 text-white"
                                    value={ontologyUrl}
                                    onChange={(e) => setOntologyUrl(e.target.value)}
                                    placeholder="Paste ontology URL here"
                                />
                                <div className="flex justify-between">
                                    <Button
                                        onClick={() => {
                                            handleFetchOntology();
                                            setActiveTab('imported-ontology');
                                        }}
                                        className="bg-green-800 text-white text-sm rounded w-full"
                                    >
                                        Load Ontology
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </details>
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(suggestedOntologyData) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        Ask GPT to suggest Concepts
                        <div className="flex items-center ml-auto">
                            {(isLoading) ? (
                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                    <LoadingCircularProgress />
                                </div>
                            ) : (
                                <div style={{ marginLeft: 8, marginRight: 8, color: (suggestedOntologyData) ? 'green' : 'gray' }}>
                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                </div>
                            )}
                            <Button onClick={() => {
                                handleConceptBuilder();
                                setActiveTab('suggested-concepts');
                            }}
                                className="rounded text-xl p-4 bg-green-700 text-white"
                            >
                                <FontAwesomeIcon icon={faRobot} size="1x" />
                            </Button>
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
                            Save to current Store
                            <div className="flex items-center ml-auto">
                                {!dispatchDone && step === 2 ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone && step === 2 ? 'green' : 'gray' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                    </div>
                                )}
                                <Button
                                    onClick={() => {
                                        setStep(2);
                                        handleDispatchOntologyData();
                                    }}
                                    className="rounded text-xl p-4 bg-green-700 text-white">
                                    <FontAwesomeIcon icon={faPaperPlane} width="26px" size="1x" />
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                </div>
            </div>
            
            <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                        <TabsTrigger value="existing-concepts" className="bg-blue-800 text-white rounded px-1 py-0">Existing Concepts</TabsTrigger>
                        <TabsTrigger value="suggested-concepts" className="bg-blue-800 text-white rounded px-1 py-0">Suggested Concepts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing-concepts" className="m-0 px-1 py-2 rounded bg-background">
                        <>
                            <div className="flex justify-end pb-1 pt-0 mx-2">
                                <button onClick={handleOpenModal} className="fixed bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                    Show Prompt
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
                            </div>
                            <div className="mx-1 bg-gray-700 ">
                                <OntologyCard ontologyData={ontologyDataList} />
                            </div>
                        </>
                    </TabsContent>
                    <TabsContent value="suggested-concepts" className="m-0 px-1 py-2 rounded bg-background">
                        <>
                            <div className="flex justify-end pb-1 pt-0 mx-2">
                                <button onClick={handleOpenModal} className="fixed bg-blue-500 text-white rounded px-1 text-xs  hover:bg-blue-700">
                                    Show Prompt
                                </button>
                                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                    <DialogContent className="max-w-5xl">
                                        <DialogHeader>
                                            <DialogDescription>
                                                <div>
                                                    <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        {printPromptsDiv}
                                                    </div>
                                                </div>
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button onClick={handleCloseModal} className="bg-red-500 text-white rounded m-1 p-1 text-sm">
                                                Close
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="mx-1 bg-gray-700 ">
                                <OntologyCard ontologyData={ontologyDataList} />
                            </div>
                        </>
                    </TabsContent>
                </Tabs>
            </div>

        </div>
    );
}

export default ConceptBuilder;