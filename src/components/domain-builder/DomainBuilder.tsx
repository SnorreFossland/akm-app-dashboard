'use client';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setDomainData } from '@/features/model-universe/modelSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingCircularProgress } from '@/components/loading';
import TextareaAutosize from 'react-textarea-autosize';
import { systemPrompt } from '@/app/domain-builder/prompts';


// New reusable IconButton component
const IconButton = ({
    onClick,
    icon,
    className = "",
    iconWidth = "26px",
    iconSize = "1x"
}: {
    onClick: () => void;
    icon: any;
    className?: string;
    iconWidth?: string;
    iconSize?: string;
}) => {
    return (
        <Button
            onClick={onClick}
            className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}
        >
            <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
        </Button>
    );
};

// Updated DispatchCardTitle component using IconButton
const DispatchCardTitle = ({
    dispatchDone,
    handleDispatchDomainData,
    extraClassName = ""
}: {
    dispatchDone: boolean;
    handleDispatchDomainData: () => void;
    extraClassName?: string;
}) => {
    return (
        <CardTitle
            className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${extraClassName} ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
        >
            <div className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}>
                Save to current Store
                <div className="flex items-center ml-auto">
                    {!dispatchDone ? (
                        <div style={{ marginLeft: 8, marginRight: 8 }}>
                            <LoadingCircularProgress />
                        </div>
                    ) : (
                        <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
                            <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                        </div>
                    )}
                    <IconButton onClick={handleDispatchDomainData} icon={faPaperPlane} />
                </div>
            </div>
        </CardTitle>
    );
};

// New reusable ActionCardTitleButton component
const ActionCardTitleButton = ({
    title,
    done,
    onClick,
    icon
}: {
    title: string;
    done: boolean;
    onClick: () => void;
    icon: any;
}) => {
    return (
        <CardTitle className="flex justify-center m-1">
            <div className={`flex justify-between items-center flex-grow ${done ? 'text-green-600' : 'text-green-200'}`}>
                {title}
                <div className="flex items-center ml-auto">
                    {!done ? (
                        <div style={{ marginLeft: 8, marginRight: 8 }}>
                            <LoadingCircularProgress />
                        </div>
                    ) : (
                        <div style={{ marginLeft: 8, marginRight: 8, color: done ? 'green' : 'gray' }}>
                            <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                        </div>
                    )}
                    <IconButton onClick={onClick} icon={icon} />
                </div>
            </div>
        </CardTitle>
    );
};

export default function DomainBuilder() {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('existing-domain-description');

    // const [prompt, setPrompt] = useSta                                                                                                                                                                             +df
    // te({ text: systemPrompt, domain: "" });
    // const [prompt, setPrompt] = useState({ text: revisedSystemPrompt, domain: "" });
    const [systemPrompt, setSystemPrompt] = useState<string>("");
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState<string>("");
    const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
    const [userPrompt, setUserPrompt] = useState<string>("");
    const [userInput, setUserInput] = useState<string>("");
    const [contextItems, setContextItems] = useState<string>("");
    const [finalPrompt, setFinalPrompt] = useState<string>("");
    const [suggestedDomainData, setSuggestedDomainData] = useState<any>(null);
    const [domainDataDone, setDomainDataDone] = useState(false);

    useEffect(() => {
        setSystemPrompt(systemPrompt);
        // setSystemPrompt(`As a domain expert, please provide a comprehensive domain definition based on the user prompt. Include the domain name and description and detailed and a thorough presentation with key concepts, processes, and relationships.\n\n`);
        setSystemBehaviorGuidelines(`Ensure the presentation section includes multiple paragraphs covering all aspects of the domain with examples where appropriate.`);
        setGeneratedPrompt(data.phData.domain.prompt);
        setContextItems( data.phData.domain.name + data.phData.domain.description + data.phData.domain.presentation || ""); // existing presentation
    }, []);

    useEffect(() => {
        if (generatedPrompt.trim()) {
            setFinalPrompt(systemPrompt + systemBehaviorGuidelines + generatedPrompt);
            console.log("139 Generated Prompt: 1", systemPrompt, '2', systemBehaviorGuidelines, '3', finalPrompt);
        }
        console.log("141nGenerated Prompt: 1", systemPrompt, '2', systemBehaviorGuidelines, '3', finalPrompt);
    }, [generatedPrompt]);

    const handleDispatchDomainData = () => {
        if (!suggestedDomainData) {
            alert('No Domain data to dispatch');
            return;
        }

        // Ensure we're dispatching the complete domain data structure
        const completeData = {
            name: suggestedDomainData.name || "",
            description: suggestedDomainData.description || "",
            prompt: finalPrompt, // Use the current finalPrompt value
            presentation: suggestedDomainData.presentation || ""
        };

        dispatch(setDomainData(completeData));
        setDispatchDone(true);
    };

    const handleExecutePrompt = async () => {
        setActiveTab('suggested-domain-description');
        setIsLoading(true);
        setDomainDataDone(false);

        // Use a revised system prompt that does not ask for the topic.
        // const systemPrompt = "As a domain expert onDomain/Topic supplied, please provide the best extensive presentation ever created. If appropriate, make a dotted list of phases and steps.";
        // setSystemPrompt(`As a domain expert, please provide a comprehensive domain definition based on the user prompt. Include detailed sections for the domain name, description, and a thorough presentation with key concepts, processes, and relationships.\n\n`);
        // setSystemBehaviorGuidelines(`Create an extensive domain model with detailed explanation, structure, and practical applications. Ensure the presentation section includes multiple paragraphs covering all aspects of the domain with examples where appropriate.`);

        if (!finalPrompt.trim()) {
            alert("Please enter a domain/topic before executing the prompt.");
            setIsLoading(false);
            return;
        }
     
        try {
            const controller = new AbortController();
            const signal = controller.signal;
            // Set a timeout to abort the request if it takes too long
            const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            console.log("174 Executing prompt: 1:", systemPrompt, '2:', systemBehaviorGuidelines, '3:', generatedPrompt); 
            const res = await fetch("/api/gendomain", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiModelName: "gpt-4o-2024-08-06",
                    schemaName: 'DomainSchema',
                    systemPrompt: systemPrompt || "",
                    systemBehaviorGuidelines: systemBehaviorGuidelines || "",
                    userPrompt: generatedPrompt || "",
                    // userInput: userInput || "",
                    contextItems: contextItems  || "",
                    // contextOntology: "",
                    // contextMetamodel: ""
                }),
                signal // Add abort signal to the fetch request
            });

            clearTimeout(timeout);

            if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");
            const decoder = new TextDecoder();
            let data = "";
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    data += decoder.decode(value, { stream: true });
                }

                // Final decode to flush any remaining bytes
                decoder.decode();

                const parsed = JSON.parse(data);
                console.log("Generated Domain data:", parsed);

                const domainData = {
                    name: parsed.domainData.name || "Untitled Domain",
                    description: parsed.domainData.description || "",
                    prompt: systemPrompt+systemBehaviorGuidelines+finalPrompt,
                    additionalContext: parsed.domainData.additionalContext || "",
                    presentation: parsed.domainData.presentation || ""
                };

                setSuggestedDomainData(domainData);
                setDomainDataDone(true);
            } catch (streamError) {
                console.error("Error processing stream:", streamError);
                reader.cancel("Stream processing error").catch(console.error);
                throw streamError;
            }
        } catch (error) {
            console.error("Error building domain data:", error);
            setSuggestedDomainData({
                name: "Error",
                description: `Failed to build domain data: ${error.message}`,
                presentation: ""
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] border-solid rounded border-4 border-green-700 w-full bg-transparent">
            <CardTitle className="flex justify-start text-gray-400 text-xl">
                 <span className="text-active-item me-auto px-2">Domain Scope Builder</span>
                 <span className="mx-auto text-center">AI Powered Active Knowledge Canvas</span>
             </CardTitle>
            <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden">
                <div className="border-solid rounded border-4 border-green-900 w-1/4 h-full flex flex-col overflow-y-auto">
                    <h2 className="text-xl font-bold mb-2">Define Domain Scope (Summary)</h2>
                    <div className="border-solid rounded border-4 border-blue-800 mt-4">
                        <h3 className="font-semibold">Domain Prompt:</h3>
                        {finalPrompt && (
                            <div className="mt-4">
                                <TextareaAutosize
                                    className="bg-gray-80 p-2 border rounded"
                                    value={generatedPrompt}
                                    onChange={(e) => setGeneratedPrompt(e.target.value)}
                                    minRows={5}
                                    maxRows={18}
                                    style={{ width: "100%" }}
                                />
                                <ActionCardTitleButton
                                    title="Generate Domain Summary"
                                    done={domainDataDone || !isLoading}
                                    onClick={handleExecutePrompt}
                                    icon={faRobot}
                                />
                            </div>
                        )}
                    </div>
                    <div className="mt-auto">
                        <DispatchCardTitle
                            dispatchDone={dispatchDone}
                            handleDispatchDomainData={handleDispatchDomainData}
                        />
                    </div>
                </div>
                {/* ------------- */}
                <div className="border-solid rounded border-1 border-green-900 w-3/4 h-full overflow-y-hidden">
                    <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                            <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                                <TabsTrigger value="existing-domain-description" className="pb-2 mt-3">Domain Summary</TabsTrigger>
                                <TabsTrigger value="suggested-domain-description" className="pb-2 mt-3">Suggested Domain Summary</TabsTrigger>
                            </TabsList>
                            <TabsContent value="existing-domain-description" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-2 p-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                    <div className="text-white px-2 bg-gray-800 h-[calc(100vh-17rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                        <ReactMarkdown className="prose prose-sm text-white w-full custom-markdown">
                                            {`## Name: ${data?.phData?.domain.name}\n\n### Description:\n${data?.phData?.domain.description}\n\n### Presentation:\n${data?.phData?.domain.presentation}`}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="suggested-domain-description" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-1 px-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-17rem)]">
                                    <ReactMarkdown className="prose prose-sm h-full w-full">
                                        {(suggestedDomainData)
                                            ? `## Name: ${suggestedDomainData.name}\n\n### Description:\n${suggestedDomainData.description}\n\n### Presentation:\n${suggestedDomainData.presentation}`
                                            : 'The generated DomainData are dispatched to Store'}
                                    </ReactMarkdown>
                                </div>
                                <div className="mt-auto">
                                    <DispatchCardTitle
                                        dispatchDone={dispatchDone}
                                        handleDispatchDomainData={handleDispatchDomainData}
                                        extraClassName="float-bottom"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}

{/* <ReactMarkdown className="prose prose-lg">
    {`${data?.phData?.domain.presentation}`}
</ReactMarkdown> */}