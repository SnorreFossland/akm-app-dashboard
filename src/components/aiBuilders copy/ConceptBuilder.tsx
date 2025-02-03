import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSave, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setOntologyData } from '@/features/model-universe/modelSlice';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';
import { OntologyCard } from '@/components/ontology-card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SystemConceptPrompt } from '@/app/concept-builder/promptstmp/concept-system-prompt';

import { set } from 'zod';

const debug = false;

const ConceptBuilder = () => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const error = useSelector((state: RootState) => state.modelUniverse.error);
    const status = useSelector((state: RootState) => state.modelUniverse.status);
    const reduxData = data;

    if (!debug) console.log('22 ConceptBuilder data:', data);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [topicDescr, setTopicDescr] = useState("");
    const [domainDesc, setDomainDesc] = useState("");
    const [impOntology, setImpOntology] = useState(null);
    const [suggestedConcepts, setSuggestedConcepts] = useState<{ concepts: any[], relationships: any[] } | null>(null);
    const [ontologyUrl, setOntologyUrl] = useState("");
    const [conceptSystemPrompt, setConceptSystemPrompt] = useState(SystemConceptPrompt);
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [conceptUserPrompt, setConceptUserPrompt] = useState("");
    const [conceptUserInput, setConceptUserInput] = useState("");
    const [conceptContextItems, setConceptContextItems] = useState("");
    const [conceptContextOntology, setConceptContextOntology] = useState("");
    const [conceptContextMetamodel, setConceptContextMetamodel] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suggestedConceptData, setSuggestedConceptData] = useState(null);
    interface Ontology {
            name: string;
            description: string;
            concepts: [];
            relationships: [];
            presentation: string;
    }
    
    const [allOntology, setAllOntology] = useState<Ontology | null>(null);
    const [descrString, setDescrString] = useState("");
    const [existingConcepts, setExistingConcepts] = useState("");
    const [ontologyString, setOntologyString] = useState("");
    const [concepts, setConcepts] = useState("");
    const [conceptData, setConceptData] = useState(null)
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);


    const handleFetchOntology = async () => {
        try {
            const response = await fetch(`/proxy?url=${encodeURIComponent(ontologyUrl)}`);
            // const response = await fetch(`/proxy?url=${encodeURIComponent('https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json')}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
            }
            const data = await response.json();
            if (!debug) console.log('180 Fetched ontology data:', data);
            if (Array.isArray(data)) {
                const filteredOntology = data.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
                setImpOntology(filteredOntology);
            } else if (typeof data === 'object' && data !== null) {
                const dataArr = Object.values(data);
                if (!debug) console.log('186 dataArr', dataArr);
                const filteredArr = dataArr.filter((item: any) => item.group === 'master-data' || item.group === 'work-product-component');
                interface OntologyItem {
                    entity_name: string;
                    group: string;
                }

                const dataOntology = Array.from(new Map(filteredArr.map((item) => {
                    const ontologyItem = item as OntologyItem;
                    return [ontologyItem.entity_name, { name: ontologyItem.entity_name, description: ontologyItem.group }];
                })).values());

                if (!debug) console.log('189 dataOntology', dataOntology);
                const filteredMaster = Object.values(data).filter((item: any) => item.group === 'master-data');
                const filteredWP = Object.values(data).filter((item: any) => item.group === 'work-product-component');
                const conceptsNamesMaster = Array.from(new Set(filteredMaster.map((item: any) => item.entity_name + ' ')));
                const conceptsNamesWP = Array.from(new Set(filteredWP.map((item: any) => item.entity_name + ' ')));
                setOntologyString(`master-data:\n ${conceptsNamesMaster}, work-product-component:\n ${conceptsNamesWP}`);
                const ontologyData = { name: "OSDU-EntityTypes", concepts: dataOntology, relationships: [] };
                setOntologyData(ontologyData);
                if (!debug) console.log('81 Fetched ontology data:', data, dataArr, dataOntology, ontologyData);
            } else {
                console.error('Fetched data is neither an array nor an object:', data);
            }
        } catch (error) {
            console.error('Failed to fetch ontology data: ', error);
        }
    };

    const handleAskGpt = () => (
        <div className="flex items-center ml-auto">
            {(isLoading && step === 1) ? (
                <div style={{ marginLeft: 8, marginRight: 8 }}>
                    <LoadingCircularProgress />
                </div>
            ) : (
                <div style={{ marginLeft: 8, marginRight: 8, color: (suggestedConceptData && suggestedConceptData.length > 0) ? 'green' : 'gray' }}>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                </div>
            )}
            <Button onClick={() => {
                setStep(1);
                handleConceptBuilder();
                setActiveTab('suggested-concepts');
            }}
                className={`rounded text-xl p-4 ${(suggestedConceptData && suggestedConceptData.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
            >
                <FontAwesomeIcon icon={faRobot} size="1x" />
            </Button>
        </div>
    )

    const handleDispatchOntologyData = () => {
        if (!suggestedConceptData) {
            alert('No Concept data to dispatch');
            return;
        }
        if (!debug) console.log('54 dispatching Concept data:', data, suggestedConceptData);
        (suggestedConceptData) && dispatch(setOntologyData(suggestedConceptData));
        setSuggestedConceptData(null);
        setDispatchDone(true);
    };

    const handleConceptBuilder = async () => {
        setIsLoading(true);
        setDomainDesc("");
        setConcepts("");
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
            return;
        }

        const userPrompt = (topicDescr) ? `
    Identify and explain the key concepts and concepts supplied in the user input:
    
    ## User Input : **${topicDescr}**
    Elaborate around this input and provide a detailed explanation of the domain.
    Create concepts and relationships based on the user input.

    `
            : "";

        const userInput = (suggestedConcepts)
            ? `
    Include the following concepts in the Conceptual Apparatus:
    **User Suggested Concepts:**
    ${suggestedConcepts}
    `
            : "";

        let conceptString = '';

        if (reduxData && reduxData.concepts.length > 0) {
            conceptString += `**Objects**\n\n${reduxData.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            conceptString += `**Relationships**\n\n${reduxData.relationships.map((r: any) => `- ${r.name} - ${r.description} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
        }
        const contextItems = (conceptString && conceptString !== '') ? `
    You must include the following existing concepts in the Conceptual Apparatus:
    ## **Context:**
    - Do not create any concepts that already is in Existing Context.
    - Do not create any relationships that already is in Existing Context.
    - You may create relationships between new and existing concepts.
    ${conceptString}
    `
            : "";

        console.log('109 contextItems', contextItems, conceptString);

        // Imported Ontology
        const contextOntology = (ontologyString && ontologyString !== '') ? `
    ## **Ontology**
    Use the names of following concepts from the ontology where ever possible:
    **List of concepts:**
    ${ontologyString} 
    
    Make sure to use these concepts in the Conceptual Apparatus.
    `
            : "";

        const contextMetamodel = `

    ## **Description**
    Create a description of the concepts domain.
    - Include the existing context description [**${allOntology?.description}**] in the new description.
    - Add to existing description if new concepts are added.

    ##Create a comprehensive presentation including the existing [**${allOntology?.presentation}**].

    ## **Presentation**
    Include the existing context in the Presentation.
    It should includes the following components:
    
    **Title:** ${topicDescr}
    
    ### **Instructions**
    
    1. **Introduction**
        - Provide an overview of the domain.
        - Explain its significance in the current context.
    
    2. **Historical Background**
        - Outline the evolution of this domain.
        - Mention key milestones and breakthroughs.
    
    3. **Core Concepts and Theories**
        - Explain fundamental principles.
        - Include important models or frameworks.
    
    4. **Current Trends and Developments**
        - Discuss recent advancements.
        - Highlight emerging technologies or methodologies.
    
    5. **Applications**
        - Describe real-world applications.
        - Include case studies or success stories.
    
    6. **Challenges and Limitations**
        - Identify common obstacles.
        - Discuss any ethical, social, or technical issues.
    
    7. **Future Outlook**
        - Predict future trends.
        - Explore potential opportunities and risks.
    
    8. **Conclusion**
        - Summarize key points.
        - Emphasize the importance of the domain moving forward.
    
    9. **References**
        - Cite all sources of information.
        - Include additional resources for further reading.

    
    ### Example Presentation:
    {
    "ontologyData": {
        "name": "Bike rental",
        "description": "Brief description of the domain.",
        "presentation": " ..........",
        "concepts": [{ "id": "Electric_Bike", "name": "Electric Bike", "description": "Description of the concept." }],
        "relationships": [{ "id": "Rents_a_bike","name": "Rents a bike", "nameFrom": "Bike", "nameTo": "Customer" }],
        },
    ],
    }
    `;

        setConceptSystemPrompt(conceptSystemPrompt);
        setSystemBehaviorGuidelines("");
        setConceptUserPrompt(userPrompt);
        setConceptUserInput(userInput);
        setConceptContextItems(contextItems);
        setConceptContextOntology(contextOntology);
        setConceptContextMetamodel(contextMetamodel);

        try {
            const res = await fetch("/streaming/api/genmodel", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schemaName: 'OntologySchema',
                    systemPrompt: conceptSystemPrompt || "",
                    systemBehaviorGuidelines: "",
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

            const parsed = JSON.parse(data);
            console.log("205 Parsed data:", reduxData, parsed.ontologyData);
            setConceptData(parsed.ontologyData);
            if (parsed.ontologyData.concepts && Array.isArray(parsed.ontologyData.concepts)) {

                setSuggestedConceptData(parsed.ontologyData);
                setDescrString(parsed.ontologyData.description);
            } else {
                console.error("Parsed data does not contain concepts or concepts is not an array");
            }
        } catch (e) {
            console.error("Validation failed:", e instanceof Error ? e.message : e);
        }
        setIsLoading(false);
    };


    const mergeOntologyData = (reduxData, suggestedCondeptData) => {  // suggestedData is the data returned from the AI model and owerwrites???? the reduxData
        return {
            ...reduxData,
            ...suggestedConceptData,
            concepts: [
                ...(suggestedConceptData?.concepts || []).map(concept => ({
                    ...concept,
                    color: 'gray'
                })),
            ...(reduxData.concepts || []),
            ],
            relationships: [
                ...(suggestedConceptData?.relationships || []).map(rel => ({
                    ...rel,
                    color: 'gray'
                })),
            ...(reduxData.relationships || []),
            ],
            // Merge other nested properties similarly
        };
    };
    useEffect(() => {
        setAllOntology(mergeOntologyData(reduxData, suggestedConceptData))
        }, [suggestedConceptData]
    );

 
    return (
        <div className="flex  h-[calc(100vh-5rem)]">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <div className="m-1 mb-5">
                    <details>
                        <summary>
                            <FontAwesomeIcon icon={faQuestionCircle} width="16" height="16" /> Concept Model
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
                    Domain Explorer:
                </CardTitle>
                <div className="flex flex-wrap items-start m-1">
                    <label htmlFor="chatOutput" className="text-white mt-2">Chat Output</label>
                    <Textarea
                        id="chatOutput"
                        className="flex-grow p-1 rounded bg-gray-800"
                        value={`${descrString}`}
                        disabled={isLoading}
                        rows={12}
                        placeholder="Chat output will be displayed here"
                    />

                    <label htmlFor="topicDescr" className="text-white">Topic</label>
                    <Textarea
                        id="topicDescr"
                        className="flex-grow p-1 rounded bg-gray-600"
                        value={topicDescr}
                        disabled={isLoading}
                        onChange={(e) => setTopicDescr(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAskGpt();
                                setStep(1);
                            }
                        }}
                        placeholder="Ask GPT to suggest Concepts from this topic"
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
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(suggestedConceptData && suggestedConceptData.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        Ask GPT to suggest Concepts
                        <div className="flex items-center ml-auto">
                            {(isLoading) ? (
                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                    <LoadingCircularProgress />
                                </div>
                            ) : (
                                <div style={{ marginLeft: 8, marginRight: 8, color: suggestedConceptData && step === 1 ? 'green' : 'gray' }}>
                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                </div>
                            )}
                            <Button onClick={() => {
                                setStep(1);
                                handleConceptBuilder();
                                setActiveTab('suggested-concepts');
                            }}
                                className={`rounded text-xl p-4 ${(suggestedConceptData && step === 1) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
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
                            Save to current Concept Store
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
                                    className={`rounded text-xl ${dispatchDone && step === 4 || step === 5 ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}>
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
                        <TabsTrigger value="suggested-concepts" className="bg-blue-800 text-white rounded px-1 py-0">Suggested Concepts</TabsTrigger>
                    </TabsList>
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
                                                        <DialogTitle>---- System Prompt</DialogTitle>
                                                        <ReactMarkdown>{conceptSystemPrompt}</ReactMarkdown>
                                                        <DialogTitle>---- System behavior Guidelines Prompt</DialogTitle>
                                                        <ReactMarkdown>{systemBehaviorGuidelines}</ReactMarkdown>
                                                        <DialogTitle>---- User Prompt</DialogTitle>
                                                        <ReactMarkdown>{conceptUserPrompt}</ReactMarkdown>
                                                        <DialogTitle>---- User Input</DialogTitle>
                                                        <ReactMarkdown>{conceptUserInput}</ReactMarkdown>
                                                        <DialogTitle>---- Context Prompt</DialogTitle>
                                                        <ReactMarkdown>{conceptContextItems}</ReactMarkdown>
                                                        <DialogTitle>---- Ontology Prompt</DialogTitle>
                                                        <ReactMarkdown>{conceptContextOntology}</ReactMarkdown>
                                                        <DialogTitle>---- Metamodel Prompt</DialogTitle>
                                                        <ReactMarkdown>{conceptContextMetamodel}</ReactMarkdown>
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
                                <OntologyCard ontologyData={mergeOntologyData(reduxData, suggestedConceptData)} />
                            </div>
                       
                        </>
                    </TabsContent>
                </Tabs>
            </div>

        </div>
    );
}

export default ConceptBuilder;