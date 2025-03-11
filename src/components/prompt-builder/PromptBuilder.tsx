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

import { systemPrompt, systemPromptExample } from '@/app/prompt-builder/prompts';
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
    // State for storing the response from ChatGPT
    const [clarificationResponse, setClarificationResponse] = useState("");
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
    // State to track the last time Enter was pressed
    const [lastEnterPress, setLastEnterPress] = useState<number>(0);
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
        if (phase === "initial" && !domainInput.trim()) {
            console.error("Domain/Topic input is empty");
            setClarificationPrompt("Domain/Topic input cannot be empty.");
            return;
        }

        setIsLoading(true);

        // Combine the original domain input with all collected additional details
        const currentDetails = additionalDetails.trim();

        // If we have new details, add them to collected details
        if (currentDetails && phase === "clarification") {
            setCollectedAdditionalDetails((prev) => {
                const roundNumber = prev ? prev.split('\n\nClarification Round').length : 0;
                return prev ? `${prev}\n\nClarification Round ${roundNumber + 1}:\n${currentDetails}`
                    : `Clarification Round 1:\n${currentDetails}`;
            });
            setAdditionalDetails("");
        }
       
        // Create appropriate prompt based on current phase
        const allDetails = phase === "clarification" ? `${collectedAdditionalDetails}${currentDetails ? `\n\n${currentDetails}` : ''}` : domainInput;


        let clarificationInstruction = ``;
        if (phase === "initial" &&  domainInput) {
            // In clarification phase with no new details, generate questions
            clarificationInstruction = `\n\nDomain:\n\n ${domainInput}"\n\n"${allDetails}", \n generate clarifying 3 questions to ask for further details about the Domain. Use plain text format.`;
        } else if (phase === "clarification") {
            // When in initial phase, summarize the domain and ask clarifying questions
            clarificationInstruction = `Provide a concise summary of this Domain/Topic/Theme: "${domainInput}" ${allDetails}.\n\n
            First, suggest a good Domain definition name but including ${domainInput}.
            Then, provide a 1-2 sentence overview of this domain.
            Then, identify 3 key aspects or focus areas of this domain.`
            // Finally, generate 3 specific questions to gather more details about this domain.`;
        } else {
            // With new details, suggest domain definition based on all collected information
            clarificationInstruction = `Suggest a good Domain definition/scope based on: \n\nDomain/Topic/Theme:\n\n ${domainInput}"\n\n"${collectedAdditionalDetails}}`;
        }

        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: clarificationInstruction }),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json(); // response is the clarification questions
            console.log("173 Clarification data:", data);
            setClarificationPrompt(data.response);
            setClarificationResponse(allDetails);
            setFinalPrompt("The final prompt is under construction.");
            setAdditionalDetails("");
            setPhase("clarification");
            setCurAction("continue");
            setActiveTab("final-suggested-prompt");
        } catch (error) {
            console.error("Error during clarification request:", error);
            setClarificationPrompt("An error occurred while asking for clarification.");
        } finally {
            setIsLoading(false);
        }
    };

    // Second step: Generate the final prompt based on all collected information
    const handleFinalize = async () => {
        setIsLoading(true);

        // Combine all collected information
        const allInformation = collectedAdditionalDetails
        // `${domainInput}\n\nAdditional Information:\n${collectedAdditionalDetails}` :
        // domainInput;
        const allInfo = allInformation.trim() ? `\n\nAdditional Context:\n${allInformation}` : "";

        const finalPromptInstruction = `As a prompt expert, create a detailed prompt template based on the following information:
        \n\nDomain: \n\n${clarificationPrompt}
        ${allInfo}
        \n\nYour task is to generate a well-structured prompt that could be given to an AI assistant.
        \n\nReference the system prompt for guidance: 
        \n\n**System Prompt:**
        \n\n${systemPrompt}
        \n\n**Example System Prompt:**
        \n\n${systemPromptExample}
        `;
        // \n\nYour task is to generate a well-structured prompt that could be given to an AI assistant.  .
        // \n\nReturn only the prompt text without any explanations or meta-commentary.

        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    aiModelName: "gpt-4.5", 
                    prompt: finalPromptInstruction 
                }),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const dataResponse = await response.json();
            console.log("224 Final Prompt Response:", dataResponse);

            // Fix: Only use the response part, not the original prompt
            setFinalPrompt(dataResponse.response);
            setPhase("final");
            setActiveTab("final-suggested-prompt");
        } catch (error) {
            console.error("Error during final prompt generation:", error);
            setFinalPrompt("An error occurred while generating the final prompt.");
        } finally {
            setIsLoading(false);
        }

        console.log("200 Final Prompt Instruction:", finalPromptInstruction);

    };

    // Dispatch the final prompt to the Redux store
    const handleDispatchFinalPrompt = () => {
        if (!finalPrompt.trim()) {
            alert("No final prompt available to dispatch.");
            return;
        }
        console.log("193 Dispatching Final Prompt:", finalPrompt, domainInput, additionalDetails);
        // First, get the existing domain data
        const currentDomainData = data?.phData?.domain || {};
        // Create a complete domain data object that preserves existing values
        const completeData = {
            name: domainInput || currentDomainData.name || "",
            description: currentDomainData.description || "",
            prompt: finalPrompt, // Update with the new prompt
            presentation: currentDomainData.presentation || "",
            // Add any additional context gathered during prompt building
            additionalContext: collectedAdditionalDetails || currentDomainData.additionalContext || ""
        };

        // Dispatch both the prompt and complete domain data
        dispatch(setDomainPrompt(finalPrompt));
        dispatch(setDomainData(completeData));

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
            <CardTitle className="flex justify-start text-gray-400 text-xl">
                <span className="text-active-item me-auto px-2">Prompt Builder</span>
                <span className="mx-auto text-center">AI Powered Active Knowledge Canvas</span>
            </CardTitle>
            <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden">
                <div className="p-1 border-solid rounded border-4 border-green-900 w-2/5 flex flex-col h-full">
                    {/* <h2 className="font-bold mb-2">Generate Perfect Domain Prompt:</h2> */}
                    <div className="h-full min-w-[30rem]">

                        {(phase === "initial") && (
                            <div className="p-1 mb-2 w-full h-full">
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
                                        placeholder={`Provide the Domain/Topic for which you wish to create an extraordinary prompt. \n Ex. Knowledge model for E-Scooter rental service, Wind energy , etc.`}
                                        ref={(input) => {
                                            if (input && phase === "initial") {
                                                input.focus();
                                            }
                                        }}
                                        autoFocus
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
                                    <div className="chat-output p-2 px-2 bg-white bg-opacity-10 overflow-y-auto">{domainInput}</div>
                                    {/* <div className="text-sm font-bold mt-2">{additionalDetails}</div> */}
                                </div>
                                {/* <div className="text-sm font-bold mt-2">Clarification Questions:</div> */}
                                <div className="chat-output bg-gray-800 h-3/6 overflow-y-auto">
                                    <div className="p-3 bg-gray-700 rounded shadow">Clarification...
                                        <div className="chat-output m-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
                                            <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full min-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                                {clarificationResponse}
                                            </ReactMarkdown>
                                        </div>
                                        <div className="text-sm font-bold mt-2">Clarification Questions:</div>
                                        <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full min-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                            {clarificationPrompt}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <div className="text-sm font-bold mt-2">Additional Details (Optional):</div>
                                <Textarea
                                    className="p-1 bg-gray-950 text-white"
                                    value={additionalDetails}
                                    onChange={(e) => setAdditionalDetails(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            // Track when Enter was last pressed
                                            const now = Date.now();
                                            const timeSinceLastEnter = now - lastEnterPress;

                                            // If Enter was pressed within the last 500ms, execute the function
                                            if (timeSinceLastEnter < 2500) {
                                                handleAskForClarification();
                                                setLastEnterPress(0); // Reset timer
                                            } else {
                                                setLastEnterPress(now); // Update the last press time
                                            }
                                        }
                                    }}
                                    rows={10}
                                    placeholder={`For each question above, write your answer on a new line or bullet point.`}
                                    ref={(input) => {
                                        if (input && phase === "clarification") {
                                            input.focus();
                                        }
                                    }}
                                    autoFocus
                                />
                                <div className="mt-auto">
                                    <ActionCardTitleButton
                                        title="Add to Prompt"
                                        done={!isLoading}
                                        onClick={handleAskForClarification}
                                        icon={faRobot}
                                    />
                                    <ActionCardTitleButton
                                        title="Finalize Prompt"
                                        done={curAction === "finalized" && !isLoading}
                                        onClick={handleFinalize}
                                        icon={faCheckCircle}
                                    />
                                </div>
                            </div>
                        )}

                        {phase === "final" && (
                            <div className="p-1 mb-2 h-full">
                                <div className="text-sm font-bold mb-2">Final Perfect Prompt:</div>
                                {editing ? (
                                    <Textarea
                                        className="p-1 bg-gray-950 text-white"
                                        value={finalPrompt}
                                        onChange={(e) => setFinalPrompt(e.target.value)}
                                        rows={20}
                                        placeholder="Edit the final prompt here..."
                                        // ref={(input) => {
                                        //     if (input && phase === "final") {
                                        //         input.focus();
                                        //     }
                                        // }}
                                        // autoFocus
                                    />
                                ) : (
                                    <div className="chat-output m-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
                                        <ReactMarkdown className="prose prose-sm">{finalPrompt}</ReactMarkdown>
                                    </div>
                                )}
                                <div className="text-sm font-bold flex justify-between mt-2">
                                    <IconButton
                                        onClick={() => setEditing(!editing)}
                                        icon={!editing ? faEdit : faCheckCircle}
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
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-solid rounded border-1 border-green-900 h-full w-full overflow-y-hidden">
                    <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
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
                                    <div className="text-white px-2 bg-gray-900 max-h-[calc(100vh-21rem)] overflow-y-auto">
                                        {!editedPrompt ? (
                                            <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
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
                                            onClick={() => { setEditedPrompt(data?.phData?.domain.prompt || ""); setPhase("final"); }}
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
                                <div className=" py-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-20rem)]">
                                    <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full min-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                        {finalPrompt}
                                    </ReactMarkdown>
                                </div>
                                <div className="mb-auto min-w-[50%]">
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



{/* <div className="text-sm text-orange-500 p-1 mb-2 border-dotted border-2 border-orange-600 rounded">
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
                                </div> */}
{/* <div className="text-xs bg-white bg-opacity-10 p-1">
                                    Provide the Domain/Topic for which you wish to create an extraordinary prompt.
                                </div> */}