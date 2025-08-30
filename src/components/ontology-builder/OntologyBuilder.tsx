'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { HelpCircle, X } from 'lucide-react';
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
import { saveMarkdownDocument, setDomainData } from '@/features/model-universe/modelSlice';
import {
    ontologySystemPrompt, ontologySystemBehaviorGuidelines, ontologyExistingOntology, ontologyUserPrompt, ontologyExistingContext, ontologyMetamodelPrompt
} from '@/app/ontology-builder/prompts';


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

const OntologyBuilder = (
    {
        suggestedOntologyData,
        setSuggestedOntologyData,
        gettingStartedGuide,
        guide
    }: {
        suggestedOntologyData: Ontology | null;
        setSuggestedOntologyData: (data: Ontology | null) => void;
        gettingStartedGuide: React.ReactNode;
        guide: React.ReactNode;
    }
) => {
    if (false) { 
    
    const data = useSelector((state: RootState) => state.modelUniverse);
    const domainData = useSelector((state: { modelUniverse: any }) => data.phData.domain);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [topicDescr, setTopicDescr] = useState("");
    const [definition, setDefinition] = useState("");
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

    const [domainName, setDomainName] = useState(domainData?.name || '');
    const [domainDescription, setDomainDescription] = useState(domainData?.description || '');
    const [domainPresentation, setDomainPresentation] = useState(domainData?.presentation || '');
    const [currentDocument, setCurrentDocument] = useState<string>(domainData?.presentation || '');
    // const [suggestedOntologyData, setSuggestedOntologyData] = useState<Ontology | null>(null);
    // const [ontologyDataList, setOntologyDataList] = useState<Ontology | null>(null);
    // const [suggestedConceptData, setSuggestedConceptData] = useState("");
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

    const [showGuide, setShowGuide] = useState(false);

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
        setDefinition(data.phData.domain?.presentation || "");
        // setTopicDescr(data.phData.domain?.presentation || "");
    }, [data.phData.domain]);

    // Update local state when Redux state changes
    useEffect(() => {
        if (domainData) {
            setDomainName(domainData.name || '');
            setDomainDescription(domainData.description || '');
            setDomainPresentation(domainData.presentation || '');
            setCurrentDocument(domainData.presentation || '');
        }
    }, [domainData]);

    // Memoize the prompt building logic
    const promptData = useMemo(() => {
        let conceptString = '';
        if (existingConcepts && existingRelationships) {
            conceptString += `**Concepts**\n\n${existingConcepts?.map((c) => (c) && `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            conceptString += `**Relationships**\n\n${existingRelationships?.map((r) => (r) && `- ${r.name} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
        }

    const newSystemPrompt = ontologySystemPrompt;
    const newSystemBehaviorGuidelines = ontologySystemBehaviorGuidelines;
    const userPrompt = (data.phData.domain.name !== "") ? `${ontologyUserPrompt} \n\n **Domain name:**\n  ${data.phData.domain?.name} \n\n **Domain description:**\n ${data.phData.domain?.description || ""}` : ontologyUserPrompt;
    const userInput = (domainData.presentation !== "") ? `${ontologyUserInput} \n\n ${domainData?.presentation || ""} \n\n ${domainPresentation} \n\n ${topicDescr}` : "";
    const newContextOntology = (impOntologyString) ? `${ontologyExistingOntology} ${impOntologyString}` : "";
    const newContextItems = (conceptString !== '') ? `${ontologyExistingContext} \n\n ${conceptString}` : "";
    const newContextMetamodel = `${ontologyMetamodelPrompt}`;

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

    const handleOntologyBuilder = async () => {
        setIsLoading(true);
        setStep(1);
        setActiveTab('suggested-concepts');

        if (!descrString || descrString === '') {
            alert(`Please generate a Domain Description before generating ontology concepts.`);
            setIsLoading(false);
            return; // Add return here to exit early
        }

        // Add validation for required fields
        if (!systemPrompt || !userPrompt || !userInput) {
            console.error("273 Missing required prompt data:", {
                systemPrompt: !!systemPrompt,
                userPrompt: !!userPrompt,
                userInput: !!userInput
            });
            alert("Required prompt data is missing. Please wait for the prompts to load.");
            setIsLoading(false);
            return;
        }

        if (debug) console.log("Sending request with data:", {
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

        try {
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
                    userPrompt: userPrompt || "", // Generic user prompt
                    userInput: userInput || "", // Specific user input like new aspects or additional concepts
                    contextItems: contextItems || "", // Existing concepts
                    contextOntology: contextOntology || "", // Existing ontology
                    contextMetamodel: contextMetamodel || "" // Existing metamodel
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

            // console.log("Raw API Response:", data);

            const parsed = JSON.parse(data);
            console.log("Parsed API Response:", parsed);
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

    // Handle individual field changes with auto-save
    const handleFieldChange = (field: string, value: string) => {
        const updatedData = {
            ...domainData,
            [field]: value
        };

        dispatch(setDomainData(updatedData));

        // Update local state
        switch (field) {
            case 'name':
                setDomainName(value);
                break;
            case 'description':
                setDomainDescription(value);
                break;
            case 'presentation':
                setDomainPresentation(value);
                break;
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
        <div className="flex flex-col min-h-0 h-full w-full rounded-lg sm:h-[99%] sm:min-w-[460px] overflow-hidden relative">
            <div className="flex-1 flex flex-row h-full bg-secondary/40 overflow-hidden relative">
                {showGuide && (
                    <div className="flex flex-col items-center mt-1 mb-2 me-2 px-1 border border-yellow-800 rounded-lg w-80 h-full flex-shrink-0">
                        <div className="flex items-center justify-between w-full px-1">
                            <div className="text-lg font-semibold text-orange-500/60">
                                Guide
                            </div>
                            <button
                                onClick={() => setShowGuide(false)}
                                className="text-gray-400 hover:text-white"
                                title="Close Guide"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 max-h-[calc(100vh-22rem)] overflow-y-auto p-1 bg-yellow-900/60">
                            {React.isValidElement(guide) ? guide : null}
                        </div>
                    </div>
                )}

                <div className="flex flex-col h-full bg-secondary/40 overflow-hidden relative">
                    <div className="flex items-center gap-2">
                        {!showGuide && (
                            <button
                                onClick={() => setShowGuide(true)}
                                className="text-gray-400 hover:text-blue-400 hover:bg-gray-800 pt-1 rounded-md"
                                title="Show Guide"
                            >
                                <HelpCircle className="bg-yellow-700 text-white rounded h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center max-h-[calc(100vh-22rem)] w-full overflow-auto p-4 gap-4 text-gray-400 text-sm flex-1">
                    {gettingStartedGuide}
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 bg-secondary/40 overflow-visible relative">
                <details className="sticky top-0 bottom-5 w-full z-30 pointer-events-auto">
                    <summary className="bg-gray-800 text-white cursor-pointer p-1">Add External Ontology Concepts...</summary>
                    <div className="w-full rounded-md border border-gray-600 bg-gray-800 p-2">
                        {/* <Input
                            id="suggestedConcepts"
                            className="flex-grow p-1 rounded bg-background"
                            value={Array.isArray(suggestedOntologyData?.concepts) ? suggestedOntologyData.concepts.map(concept => concept.name).join(', ') : ""}
                            disabled={isLoading}
                            onChange={(e) => setSuggestedOntologyData({ ...suggestedOntologyData, concepts: e.target.value })}
                            placeholder="Enter your concepts i.e.: Scooter, User, booking"
                        /> */}
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
            </div>
            <div className="relative bottom-2 left-0 right-0 bg-popover pb-safe mt-1 rounded-lg z-10">
                <CardTitle className={`flex justify-between items-center flex-grow ps-1 mt-auto bg-gray-600 border border-gray-700 ${(suggestedOntologyData) ? 'text-green-600' : 'text-green-200'}`}>
                    Ask AI to suggest Concepts
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
                                handleOntologyBuilder();
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
        </div>
    );
}
}

export default OntologyBuilder;