import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSave, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setOntologyData } from '@/features/ontology/ontologySlice';
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

import { SystemConceptPrompt } from '@/app/concept-builder/prompts/concept-system-prompt';

import { set } from 'zod';

const debug = false;

const ConceptBuilder = () => {
    const data = useSelector((state: RootState) => state.ontology.data);
    const error = useSelector((state: RootState) => state.ontology.error);
    const status = useSelector((state: RootState) => state.ontology.status);
    const reduxData = data;

    if (!debug) console.log('22 ConceptBuilder data:', data);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [topicDescr, setTopicDescr] = useState("");
    const [domainDesc, setDomainDesc] = useState("");
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
    const [suggestedConceptData, setSuggestedConceptData] = useState<string | null>(null);
    const [descrString, setDescrString] = useState("");
    const [existingConcepts, setExistingConcepts] = useState("");
    const [ontologyString, setOntologyString] = useState("");
    const [concepts, setConcepts] = useState("");
    const [conceptData, setConceptData] = useState(null)
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

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
    Identify and explain the key concepts and concepts related to the domain supplied in the user input:
    
    ## User Input : **${topicDescr}**
    Elaborate around this input and provide a detailed explanation of the domain and put that in the chat output.
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
    ## **Presentation**
    Create a comprehensive presentation of [**${topicDescr}**] and [**${data?.ontology?.description}**] and [**${data?.ontology?.presentation}**]  that includes the following components:
    
    **Title:** ${topicDescr}
    
    ### **Instructions**
    
    Please develop a detailed and engaging presentation on **[${topicDescr}]** that includes the following components:
    
    1. **Introduction**
        - Provide a brief overview of the domain.
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
    
    ### **Additional Guidelines**
    
    - Use clear and concise language suitable for your target audience.
    - Incorporate visuals such as images, graphs, and charts to enhance understanding.
    - Ensure each slide focuses on a single idea for clarity.
    - Include speaker notes to elaborate on key points if necessary.
    - Proofread and edit your presentation for accuracy and coherence.
    - Ensure all sources are properly cited and referenced.
    - Submit your presentation in a format that is easily accessible and shareable and put it in the presentation field within the ontologyData in structured output.
    - Output of the presentation should be in markdown format with nice layout.
    - The presentation should be engaging and informative, providing a comprehensive overview of the domain.
    - Also make a detailed description of the domain and put that in the chatOutput.
    
    ### Example Presentation:
    {
    "ontologyData": {
        "name": "Bike rental",
        "description": "Brief description of the domain.",
        "presentation": " ..........",
        "concepts": [{ "name": "Bike", "description": "Description of the concept." }],
        "relationships": [{ "name": "Rental", "nameFrom": "Bike", "nameTo": "Customer" }],
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


    const mergeOntologyData = (reduxData, suggestedData) => {  // suggestedData is the data returned from the AI model and owerwrites???? the reduxData
        return {
            ...reduxData,
            ...suggestedData,
            concepts: [
                ...(reduxData.concepts || []),
                ...(suggestedData?.concepts || [])
            ],
            relationships: [
                ...(reduxData.relationships || []),
                ...(suggestedData?.relationships || [])
            ],
            // Merge other nested properties similarly
        };
    };

    return (
        <div className="flex  h-[calc(100vh-5rem)]">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
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
                        rows={20}
                        placeholder="Chat output will be displayed here"
                    />

                    <label htmlFor="topicDescr" className="text-white">Topic</label>
                    <Textarea
                        id="topicDescr"
                        className="flex-grow p-1 rounded bg-gray-600"
                        value={topicDescr}
                        disabled={isLoading}
                        onChange={(e) => setTopicDescr(e.target.value)}
                        // onKeyDown={(e) => {
                        //     if (e.key === 'Enter') {
                        //         e.preventDefault();
                        //         handleConceptBuilder();
                        //     }
                        // }}
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
                    </CardTitle>




                </div>
                <div className="m-1 mb-5">
                    <details>
                        <summary>
                            <FontAwesomeIcon icon={faQuestionCircle} /> Concept Model
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
                <div className="m-1 mt-auto">
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(dispatchDone) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        <div
                            className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                        >
                            Save to current Ontology
                            <div className="flex items-center ml-auto">
                                {!dispatchDone && step === 4 ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                    </div>
                                )}
                                <Button
                                    onClick={handleDispatchOntologyData}
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
                    <TabsList className="m-1 mb-0 bg-transparent">
                        <TabsTrigger value="suggested-concepts" className="bg-blue-800 text-white rounded px-1 py-2">Suggested Concepts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="suggested-concepts" className="m-0 px-1 py-2 rounded bg-background">
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