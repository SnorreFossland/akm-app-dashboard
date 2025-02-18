"use client";

import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';

import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { LoadingCircularProgress } from '@/components/loading';
import { setPrompt } from '@/features/model-universe/modelSlice';
import { systemPrompt } from "@/app/prompt-builder/prompts";

export default function VercelAiPage() {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('existing-domain-description');

    const [prompt, setPrompt] = useState(systemPrompt);
    const [chatOutput, setChatOutput] = useState<string>("");
    const [domainPrompt, setDomainPrompt] = useState<any>(null);
    const [domainDataDone, setDomainDataDone] = useState(false);

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
            <CardTitle className="flex justify-center m-1 bg-gray-700 border border-gray-500">
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
    // Updated DispatchCardTitle component using IconButton
    const DispatchCardTitle = ({
        dispatchDone,
        handleDispatchDomainPrompt,
        extraClassName = ""
    }: {
        dispatchDone: boolean;
        handleDispatchDomainPrompt: () => void;
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
                        <IconButton onClick={handleDispatchDomainPrompt} icon={faPaperPlane} />
                    </div>
                </div>
            </CardTitle>
        );
    };

    const handleSubmit = async () => {
        if (!prompt || prompt.trim() === "") {
            console.error("Prompt is empty");
            setChatOutput("Prompt cannot be empty.");
            return;
        }

        console.log("Submitting prompt:", prompt);

        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
            });
            console.log("Request body:", JSON.stringify({ prompt })); // Log the request body
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("138 Response data:", data); // Log the response data
            setChatOutput(data.response); // Ensure 'data.response' is a string
            setDomainPrompt(data.response);
            setPrompt("");
        } catch (error) {
            console.error('Submit Error:', error);
            setChatOutput("An error occurred while submitting the prompt.");
        }
    };

    const handleDispatchDomainPrompt = () => {
        if (!domainPrompt) {
            alert('No Domain data to dispatch');
            return;
        }
        console.log("120 Dispatching Domain data:", domainPrompt);
        dispatch(setPrompt(domainPrompt));
        setDomainPrompt(null);
        setDispatchDone(true);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden">
            <div className="p-2 border-solid rounded border-4 border-green-700 w-2/4 h-full flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold mb-2">Prepare Domain Prompt:</h2>
                <div className="text-sm italic  text-orange-500 mx-2">
                    <span className="font-bold">The answer is 42! ...</span>
                    <span className="text-sm italic text-orange-500 mb-4">
                        &quot;Deep Thought&quot; the Supercomputers  answer of the ultimate question: The meaning of life,
                        the Universe and everything! <br />  ( &quot;The Hitchhiker&apos;s Guide to the Galaxy&quot;)
                    </span>
                </div>
                <hr className="my-2" />
                <div className="text-sm font-bold">Let's ask AI to create an Extraordinary Prompt to define and create a presentation of the Domain/Topic/Theme you choose! </div>

                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSubmit();
                        }
                    }}
                    rows={1}
                    placeholder="What Domain/Topic/Theme do you want the AI to elaborate and describe?"
                />
                {domainPrompt && <div className="chat-output m-2 h-1/4">{domainPrompt || 'domain prompt ezts'}</div>}
                <ActionCardTitleButton
                    title="Start Building the Prompt"
                    done={prompt !== "" || !isLoading}
                    onClick={handleSubmit}
                    icon={faRobot}
                />
                <div className="mt-auto">
                    <DispatchCardTitle
                        dispatchDone={dispatchDone}
                        handleDispatchDomainPrompt={handleDispatchDomainPrompt}
                    />
                </div>
            </div>

            <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-[calc(100vh-10rem)] overflow-y-hidden">
                <Card className="p-1 h-[calc(100vh-8rem)]">
                    <CardTitle className="flex justify-center text-white m-1">Active Knowledge Canvas (Domain description)</CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                        <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                            <TabsTrigger value="existing-domain-description" className="pb-2 mt-3">Existing Domain prompt</TabsTrigger>
                            <TabsTrigger value="suggested-domain-description" className="pb-2 mt-3">Suggested Domain prompt</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing-domain-description" className="m-0 px-1 py-2 rounded bg-background h-full">
                            <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-5rem)]">
                                <ReactMarkdown className="prose prose-lg">
                                    {`${data?.phData?.domain?.prompt}`}
                                </ReactMarkdown>
                            </div>
                        </TabsContent>
                        <TabsContent value="suggested-domain-description" className="m-0 px-1 py-2 rounded bg-background h-full">
                            <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-15rem)]">
                                <ReactMarkdown className="prose prose-lg h-full w-full">
                                    {(dispatchDone) ? domainPrompt : 'suggestedDomainData are dispatched to Store'}
                                </ReactMarkdown>
                            </div>
                            <div className="mt-auto">
                                <DispatchCardTitle
                                    dispatchDone={dispatchDone}
                                    handleDispatchDomainPrompt={handleDispatchDomainPrompt}
                                    extraClassName="float-bottom"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>

    );
}