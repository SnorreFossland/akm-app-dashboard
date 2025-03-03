"use client";
import React from "react";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink } from "@fortawesome/free-solid-svg-icons";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { LoadingCircularProgress } from "@/components/loading";
import { setDomainPrompt, deleteDomainPrompt, setDomainData } from "@/features/model-universe/modelSlice";

import { systemPrompt } from '@/app/prompt-builder/prompts';
// import { set } from "zod";

export default function VercelAiPage() {
    const data = useSelector((state) => state.modelUniverse);
    const dispatch = useDispatch();

    // Phase can be "initial", "clarification", or "final"
    const [phase, setPhase] = useState("initial");

    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("existing-prompt");

    // State for initial domain input
    const [domainInput, setDomainInput] = useState("");
    // State for clarifying questions returned by ChatGPT
    const [clarificationPrompt, setClarificationPrompt] = useState("");
    // States for additional details and confirmation after clarification
    const [additionalDetails, setAdditionalDetails] = useState("");
    // New state to accumulate multiple rounds of additional details
    const [collectedAdditionalDetails, setCollectedAdditionalDetails] = useState("");
    // State for the final prompt
    const [finalPrompt, setFinalPrompt] = useState("");
    // State for editing the existing prompt
    const [editedPrompt, setEditedPrompt] = useState("");
    // State for editing the final prompt
    const [editing, setEditing] = useState(true);
    // State for the current action (continue or finalize)
    const [curAction, setCurAction] = useState<"continue" | "finalize" | "finalized">("finalize");
    // Reusable IconButton component
    interface IconButtonProps {
        onClick: () => void;
        icon: any;
        className?: string;
        iconWidth?: string;
        iconSize?: SizeProp;
    }

    const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
        return (
            <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
                <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
            </Button>
        );
    };

    // Reusable ActionCardTitleButton component
    interface ActionCardTitleButtonProps {
        title: string;
        done: boolean;
        onClick: () => void;
        icon: any;
    }

    const ActionCardTitleButton: React.FC<ActionCardTitleButtonProps> = ({ title, done, onClick, icon }) => {
        return (
            <CardTitle className="flex justify-center m-1 mb-auto bg-gray-700 border border-gray-500">
                <div className={`flex justify-between items-center flex-grow ps-2 ${done ? "text-green-600" : "text-green-200"}`}>
                    {title}
                    <div className="flex items-center ml-auto">
                        {!done ? (
                            <div style={{ marginLeft: 8, marginRight: 8 }}>
                                <LoadingCircularProgress />
                            </div>
                        ) : (
                            <div style={{ marginLeft: 8, marginRight: 8, color: done ? "green" : "gray" }}>
                                <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                            </div>
                        )}
                        <IconButton onClick={onClick} icon={icon} />
                    </div>
                </div>
            </CardTitle>
        );
    };

    // Dispatch component updated to use the final prompt
    interface DispatchCardTitleProps {
        dispatchDone: boolean;
        handleDispatchFinalPrompt: () => void;
        extraClassName?: string;
    }

    const DispatchCardTitle: React.FC<DispatchCardTitleProps> = ({ dispatchDone, handleDispatchFinalPrompt, extraClassName = "" }) => {
        return (
            <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${extraClassName} ${dispatchDone ? "text-green-600" : "text-green-200"
                    }`}
            >
                <div className={`flex justify-between items-center flex-grow ${dispatchDone ? "text-green-600" : "text-green-200"}`}>
                    Save Final Prompt to Store
                    <div className="flex items-center ml-auto">
                        {!dispatchDone ? (
                            <div style={{ marginLeft: 8, marginRight: 8 }}>
                                <LoadingCircularProgress />
                            </div>
                        ) : (
                            <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? "green" : "gray" }}>
                                <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                            </div>
                        )}
                        <IconButton onClick={handleDispatchFinalPrompt} icon={faPaperPlane} />
                    </div>
                </div>
            </CardTitle>
        );
    };

    // First step: Ask for clarification based on the domain input
    const handleAskForClarification = async () => {
        if (!domainInput.trim()) {
            console.error("Domain/Topic input is empty");
            setClarificationPrompt("Domain/Topic input cannot be empty.");
            return;
        }
        setIsLoading(true);

        const clarificationInstruction = `${systemPrompt}  Domain/Topic/Theme: "${domainInput}", `

        // const clarificationInstruction = `
        // You are a prompt expert. For the Domain/Topic/Theme: "${domainInput}", 
        // generate clarifying questions asking the user for further details (e.g., unique features, objectives, phases, challenges, and context). 
        // Audience: AI model. Audience's Goal: To generate a perfect prompt for describing a domain.
        // Format: Markdown.
        // Do not generate the final prompt yet; simply ask for clarification.`;


        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: clarificationInstruction }),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("121 Clarification  data:", data);
            setClarificationPrompt(data.response);
            setFinalPrompt(data.prompt);
            setPhase("clarification");
        } catch (error) {
            console.error("Error during clarification request:", error);
            setClarificationPrompt("An error occurred while asking for clarification.");
        } finally {
            setIsLoading(false);
        }
    };

    // Second step: Either continue adding details or generate the final prompt
    const handleFinalizeOrContinue = async (action: "continue" | "finalize") => {
        // Combine the original domain input with all collected additional details and any current additional details
        setCurAction(action);
        const currentDetails = additionalDetails.trim();
        const allDetails = [collectedAdditionalDetails, currentDetails].filter(Boolean).join("\n");
        const combinedInput = allDetails ? `${domainInput}\nAdditional details: ${allDetails}` : domainInput;
        setAdditionalDetails("");
        setIsLoading(true);
        const finalPromptInstruction = `You are a prompt expert. Based on the following Domain/Topic/Theme information and additional details: 
        "${combinedInput}", generate a perfect, detailed, and unambiguous prompt that instructs an AI to elaborate, analyze, and creatively describe the domain, with phases, aspects topology
        Add an example of the expected output including phases, aspects, and topology.
        **Format:** Markdown.
        `;
        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPromptInstruction }),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const dataResponse = await response.json();
            console.log("Final Prompt Response:", dataResponse);
            if (action === "continue") {
                // Append the current additional details (if any) to the collected additional details
                const newDetails = additionalDetails.trim();
                if (newDetails) {
                    setCollectedAdditionalDetails((prev) => (prev ? prev + "\n" + newDetails : newDetails));
                }
                setFinalPrompt(dataResponse.response);
                setClarificationPrompt(dataResponse.response);
                setActiveTab("final-suggested-prompt");
                setPhase("clarification");
                setIsLoading(false);
                // setPhase("clarification");
                // Clear the input fields to allow further additions
                if (additionalDetails === "") {
                    alert("Additional details added. You may continue to add more details or finalize the prompt.");
                }
                return;
            } else if (action === "finalize") {
                setFinalPrompt(dataResponse.response);
                setPhase("final");
                setActiveTab("final-suggested-prompt");
                setCurAction("finalized");
            }
        } catch (error) {
            console.error("Error during final prompt generation:", error);
            setFinalPrompt("An error occurred while generating the final prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    // Dispatch the final prompt to the Redux store
    const handleDispatchFinalPrompt = () => {
        if (!finalPrompt.trim()) {
            alert("No final prompt available to dispatch.");
            return;
        }
        console.log("193 Dispatching Final Prompt:", finalPrompt, domainInput, additionalDetails);
        dispatch(setDomainPrompt(finalPrompt));
        dispatch(setDomainData({ name: domainInput, description: "", prompt: finalPrompt, presentation: "" }));
        setDispatchDone(true);
        setActiveTab("existing-prompt");
    };

    // Dispatch the edited prompt to the Redux store
    const handleDispatchEditedPrompt = () => {
        if (!editedPrompt.trim()) {
            alert("No edited prompt available to dispatch.");
            return;
        }
        console.log("205 Dispatching Edited Prompt:", editedPrompt);
        dispatch(setDomainPrompt(editedPrompt));
        setDispatchDone(true);
        setEditedPrompt("");
    };

    // Delete the prompt from the Redux store
    const handleDeletePrompt = () => {
        dispatch(deleteDomainPrompt());
        setEditedPrompt("");
        setFinalPrompt("");
        setDomainInput("");
        setPhase("initial");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] border-solid rounded border-4 border-green-800 w-full bg-transparent">
            <CardTitle className="flex justify-center text-gray-400 text-xl">
                AI Powered Active Knowledge Canvas (Prompt Builder)
            </CardTitle>
            <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden">
                <div className="p-1 border-solid rounded border-4 border-green-900 w-2/5 flex flex-col h-full">
                    <h2 className="font-bold mb-2">Generate Perfect Domain Prompt:</h2>
                    <div className="h-full">
                        {(phase === "initial") && (
                            <div className="p-1 mb-2 w-full h-full">
                                <div className="text-sm text-orange-500 p-1 mb-2 border-dotted border-2 border-orange-600 rounded">
                                    <span className="text-xs italic text-orange-500 mb-2">
                                        As the Supercomputer "Deep Thought" in The "Hitchhiker’s Guide to the Galaxy" replied :<br />
                                        «The Answer to the Ultimate Question of Life, the Universe, and Everything is » :
                                    </span>
                                    <span className="text-xl font-bold animate-bounce"> "42"</span>
                                    <hr className="my-2 bg-green-500" />
                                    <span className="text-xs italic text-orange-400 mb-4">
                                        But we are here, to create the best Question (Prompt), ever written.
                                    </span>
                                    <span className="text-xl font bold"> 😄</span>
                                </div>
                                <div className="text-xs bg-white bg-opacity-10 p-1">
                                    Provide the Domain/Topic for which you wish to create an extraordinary prompt.
                                </div>
                                <div className="text-sm font-bold text-white p-1 mt-auto overflow-y-hidden">Enter a Domain/Topic/Theme below:
                                    <Textarea
                                        className="p-1 bg-gray-950 text-white"
                                        value={domainInput}
                                        onChange={(e) => setDomainInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleAskForClarification();
                                            }
                                        }}
                                        rows={10}
                                        placeholder="ex. Knowledge model for E-Scooter rental service, Wind energy , etc."
                                    />
                                </div>
                                <div className="">
                                    <ActionCardTitleButton
                                        title="Generate prompt"
                                        done={!isLoading && !finalPrompt}
                                        onClick={handleAskForClarification}
                                        icon={faRobot}
                                    />
                                </div>
                            </div>
                        )}

                        {phase === "clarification" && (
                            <div className="p-1 mb-2 w-full h-full">
                                <div className="p-1 text-sm font-bold px-1 bg-white bg-opacity-5 ">Domain:
                                    <span className="chat-output p-2 px-2 bg-white bg-opacity-10 overflow-y-auto">{domainInput}</span>
                                </div>
                                <div className="text-sm font-bold mt-2">Clarification Questions:</div>
                                <div className="chat-output bg-gray-800 h-3/6 overflow-y-auto">
                                    <ReactMarkdown className="prose prose-sm">{clarificationPrompt}</ReactMarkdown>
                                </div>
                                <div className="text-sm font-bold mt-2">Additional Details (Optional):</div>
                                <Textarea
                                    className="p-1 bg-gray-950 text-white"
                                    value={additionalDetails}
                                    onChange={(e) => setAdditionalDetails(e.target.value)}
                                    rows={10}
                                    placeholder={`For each question above, write your answer on a new line or bullet point. For example:\n1. [Answer to question 1]\n2. [Answer to question 2]`}
                                />
                                <div className="mt-auto">
                                    {/* <ActionCardTitleButton
                                        title="Continue Adding Details"
                                        done={!isLoading}
                                        onClick={() => handleFinalizeOrContinue("continue")}
                                        icon={faRobot}
                                    /> */}
                                    <ActionCardTitleButton
                                        title="Finalize Prompt"
                                        done={curAction === "finalized" && !isLoading}
                                        onClick={() => handleFinalizeOrContinue("finalize")}
                                        icon={faCheckCircle}
                                    />
                                </div>
                            </div>
                        )}

                        {phase === "final" && (
                            <>
                                <div className="text-sm font-bold mb-2">Final Perfect Prompt:</div>
                                {/* {editing ? (
                                */}
                                <div className="chat-output m-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
                                    <ReactMarkdown className="prose prose-sm">{finalPrompt}</ReactMarkdown>
                                    </div>)
                                <div className="text-sm font-bold flex justify-between mt-2">
                                    <IconButton
                                        onClick={() => setEditing(!editing)}
                                        icon={editing ? faEdit : faCheckCircle}
                                        className="m-2 w-full"
                                    />
                                </div>
                                <div className="mb-auto">
                                    <hr className="m-2 height-2 bg-green-700 border-orange-900" />
                                    <DispatchCardTitle
                                        dispatchDone={dispatchDone}
                                        handleDispatchFinalPrompt={handleDispatchFinalPrompt}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="border-solid rounded border-1 border-green-900 w-3/4 h-full overflow-y-hidden">
                    <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full bg-transparent">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                            <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                                <TabsTrigger value="existing-prompt" className="pb-2 mt-3">
                                    Stored Prompt
                                </TabsTrigger>
                                <TabsTrigger value="final-suggested-prompt" className="pb-2 mt-3">
                                    Final Suggested Prompt
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="existing-prompt" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-2 p-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                    <div className="text-white px-2 bg-gray-800 max-h-[calc(100vh-21rem)] overflow-y-auto">
                                        {!editedPrompt ? (
                                            <ReactMarkdown className="prose prose-xs text-white custom-markdown">
                                                {`${data?.phData?.domain.prompt || "No existing prompt in store."}`}
                                            </ReactMarkdown>
                                        ) : (
                                            <Textarea
                                                className="p-2 bg-gray-900 text-lg text-gray-300"
                                                value={editedPrompt}
                                                onChange={(e) => setEditedPrompt(e.target.value)}
                                                rows={20}
                                                placeholder="Edit the stored prompt here..."
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between bg-gray-700">
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
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="final-suggested-prompt" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-1 py-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-20rem)]">
                                    <ReactMarkdown className="prose prose-lg">
                                        {finalPrompt}
                                    </ReactMarkdown>
                                </div>
                                <div className="mb-auto">
                                    <DispatchCardTitle
                                        dispatchDone={dispatchDone}
                                        handleDispatchFinalPrompt={handleDispatchFinalPrompt}
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