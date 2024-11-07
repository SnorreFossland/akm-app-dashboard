import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faRobot } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';
import { OntologyCard } from '@/components/ontology-card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const ConceptBuilder = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [topicDescr, setTopicDescr] = useState("");
    const [domainDesc, setDomainDesc] = useState("");
    const [suggestedConcepts, setSuggestedConcepts] = useState("");
    const [ontologyUrl, setOntologyUrl] = useState("");
    const [conceptSystemPrompt, setConceptSystemPrompt] = useState("");
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [conceptUserPrompt, setConceptUserPrompt] = useState("");
    const [conceptUserInput, setConceptUserInput] = useState("");
    const [conceptContextItems, setConceptContextItems] = useState("");
    const [conceptContextOntology, setConceptContextOntology] = useState("");
    const [conceptContextMetamodel, setConceptContextMetamodel] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suggestedConceptData, setSuggestedConceptData] = useState(null);
    const [concepts, setConcepts] = useState("");
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('suggested-concepts');

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
    Elaborate around this input and provide a detailed explanation of the domain.

    `
            : "";

        const userInput = (suggestedConcepts && suggestedConcepts !== '')
            ? `
    Include the following concepts in the Conceptual Apparatus:
    **User Suggested Concepts:**
    ${suggestedConcepts}
    `
            : "";

        const contextItems = (existingConcepts && existingConcepts !== '') ? `
    You must include the following existing concepts in the Conceptual Apparatus:
    ## **Context:**
    - Do not create any concepts that already is in Existing Context.
    ${existingConcepts}
    `
            : "";

        const contextOntology = (ontologyString && ontologyString !== '') ? `
    ## **Ontology**
    Use the names of following concepts from the ontology where ever possible:
    **List of concepts:**
    ${ontologyString}

    Make sure to use these concepts in the Conceptual Apparatus.

        `: "";

        const contextMetamodel = `
    ## **Presentation**
    Create a comprehensive presentation of **[${topicDescr}]** that includes the following components:

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

        if (!topicDescr || topicDescr === '') {
            alert("Please provide a domain description.");
            setIsLoading(false);
            return;
        }

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
            if (parsed.ontologyData.concepts && Array.isArray(parsed.ontologyData.concepts)) {
                setSelectedConcepts({ concepts: parsed.ontologyData.concepts, relationships: parsed.ontologyData.relationships });
                setSuggestedConceptData(parsed.ontologyData);
                const selectedconceptsString = parsed.ontologyData.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n');
                const selectedRelationsString = parsed.ontologyData.relationships.map((rel: any) => `- ${rel.name} (from: ${rel.nameFrom} to: ${rel.nameTo})`).join('\n');
                setConcepts(`**Concepts**\n\n ${selectedconceptsString}\n\n **Relations:**\n\n${selectedRelationsString}\n\n`);
                setStep(2);
            } else {
                console.error("Parsed data does not contain concepts or concepts is not an array");
            }
        } catch (e) {
            console.error("Validation failed:", e instanceof Error ? e.message : e);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex mx-2">
            <div className="border-solid rounded border-4 border-green-700 w-1/4">
                <Card className="mb-0.5">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center flex-grow ps-1">
                            Concept Builder:
                        </CardTitle>
                        <div className="mx-2">
                            <details>
                                <summary>Concept Ontology</summary>
                                <div className="bg-gray-600">
                                    <p>Build an AKM Concept Model assisted by AI</p>
                                    <p>This involves the following steps:</p>
                                    <ul>
                                        <li><strong>• Establish the Concept Ontology (Conceptual Apparatus) for the Domain:</strong></li>
                                        <p style={{ marginLeft: '20px' }}>It refers to the set of concepts, theories, models, and frameworks that collectively provide the foundational understanding of a particular field or discipline.
                                            It encompasses the concepts, principles, and relationships that are essential for practitioners within the field to communicate effectively and advance knowledge.</p>
                                        <li><strong>• Create the Workspaces :</strong></li>
                                        <p style={{ marginLeft: '20px' }}>Create IRTV objects and relationships. Create Information objects of the concepts identified in the first step (The What). Add Roles (Who), Tasks (How), and Views (What to see) working on the Information objects.</p>
                                        <li><strong>• Dispatch the result to the current Model-project store:</strong></li>
                                        <p style={{ marginLeft: '20px' }}>The final step is to dispatch the generated IRTV objects and relationships to the current Model-project.</p>
                                    </ul>
                                </div>
                            </details>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-start">
                        <label htmlFor="topicDescr" className="text-white">Topic</label>
                        <Textarea
                            id="topicDescr"
                            className="flex-grow p-1 rounded bg-gray-800"
                            value={topicDescr}
                            disabled={isLoading}
                            onChange={(e) => setTopicDescr(e.target.value)}
                            placeholder="Enter domain description"
                            rows={3}
                        />
                        <details className="flex-grow">
                            <summary className="text-white cursor-pointer">Add Domain name and Concepts you want to be included</summary>
                            <div className="flex flex-col flex-grow mt-2">
                                <label htmlFor="suggestedConcepts" className="text-white mt-2">Domain name </label>
                                <Input
                                    id="suggestedConcepts"
                                    className="flex-grow p-1 rounded bg-gray-800"
                                    value={domainDesc}
                                    disabled={isLoading}
                                    onChange={(e) => setDomainDesc(e.target.value)}
                                    placeholder="Enter your domain name i.e.: E-Scooter Rental Services"
                                />
                                <label htmlFor="suggestedConcepts" className="text-white mt-2">Concepts you want to include separated by comma</label>
                                <Input
                                    id="suggestedConcepts"
                                    className="flex-grow p-1 rounded bg-gray-800"
                                    value={suggestedConcepts}
                                    disabled={isLoading}
                                    onChange={(e) => setSuggestedConcepts(e.target.value)}
                                    placeholder="Enter your concepts i.e.: Scooter, User, booking"
                                />
                            </div>
                        </details>
                        <details className="flex-grow">
                            <summary className="cursor-pointer">Add Ontology (paste the URL in here)</summary>
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
                                        className="bg-green-800 text-white rounded m-1"
                                    >
                                        Load Ontology
                                    </Button>
                                </div>
                            </div>
                        </details>
                    </CardContent>
                    <CardFooter>
                        <CardTitle
                            className={`flex justify-between items-center flex-grow ps-1 ${(concepts.length > 0) ? 'text-green-600' : 'text-green-200'}`}
                        >
                            Ask GPT to suggest Concepts
                            <div className="flex items-center ml-auto">
                                {(isLoading && step === 1) ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 8, marginRight: 8, color: concepts.length > 0 ? 'green' : 'gray' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                    </div>
                                )}
                                <Button onClick={() => {
                                    setStep(1);
                                    handleConceptBuilder();
                                    setActiveTab('suggested-concepts');
                                }}
                                    className={`rounded text-xl p-4 ${(concepts.length > 0) ? 'bg-green-900 text-white' : 'bg-green-700 text-white'}`}
                                >
                                    <FontAwesomeIcon icon={faRobot} size="1x" />
                                </Button>
                            </div>
                        </CardTitle>
                    </CardFooter>
                </Card>
            </div>

            <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-screen">
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
                            <OntologyCard ontologyData={suggestedConceptData} />
                        </div>
                    </>
                </TabsContent>
            </div>
        </div>
    );
}

export default ConceptBuilder;