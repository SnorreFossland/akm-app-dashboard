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
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';   // Updated default prompt text

import { systemPrompt } from '@/app/prompt-builder/prompts';
// Use a revised system prompt that does not ask for the topic.
const revisedSystemPrompt = "Please create the best ChatGPT prompt to provide a summary with main points by evaluating and describe the provided domain.";

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

export default function PromptBuilder() {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('existing-domain-description');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [chatOutput, setChatOutput] = useState<string>("");

    const [prompt, setPrompt] = useState(systemPrompt);
    // const [prompt, setPrompt] = useState({ text: revisedSystemPrompt, domain: "" });
    const [finalPrompt, setFinalPrompt] = useState<string>("");
    const [suggestedDomainData, setSuggestedDomainData] = useState<any>(null);
    const [domainDataDone, setDomainDataDone] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleDispatchDomainData = () => {
        if (!suggestedDomainData) {
            alert('No Domain data to dispatch');
            return;
        }
        dispatch(setDomainData(suggestedDomainData));
        setSuggestedDomainData(null);
        setDispatchDone(true);
    };


    const handleBuildPrompt = async () => {
        console.log("Building prompt...", prompt);
        setIsLoading(true);
        setActiveTab('suggested-concepts');

        try {
            const requestBody = JSON.stringify({ prompt });
            console.log("Request payload:", requestBody);

            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody,
            });

            if (!response.ok) {
                const errorText = await response.statusText
                console.error("Response error text:", response,errorText);
                throw new Error(`Error: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Generated finalPrompt data:", data);
            setChatOutput(data.response); // Ensure 'data.response' is a string 
            setPrompt("");

        } catch (error) {
            console.error("Error building prompt:", error);
            setFinalPrompt("Failed to build prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden">
            <div className="border-solid rounded border-4 border-green-700 w-1/4 h-full flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold mb-2">Prompt Builder</h2>
                {/* Building prompt */}
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleBuildPrompt()
                        }
                    }}
                    rows={10}
                    placeholder="System prompt for building your final prompt..."
                />
                {chatOutput && <div className="chat-output">{chatOutput}</div>}
                <ActionCardTitleButton
                    title="Build Prompt"
                    done={finalPrompt !== "" || !isLoading}
                    onClick={handleBuildPrompt}
                    icon={faRobot}
                />
                {/* <div className="border-solid rounded border-4 border-blue-800 mt-4">
                    {finalPrompt && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Final Prompt:</h3>
                            <Textarea
                                value={finalPrompt}
                                onChange={(e) => setFinalPrompt(e.target.value)}
                                rows={10}
                                className="bg-gray-80 p-2 border rounded"
                            />
                            <ActionCardTitleButton
                                title="Build Domain Description"
                                done={(domainDataDone) || !isLoading}
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
                </div> */}
            </div>

            <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-[calc(100vh-10rem)] overflow-y-hidden">
                <Card className="p-1 h-[calc(100vh-8rem)]">
                    <CardTitle className="flex justify-center text-white m-1">Active Knowledge Canvas (Domain description)</CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                        <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                            <TabsTrigger value="existing-domain-description" className="pb-2 mt-3">Existing Domain description</TabsTrigger>
                            <TabsTrigger value="suggested-domain-description" className="pb-2 mt-3">Suggested Domain description</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing-domain-description" className="m-0 px-1 py-2 rounded bg-background h-full">
                            <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-5rem)]">
                                <ReactMarkdown className="prose prose-lg">
                                    {`${data?.phData?.domain}`}
                                </ReactMarkdown>
                            </div>
                        </TabsContent>
                        <TabsContent value="suggested-domain-description" className="m-0 px-1 py-2 rounded bg-background h-full">
                            <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-15rem)]">
                                <ReactMarkdown className="prose prose-lg h-full w-full">
                                    {/* {(dispatchDone) ? suggestedDomainData : 'suggestedDomainData are dispatched to Store'} */}
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
    );
}




//
// "use client";

// import { useState } from "react";
// import  { Textarea } from "@/components/ui/textarea";
// import { systemPrompt, systemPromptTest } from "@/app/prompt-builder/prompts";

// export default function VercelAiPage() {
//   const [prompt, setPrompt] = useState(systemPrompt);

//   const [chatOutput, setChatOutput] = useState<string>("");


//   const handleSubmit = async () => {
//     try {
//       const response = await fetch("/prompt-builder/api", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ prompt }),
//       });
//       if (!response.ok) {
//         throw new Error(`Error: ${response.statusText}`);
//       }
//       const data = await response.json();
//       setChatOutput(data.response); // Ensure 'data.response' is a string
//       setPrompt("");
//     } catch (error) {
//       console.error('Submit Error:', error);
//       setChatOutput("An error occurred while submitting the prompt.");
//     }
//   };

//   return (
//     <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
//       <button onClick={handleSubmit} className="btn">
//         Submit
//       </button>
//       <h1 className="text-2xl font-bold">AKM Concept Definer</h1>
//       <Textarea
//         value={prompt}
//         onChange={(e) => setPrompt(e.target.value)}
//         onKeyDown={(e) => {
//           if (e.key === "Enter") {
//         handleSubmit();
//           }
//         }}
//         rows={10} // Added this line to make the textarea more lines
//         placeholder="What Domain do you want?"
//       />

//       {chatOutput && <div className="chat-output">{chatOutput}</div>}
//     </div>
//   );
// }