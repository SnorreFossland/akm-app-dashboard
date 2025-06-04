'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setOntologyData } from '@/features/model-universe/modelSlice';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';
import { OntologyCard } from '@/components/ontology-card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
    SystemPrompt, SystemBehaviorGuidelines, ExistingOntology, UserPrompt, UserInput, ExistingContext, MetamodelPrompt
} from '@/app/concept-builder/prompts';

// const debug = false;

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
    // const [ontologyDataList, setOntologyDataList] = useState<Ontology | null>(null);
    const [suggestedConceptData, setSuggestedConceptData] = useState("");
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const ontologyReduxData = data.phData.ontology || null;

    // Memoize complex computed values to prevent unnecessary re-renders
    const existingConcepts = useMemo(() => {
        const ontologyConcepts = ontologyReduxData?.concepts;
        const modelConceptss = data.phData.metis?.models.map((model) =>
            (model.objects.length > 0) && model.objects?.filter(o => o.typeName === "information")
        );
        const modelConcepts = modelConceptss?.flat().filter(Boolean);

        return ontologyConcepts?.concat(
            modelConcepts?.filter(c => typeof c === 'object').map(c => ({ name: c.name, description: c.description })) || []
        );
    }, [ontologyReduxData?.concepts, data.phData.metis?.models]);

    const existingRelationships = useMemo(() => {
        const ontologyRelationships = ontologyReduxData?.relationships;
        const modelConceptss = data.phData.metis?.models.map((model) =>
            (model.objects.length > 0) && model.objects?.filter(o => o.typeName === "information")
        );
        const modelConcepts = modelConceptss?.flat().filter(Boolean);

        const modelRelationshipss = data.phData.metis?.models.map((model) =>
            (model as any).relationships?.length > 0 &&
            (model as any).relationships?.map((r: any) => {
                const found = modelConcepts?.find(o => o && o.id === r.fromObj);
                return found ? r : null;
            }).filter(Boolean)
        );
        const modelRelationships = modelRelationshipss?.flat().filter(Boolean);

        return ontologyRelationships?.concat(modelRelationships);
    }, [ontologyReduxData?.relationships, data.phData.metis?.models]);

    useEffect(() => {
        setDescrString(data.phData.domain?.description || "");
        setTopicDescr(data.phData.domain?.presentation || "");
    }, [data.phData.domain?.description, data.phData.domain?.presentation]);


    // Memoize the prompt building logic
    const promptData = useMemo(() => {
        let conceptString = '';
        if (existingConcepts && existingRelationships) {
            conceptString += `**Concepts**\n\n${existingConcepts?.map((c) => (c) && `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            conceptString += `**Relationships**\n\n${existingRelationships?.map((r) => (r) && `- ${r.name} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
        }

        const userPrompt = `${UserPrompt} \n\n **Domain name:**  ${data.phData.domain?.name} \\ **Domain description:** ${data.phData.domain?.description || ""}`;
        const userInput = `${UserInput} \n\n ${topicDescr}`;
        const newSystemPrompt = SystemPrompt;
        const newSystemBehaviorGuidelines = SystemBehaviorGuidelines;
        const newContextOntology = (impOntologyString) ? `${ExistingOntology} ${impOntologyString}` : "";
        const newContextItems = (conceptString !== '') ? `${ExistingContext} \n\n ${conceptString}` : "";
        const newContextMetamodel = `${MetamodelPrompt}`;

        return {
            userPrompt,
            userInput,
            newSystemPrompt,
            newSystemBehaviorGuidelines,
            newContextOntology,
            newContextItems,
            newContextMetamodel
        };
    }, [topicDescr, existingConcepts, existingRelationships, data.phData.domain?.name, data.phData.domain?.description, impOntologyString]);
    // Update state only when promptData changes
    useEffect(() => {
        setSystemPrompt(promptData.newSystemPrompt);
        setSystemBehaviorGuidelines(promptData.newSystemBehaviorGuidelines);
        setContextOntology(promptData.newContextOntology);
        setUserPrompt(promptData.userPrompt);
        setUserInput(promptData.userInput);
        setContextItems(promptData.newContextItems);
        setContextMetamodel(promptData.newContextMetamodel);

        setPrintPromptsDiv(
            <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                <DialogTitle>---- System Prompt</DialogTitle>
                <ReactMarkdown>{promptData.newSystemPrompt}</ReactMarkdown>
                <DialogTitle>---- System behaviour Guidelines Prompt</DialogTitle>
                <ReactMarkdown>{promptData.newSystemBehaviorGuidelines}</ReactMarkdown>
                <DialogTitle>---- Ontology Prompt</DialogTitle>
                <ReactMarkdown>{promptData.newContextOntology}</ReactMarkdown>
                <DialogTitle>---- User Prompt</DialogTitle>
                <ReactMarkdown>{promptData.userPrompt}</ReactMarkdown>
                <DialogTitle>---- User Input</DialogTitle>
                <ReactMarkdown>{promptData.userInput}</ReactMarkdown>
                <DialogTitle>---- Context Prompt</DialogTitle>
                <ReactMarkdown>{promptData.newContextItems}</ReactMarkdown>
                <DialogTitle>---- Metamodel Prompt</DialogTitle>
                <ReactMarkdown>{promptData.newContextMetamodel}</ReactMarkdown>
            </div>
        );
    }, [promptData]);

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
                interface DataItem {
                    group: string;
                    entity_name: string;
                }
                const filteredMaster = Object.values(data).filter((item) => (item as DataItem).group === 'master-data');
                const filteredWP = Object.values(data).filter((item) => (item as DataItem).group === 'work-product-component');
                const conceptsNamesMaster = Array.from(new Set(filteredMaster.map((item) => (item as DataItem).entity_name + ' ')));
                const conceptsNamesWP = Array.from(new Set(filteredWP.map((item) => (item as DataItem).entity_name + ' ')));
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
            status: 'succeeded',
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

        // dispatch(setOntologyData(updatedOntologyData));
        setSuggestedOntologyData(null);
        setDispatchDone(true);
    };

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
            return; // Add return here to exit early
        }

        // Add validation for required fields
        if (!systemPrompt || !userPrompt || !userInput) {
            console.error("Missing required prompt data:", {
                systemPrompt: !!systemPrompt,
                userPrompt: !!userPrompt,
                userInput: !!userInput
            });
            alert("Required prompt data is missing. Please wait for the prompts to load.");
            setIsLoading(false);
            return;
        }

        try {
            console.log("Sending request with data:", {
                aiModelName: "gpt-4o",
                schemaName: 'OntologySchema',
                systemPrompt: systemPrompt?.substring(0, 100) + "...", // Log first 100 chars
                systemBehaviorGuidelines: !!systemBehaviorGuidelines,
                userPrompt: userPrompt?.substring(0, 100) + "...",
                userInput: userInput?.substring(0, 100) + "...",
                contextItems: !!contextItems,
                contextOntology: !!contextOntology,
                contextMetamodel: !!contextMetamodel
            });

            const res = await fetch("/api/genmodel", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    aiModelName: "gpt-4o",
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

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API Error Response:", {
                    status: res.status,
                    statusText: res.statusText,
                    body: errorText
                });
                throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let data = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                data += decoder.decode(value, { stream: true });
            }

            console.log("Raw API Response:", data);

            const parsed = JSON.parse(data);
            if (parsed.ontologyData?.concepts && Array.isArray(parsed.ontologyData.concepts)) {
                setSuggestedOntologyData(parsed.ontologyData);
                setIsLoading(false);
                setStep(0);
            } else {
                console.error("Parsed data does not contain concepts or concepts is not an array:", parsed);
                setStep(0);
            }
        } catch (e) {
            console.error("Validation failed:", e instanceof Error ? e.message : e);
            alert(`Error: ${e instanceof Error ? e.message : 'Unknown error occurred'}`);
            setStep(0);
        } finally {
            setIsLoading(false);
        }
    };


    // Update the ontologyDataList useMemo to ensure clean data:

    const ontologyDataList = useMemo(() => {
        const graySuggestedOntologyData = () => {
            if (!suggestedOntologyData) return ontologyReduxData;

            // Validate and clean the data before merging
            const validConcepts = (suggestedOntologyData?.concepts || []).filter(concept =>
                concept &&
                typeof concept.name === 'string' &&
                concept.name.trim() !== '' &&
                typeof concept.description === 'string'
            );

            const validRelationships = (suggestedOntologyData?.relationships || []).filter(rel =>
                rel &&
                typeof rel.name === 'string' &&
                rel.name.trim() !== '' &&
                typeof rel.nameFrom === 'string' &&
                rel.nameFrom.trim() !== '' &&
                typeof rel.nameTo === 'string' &&
                rel.nameTo.trim() !== ''
            );

            return {
                ...ontologyReduxData,
                name: suggestedOntologyData?.name || ontologyReduxData?.name || 'Untitled Ontology',
                description: suggestedOntologyData?.description || ontologyReduxData?.description || '',
                presentation: suggestedOntologyData?.presentation || ontologyReduxData?.presentation || '',
                concepts: [
                    ...validConcepts.map((concept: Concept) => ({
                        ...concept,
                        name: concept.name.trim(),
                        description: concept.description || '',
                        color: 'gray'
                    })),
                    ...(ontologyReduxData?.concepts || []),
                ],
                relationships: [
                    ...validRelationships.map((rel: Relationship) => ({
                        ...rel,
                        name: rel.name.trim() || `${rel.nameFrom}-${rel.nameTo}`,
                        description: rel.description || '',
                        nameFrom: rel.nameFrom.trim(),
                        nameTo: rel.nameTo.trim(),
                        color: 'gray'
                    })),
                    ...(ontologyReduxData?.relationships || []),
                ] as Relationship[],
            };
        };

        return graySuggestedOntologyData();
    }, [suggestedOntologyData, ontologyReduxData]);

    const isPromptDataReady = useMemo(() => {
        return !!(systemPrompt && userPrompt && userInput);
    }, [systemPrompt, userPrompt, userInput]);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] w-full bg-transparent">
            <CardTitle className="flex justify-start text-gray-400 text-xl">
                <span className="text-active-item me-auto px-2">Ontology Builder</span>
                <span className="mx-auto text-center">AI Powered Active Knowledge Canvas</span>
            </CardTitle>
            <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden">
                <div className="border-solid rounded border-4 border-green-700 w-1/4 flex flex-col overflow-y-auto">
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
                    <div className="flex justify-between items-center flex-gro ps-1 bg-gray-600 border border-gray-700">
                        <CardTitle className="flex justify-between items-center flex-grow ps-1">
                            Define Domain Ontology:
                        </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-start m-1">
                        <label htmlFor="chatOutput" className="text-white mt-2">Domain Summary</label>
                        <Textarea
                            id="chatOutput"
                            className="flex-grow p-1 rounded bg-background"
                            value={`${descrString} \n\n ${topicDescr}`}
                            disabled={isLoading}
                            onChange={(e) => setDescrString(e.target.value)}
                            rows={12}
                            placeholder="Domain Summary"
                        />
                        {/* <label htmlFor="topicDescr" className="text-white">Domain Topic</label>
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
                        /> */}
                        <details className="m-2 w-full">
                            <summary className="text-white cursor-pointer">More ...</summary>
                            <div className="mt-2">
                                <div className="flex flex-col flex-grow">
                                    <label htmlFor="suggestedConcepts" className="text-white mt-2">Domain name </label>
                                    <Input
                                        id="suggestedConcepts"
                                        className="flex-grow p-1 rounded bg-background"
                                        value={domainDesc}
                                        disabled={isLoading}
                                        onChange={(e) => setDomainDesc(e.target.value)}
                                        placeholder="Enter your domain name i.e.: E-Scooter Rental Services"
                                    />
                                    <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts</label>
                                    <Input
                                        id="suggestedConcepts"
                                        className="flex-grow p-1 rounded bg-background"
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
                                <Button
                                    onClick={() => {
                                        handleConceptBuilder();
                                        setActiveTab('suggested-concepts');
                                    }}
                                    disabled={!isPromptDataReady || isLoading}
                                    className="rounded text-xl p-4 bg-green-700 text-white disabled:bg-gray-500"
                                >
                                    <FontAwesomeIcon icon={faRobot} size="1x" />
                                </Button>
                            </div>
                        </CardTitle>
                    </div>
                    <div className="mt-auto">
                        <CardTitle
                            className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(dispatchDone) ? 'text-green-600' : 'text-green-200'}`}
                        >
                            <div
                                className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                            >
                                Keep
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
                {/* ------------- */}
                {/* <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-full"> */}
                <div className="border-solid rounded border-4 border-blue-800  w-full overflow-y-none">
                    <Card className="p-1 h-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                                <TabsTrigger value="existing-concepts" className="pb-2 mt-3">Existing Ontology Concepts</TabsTrigger>
                                <TabsTrigger value="suggested-concepts" className="pb-2 mt-3">Suggested Ontology Concepts</TabsTrigger>
                            </TabsList>
                            <TabsContent value="existing-concepts" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="mx-1 bg-gray-700 ">
                                    {data.phData.ontology ? (
                                        <OntologyCard ontologyData={data.phData.ontology} />
                                    ) : (
                                        <div className="p-4 text-center text-gray-400">
                                            No existing ontology data available
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="suggested-concepts" className="m-0 px-1 py-2 rounded bg-background">
                                <>
                                    <div className="flex justify-end pb-1 pt-0 mx-2">
                                        <button onClick={handleOpenModal} className="fixed bg-blue-500 text-white rounded px-1 text-xs hover:bg-blue-700">
                                            Show Prompt
                                        </button>
                                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                            <DialogContent className="max-w-5xl">
                                                <DialogHeader>
                                                    <DialogDescription>
                                                        {/* <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"> */}
                                                        {printPromptsDiv}
                                                        {/* </div> */}
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
                                        {ontologyDataList &&
                                            ontologyDataList.concepts &&
                                            ontologyDataList.concepts.length > 0 ? (
                                            <OntologyCard ontologyData={ontologyDataList} />
                                        ) : (
                                            <div className="p-4 text-center text-gray-400">
                                                {isLoading ? 'Generating suggestions...' : 'No suggested concepts available. Click the robot button to generate suggestions.'}
                                            </div>
                                        )}
                                    </div>
                                </>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>

            </div>
        </div>
    );
}

export default ConceptBuilder;