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

// Use a revised system prompt that does not ask for the topic.
const systemPrompt = "As a domain expert onDomain/Topic supplied, please provide the best extensive presentation ever created. If appropriate, make a dotted list of phases and steps.";

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
    const [isModalOpen, setIsModalOpen] = useState(false);

    // const [prompt, setPrompt] = useSta                                                                                                                                                                             +df
    // te({ text: systemPrompt, domain: "" });
    // const [prompt, setPrompt] = useState({ text: revisedSystemPrompt, domain: "" });
    const [finalPrompt, setFinalPrompt] = useState<string>("test");
    const [suggestedDomainData, setSuggestedDomainData] = useState<any>(null);
    const [domainDataDone, setDomainDataDone] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    useEffect(() => {
        // if (!data.phData.domain.prompt) {
            
            setFinalPrompt(data.phData.domain.prompt);
        // }
    }, []);

    const handleDispatchDomainData = () => {
        if (!suggestedDomainData) {
            alert('No Domain data to dispatch');
            return;
        }
        dispatch(setDomainData(suggestedDomainData));
        // setSuggestedDomainData(null);
        setDispatchDone(true);
    };

     const handleExecutePrompt = async () => {
        console.log("179 Executing prompt for domain...", prompt);
        setActiveTab('suggested-domain-description');
        setIsLoading(true);
        // const systemPrompt = data.phData.domain.prompt;
        const userPrompt = data.phData.domain.prompt;
        setFinalPrompt(data.phData.domain.prompt);
        if (!data.phData.domain.prompt.trim()) {
            alert("Please enter a domain/topic before executing the prompt.");
            setIsLoading(false);
            return;
        }
        console.log("188 Executing prompt for domain...", systemPrompt, userPrompt, data.phData.domain);
        try {
           const res = (systemPrompt) && await fetch("/api/gendomain", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiModelName: "gpt-4o-2024-08-06",
                    schemaName: 'DomainSchema',
                    systemPrompt: systemPrompt || "",
                    // systemBehaviorGuidelines: systemBehaviorGuidelines || "",
                    userPrompt: userPrompt || "",
                    // userInput: userInput || "",
                    // contextItems: contextItems || "",
                    // contextOntology: contextOntology || "",
                    // contextMetamodel: contextMetamodel || ""
                })
            });
            console.log("161 Response:", res);
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

            console.log("201 Generated Domain data:", parsed, data);
            const domainData = {
                name: parsed.domainData.name,
                description: parsed.domainData.description,
                prompt: parsed.domainData.prompt,
                presentation: parsed.domainData.presentation
            };
            console.log("194 Generated Domain data:", domainData);
            setSuggestedDomainData(domainData);
            setDomainDataDone(true);
        } catch (error) {
            console.error("Error building domain data:", error);
            setSuggestedDomainData({ name: "Failed to build domain data.", description: "", presentation: [] });
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] border-solid rounded border-4 border-green-700 w-full bg-transparent">
             <CardTitle className="flex justify-center text-gray-400 m-1 text-xl">AI Powered Active Knowledge Canvas (Domain Builder)</CardTitle>
            <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden">
                <div className="border-solid rounded border-4 border-green-900 w-1/4 h-full flex flex-col overflow-y-auto">
                    <h2 className="text-xl font-bold mb-2">Define Domain Scope (Summary)</h2>
                    <div className="border-solid rounded border-4 border-blue-800 mt-4">
                        <h3 className="font-semibold">Domain Prompt:</h3>
                        {finalPrompt && (
                            <div className="mt-4">
                                <TextareaAutosize
                                    className="bg-gray-80 p-2 border rounded"
                                    value={finalPrompt}
                                    onChange={(e) => setFinalPrompt(e.target.value)}
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
                                <TabsTrigger value="existing-domain-description" className="pb-2 mt-3">Existing Domain Summary</TabsTrigger>
                                <TabsTrigger value="suggested-domain-description" className="pb-2 mt-3">Suggested Domain Summary</TabsTrigger>
                            </TabsList>
                            <TabsContent value="existing-domain-description" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-2 p-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                    <div className="text-white px-2 bg-gray-800 h-[calc(100vh-21rem)] overflow-y-auto">
                                        {/* {!editedDomainPresentation
                                            ? */}
                                            <ReactMarkdown className="prose prose-xs text-white custom-markdown">
                                                {`${data?.phData?.domain.presentation}`}
                                            </ReactMarkdown>
                                            {/* :
                                            <Textarea
                                                className="p-2 bg-gray-900 text-lg text-gray-300"
                                                value={editedPrompt}
                                                onChange={(e) => setEditedPrompt(e.target.value)}
                                                rows={20}
                                                placeholder="Edit the stored prompt here..."
                                            />
                                        } */}
                                    </div>
                                    {/* <div className="flex justify-between bg-gray-700">
                                        <IconButton
                                            onClick={() => setEditedPrompt(data?.phData?.domain.prompt || "")}
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
                                    />*/}
                                </div>
                            </TabsContent>
                            <TabsContent value="suggested-domain-description" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-1 px-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-17rem)]">
                                    <ReactMarkdown className="prose prose-lg h-full w-full">
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