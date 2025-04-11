//  Prompt Builder
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { deleteDomainPrompt, setDomainData } from "@/features/model-universe/modelSlice";
import { RootState } from "@/store"; // Ensure you have the correct path to your store file

import { systemPrompt, systemPromptExample } from '@/app/prompt-builder/prompts';
import { callbackify } from "util";
// import { json } from "stream/consumers";
// import { set } from "zod";

interface IconButtonProps {
    onClick: () => void;
    icon: any;
    className?: string;
    iconWidth?: string;
    iconSize?: SizeProp;
}
interface ActionCardTitleButtonProps {
    title: string;
    done: boolean;
    onClick: () => void;
    icon: any;
}
interface DispatchCardTitleProps {
    dispatchDone: boolean;
    handleDispatchFinalPrompt: () => void;
    extraClassName?: string;
}

export default function VercelAiPage() {

    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();

    // Phase can be "initial", "clarification", or "final"
    const [phase, setPhase] = useState("initial");

    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("introduction");

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
    // State for selected model
    const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
    const [dividerPosition, setDividerPosition] = useState(40); // 40% default width for left panel
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const startDragging = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const stopDragging = () => {
        setIsDragging(false);
    };

    const onDrag = useCallback((e: MouseEvent) => {
        if (isDragging && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width;

            // Calculate position relative to container
            const relativeX = e.clientX - containerRect.left;
            const newPosition = (relativeX / containerWidth) * 100;

            // Limit the resize range (minimum 20%, maximum 80%)
            const limitedPosition = Math.max(20, Math.min(80, newPosition));
            setDividerPosition(limitedPosition);
        }
    }, [isDragging]);

    // Add these effects for handling mouse events
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDragging);
        }

        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDragging);
        };
    }, [isDragging, containerRef, onDrag]);

    // Reusable IconButton component


    const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
        return (
            <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
                <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
            </Button>
        );
    };

    // Reusable ActionCardTitleButton component


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


    const DispatchCardTitle: React.FC<DispatchCardTitleProps> = ({ dispatchDone, handleDispatchFinalPrompt, extraClassName = "" }) => {
        return (
            <CardTitle
                className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${extraClassName} ${dispatchDone ? "text-green-600" : "text-green-200"
                    }`}
            >
                <div className={`flex justify-between items-center flex-grow ${dispatchDone ? "text-green-600" : "text-green-200"}`}>
                    Keep Final Prompt
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
        if (phase === "initial" && domainInput) {
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
            console.log("125 Clarification Instruction:", clarificationInstruction);

            let response;
            if (selectedModel === "dummy") {
                // Use dummy response for testing
                response = {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => ({
                        response: `# AI-Generated Domain Analysis

                ## Domain: ${domainInput}

                ### Summary
                This is a dummy response for testing purposes. The actual AI would provide a detailed analysis of your domain.

                ### Key Aspects
                1. First key aspect of this domain
                2. Second important consideration
                3. Third notable element

                ### Follow-up Questions
                1. What specific problems are you trying to solve in this domain?
                2. Who are the key stakeholders or users in this context?
                3. What existing solutions or approaches have you considered?`
                    })
                };
            } else {
                // Use real API
                response = await fetch("/api/genprompt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: clarificationInstruction,
                        aiModelName: selectedModel
                    }),
                });
            }
            if (!response.ok) {
                const errorData = await response.json();
                // Display the error message to the user
                console.error("API Error:", errorData.error);
                setClarificationPrompt(`Error: ${errorData.error}`);
                return;
            }
            const data = await response.json();
            console.log("173 Clarification data:", data);
            setClarificationPrompt(data.response);
            setClarificationResponse(allDetails);
            setFinalPrompt("The final prompt is under construction.");
            setAdditionalDetails("");
            setPhase("clarification");
            setCurAction("continue");
            // setActiveTab("final-suggested-prompt");
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
        setCurAction("finalized");
        // Combine all collected information
        const allInformation = collectedAdditionalDetails
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


        try {
            let dataResponse;
            if (selectedModel === "dummy") {
                // Use dummy response
                dataResponse = {
                    response: `# AI-Generated Domain Prompt for ${domainInput}

## System Prompt
You are an expert in ${domainInput}. Your task is to provide clear, accurate, and helpful information about this domain.

## User Guidelines
1. Ask specific questions about ${domainInput}
2. Provide context for your query
3. Specify the depth of information you need

## Response Format
The assistant will provide structured responses with:
- Clear explanations
- Relevant examples
- Citations where applicable
- Next steps or additional considerations`
                };
            } else {
                // Use real API
                const response = await fetch("/api/genprompt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        aiModelName: selectedModel,
                        prompt: finalPromptInstruction
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    // Display the error message to the user
                    console.error("API Error:", errorData.error);
                    setClarificationPrompt(`Error: ${errorData.error}`);
                    return;
                }
                dataResponse = await response.json();
            }

            console.log("224 Final Prompt Response:", dataResponse);
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
        // Add this function to your existing code

        const extractDomainInfo = (clarificationResponse: string) => {
            // Extract domain name
            const nameMatch = clarificationResponse.match(/Domain Definition Name:?\s*(.*?)(?:\n|\r|$)/i);
            const name = nameMatch ? nameMatch[1].trim() : "";

            // Extract overview
            const overviewMatch = clarificationResponse.match(/Overview:?\s*(.*?)(?=\n\n|Key Aspects:|$)/is);
            const overview = overviewMatch ? overviewMatch[1].trim() : "";

            // Extract key aspects
            const aspectsMatch = clarificationResponse.match(/Key Aspects:?\s*([\s\S]*?)(?=\n\n|$)/i);
            let keyAspects: string[] = [];

            if (aspectsMatch && aspectsMatch[1]) {
                // Split by line breaks and extract aspect titles
                const aspectLines = aspectsMatch[1].split("\n").filter(line => line.trim());
                keyAspects = aspectLines.map(line => {
                    // Extract aspect name before the dash or colon if present
                    const aspectMatch = line.match(/[•\-–]?\s*(.*?)(?:\s+[–\-–]\s+|\s*:\s*|$)/);
                    return aspectMatch ? aspectMatch[1].trim() : line.trim();
                });
            }

            return {
                name,
                overview,
                keyAspects
            };
        };

        const domainInfo = extractDomainInfo(clarificationResponse);

        const completeData = {
            name: domainInfo.name || currentDomainData.name || "",
            description: (domainInfo.overview + " " + domainInfo.keyAspects.join(", ")) || currentDomainData.description || "",
            prompt: finalPrompt, // Update with the new prompt
            presentation: currentDomainData.presentation || "",
            // Add any additional context gathered during prompt building
            additionalContext: collectedAdditionalDetails || currentDomainData.additionalContext || ""
        };

        // Use setDomainData instead of the non-existent setDomainPrompt
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

        // Get current domain data
        const currentDomainData = data?.phData?.domain || {};

        // Create updated domain data with new prompt
        const updatedData = {
            ...currentDomainData,
            prompt: editedPrompt
        };

        // Use setDomainData instead of setDomainPrompt
        dispatch(setDomainData(updatedData));
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
            <CardTitle className="flex justify-start items-center text-gray-400 text-xl">
                <span className="text-active-item me-auto px-2">Prompt Builder</span>
                <span className="mx-auto text-center">AI Powered Active Knowledge Canvas</span>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm">Model:</span>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-gray-800 text-white text-xs rounded p-1 border border-gray-700"
                    >
                        <option value="deepseek-coder">Deepseek Coder</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="mistral-large">Mistral Large</option>
                        <option value="dummy">Dummy (Testing)</option>
                    </select>
                    {clarificationPrompt?.includes("Insufficient Balance") && (
                        <span className="text-xs text-red-500">⚠️ Account balance issue</span>
                    )}
                </div>
            </CardTitle>
            <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden" ref={containerRef}>
                <div className="p-1 border-solid rounded border-4 border-green-900 flex flex-col h-full max-w-3/4 self-start" style={{ width: `${dividerPosition}%` }}>
                    {/* <h2 className="font-bold mb-2">Generate Perfect Domain Prompt:</h2> */}
                    <div className="h-full w-full overflow-y-hidden">
                        {(phase === "initial") && (
                            <div className="p-1 w-full h-full flex flex-col">
                                <div className="flex flex-col h-full w-full">
                                    {/* Chat welcome message */}
                                    <div className="flex-grow overflow-y-auto p- flex flex-col">
                                        <div className="bg-gray-800 rounded-lg px-4">
                                            <div className="flex items-center mb-1">
                                                <FontAwesomeIcon icon={faRobot} className="mr-1 text-green-500 text-xs" />
                                                <span className="font-medium text-green-400 text-sm">AI Assistant</span>
                                            </div>
                                            <p className="text-white">Welcome! I&apos;m here to help you build the best prompt to ask for definition and description of a Subject or Domain. </p>
                                            <p className="text-gray-400 text-sm mt-2">You start with Domain name or keywords for your domain, and the AI Assistant will ask you for more data input. The final Prompt will be used in next step to create this definition.</p></div>
                                        {/* Chat input area */}
                                        <div className="border-t border-gray-700 rounded-lg mt-2 mb-auto py-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-sm font-medium text-gray-300">
                                                    <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                                                    Enter a Domain/Topic/Theme:
                                                </h4>
                                            </div>
                                            <div className=" items-center relative">
                                                <Textarea
                                                    className="w-full bg-gray-800 text-white border-gray-600 hover:border-b-green-500 focus:border-b-green-400 transition-colors duration-200 rounded-lg pr-10"
                                                    value={domainInput}
                                                    onChange={(e) => setDomainInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleAskForClarification();
                                                        }
                                                    }}
                                                    rows={Math.max(3, Math.min(7, Math.floor(window.innerHeight / 10)))}
                                                    placeholder="Ask AI"
                                                    ref={(input) => {
                                                        if (input && phase === "initial") {
                                                            input.focus();
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                {domainInput.trim() && (
                                                    <div className="absolute right-2 bottom-14 pointer-events-none">
                                                        <span className="text-green-400 text-lg font-bold animate-pulse">...</span>
                                                    </div>
                                                )}
                                                
                                                <Button
                                                    onClick={handleAskForClarification}
                                                    disabled={!domainInput.trim() || isLoading}
                                                    className={`mt-2 w-1/3 ${!domainInput.trim() ? 'bg-gray-600 cursor-not-allowed' : isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500'} text-white rounded-lg`}
                                                >
                                                    {isLoading ? (
                                                        <div className="flex items-center justify-center">
                                                            <div className="h-5 w-5 border-2 border-t-transparent border-green-400 rounded-full animate-spin"></div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <FontAwesomeIcon icon={faRobot} />
                                                            <span>Generate</span>
                                                        </div>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="text-sm font-bold h-auto"></div> */}
                                {/* Frame with Socratis and 42}*/}
                                <div className="text-sm px-4 mt-5 mb-3 relative rounded-lg bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 shadow-lg">
                                    {/* Fancy decorative elements */}
                                    <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg opacity-30 m-1"></div>
                                    <div className="absolute inset-0 border border-emerald-300 rounded-lg opacity-20 m-2"></div>
                                    <div className="relative z-10 text-center">
                                        <div className="text-lg font-bold text-white m-1">
                                            <h2 className="text-lg font-bold text-white mt-2">
                                                Socrates&apos; Wisdom on Questions
                                            </h2>

                                            <span className="block text-xs italic text-cyan-300 mb-3 font-light">
                                                The ancient philosopher Socrates once said:
                                            </span>
                                            <div className="text-center mb-2">
                                                <span className="block text-sm text-emerald-300 font-medium">
                                                    «The beginning of wisdom is the definition of terms»
                                                </span>
                                                <span className=" font-bold text-sm text-emerald-400 tracking-wide inline-block mt-1">
                                                    «Understanding a question is half an answer»
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-1 opacity-60"></div>
                                        <div className="flex items-center justify-center gap-2 my-1">
                                            <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-cyan-500 opacity-70"></div>
                                            <span className="text-cyan-400 text-xl">✧</span>
                                            <div className="h-[2px] w-8 bg-gradient-to-r from-cyan-500 to-transparent opacity-70"></div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-1 opacity-60"></div>

                                        <span className="block text- italic text-cyan-300 mb-3 font-light">
                                            And in the &quot;The Hitchhiker&apos;s Guide to the Galaxy &quot;, after thinking in 7 mill years, the Supercomputer &quot; Deep Thought &quot; finally came up with an answer:
                                        </span>
                                        <div className="text-center mb-2">
                                            <span className="block text-sm text-emerald-300 font-medium">
                                                «The Answer to the Ultimate Question of Life, the Universe, and Everything is»:
                                            </span>
                                            <span className="text-3xl font-bold text-emerald-400 tracking-wide inline-block animate-pulse mt-1">
                                                &quot42&quot
                                            </span>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent mb-5 opacity-60">
                                            <div className="flex items-center justify-center gap-2 my-2">
                                                <span className="text-xs italic text-cyan-300 font-light">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-xs italic text-cyan-300 font-light">
                                                            So perhaps the real challenge isn&apos;t finding answers, but asking the right questions...
                                                        </span>
                                                        <span className="text-xl animate-bounce inline-block">💭</span>
                                                    </div>
                                                </span>
                                                <span className="text-xl animate-bounce inline-block">😄</span>
                                            </div>
                                        </div>
                                        <span className="block text-xs italic text-cyan-300 mb-3 pb-1 font-light"></span>
                                    </div>
                                    {/* Decorative corner effects */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 opacity-80"></div>
                                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 opacity-80"></div>
                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 opacity-80"></div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 opacity-80"></div>
                                </div>
                            </div>
                        )}

                        {phase === "clarification" && (
                            <div className="p-1 mb-2 w-full h-full">
                                <div className="p-1 mt-auto text-sm font-bold px-1 bg-white bg-opacity-5 ">Domain:
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
                                <div className="flex items-center relative">
                                    <Textarea
                                        className="flex-grow bg-gray-950 text-white border-gray-600 hover:border-b-green-500 focus:border-b-green-400 transition-colors duration-200 rounded-l-lg pr-10"
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
                                        rows={Math.max(3, Math.min(7, Math.floor(window.innerHeight / 200)))}
                                        placeholder={`For each question above, write your answer on a new line or bullet point.`}
                                        ref={(input) => {
                                            if (input && phase === "clarification") {
                                                input.focus();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    {additionalDetails.trim() && (
                                        <div className="absolute right-14 top-1/3 transform -translate-y-1/2 pointer-events-none">
                                            <span className="text-green-400 text-lg font-bold animate-pulse">...</span>
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleAskForClarification}
                                        disabled={isLoading}
                                        className={`ml-1 h-14 self-start ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500'} text-white rounded-r-lg`}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="h-5 w-5 border-2 border-t-transparent border-green-400 rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                                <span className="text-xs mt-1">Add</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>

                                <div className="mt-3 pt-3">
                                    <button
                                        onClick={handleFinalize}
                                        disabled={curAction === "finalized"}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-all duration-300 ${curAction === "finalized"
                                            ? "bg-gray-700 cursor-not-allowed"
                                            : "bg-gradient-to-br from-cyan-800 to-green-700 hover:from-cyan-700 hover:to-green-600 shadow-lg hover:shadow-cyan-900/30"
                                            }`}
                                    >
                                        <span className="text-lg font-medium text-white">Finalize Prompt</span>
                                        <div className="flex items-center">
                                            {curAction === "finalized" ? (
                                                <div className="mr-2 h-5 w-5 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
                                            ) : (
                                                <div className="w-6 h-6 mr-2 flex items-center justify-center text-cyan-300">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-cyan-300" />
                                                </div>
                                            )}
                                            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${curAction === "finalized" ? "bg-gray-600" : "bg-cyan-500"
                                                }`}>
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {phase === "final" && (
                            <div className="p-1 mb-2 h-full">
                                <div className="mb-2 mt-auto text-sm font-bold ">Final Perfect Prompt:</div>
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

                {/* Draggable divider */}
                <div
                    className="cursor-col-resize w-1 bg-green-600 hover:bg-green-400 active:bg-green-300 h-full flex items-center justify-center"
                    onMouseDown={startDragging}
                >
                    <div className="h-8 w-1 bg-green-300 rounded-full"></div>
                </div>

                <div className="border-solid rounded border-1 border-green-900 h-full overflow-y-hidden" style={{ width: `${100 - dividerPosition}%` }} ref={containerRef}>
                    <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                            <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                                <TabsTrigger value="introduction" className="pb-2 mt-3">
                                    ...
                                </TabsTrigger>
                                {/* <TabsTrigger value="final-suggested-prompt" className="pb-2 mt-3">
                                    AI Suggested Prompt
                                </TabsTrigger> */}
                                <TabsTrigger value="existing-prompt" className="pb-2 mt-3">
                                    Stored Prompt
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="introduction" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-2 p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 max-h-[calc(100vh-21rem)]">
                                    <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Prompt Builder</h2>

                                    <p className="text-white mb-3">
                                        The Prompt Builder is an AI-powered tool that helps you create perfect prompts for domain-specific knowledge models.
                                        Its about asking the right questions to ask AI to give the best definition of a subject  (The Domain we want to explore).
                                    </p>

                                    <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

                                    <ol className="text-white list-decimal ml-5 space-y-2">
                                        <li><span className="font-bold">Start with a Subject :</span> Enter a domain, topic, or theme you want to create a prompt for.</li>
                                        <li><span className="font-bold">Answer Clarifying Questions:</span> The AI will ask questions to refine your requirements.</li>
                                        <li><span className="font-bold">Review & Edit:</span> Examine the suggested prompt and make any necessary edits.</li>
                                        <li><span className="font-bold">Keep:</span> When satisfied, save your prompt to use with your knowledge models. </li>
                                    </ol>
                                    <div className="text-sm font-bold mt-4 mb-2">
                                        <span className="text-green-400">Note: </span> You can run the prompt in next step
                                    </div>
                                    <div className="mt-6 p-3 border border-green-700 rounded bg-gray-800">
                                        <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
                                        <ul className="text-white list-disc ml-5 space-y-1">
                                            <li>Be specific about your domain</li>
                                            <li>Provide detailed answers to the clarification questions</li>
                                            <li>Don&apos;t hesitate to iterate through multiple rounds of refinement</li>
                                            <li>Edit the final prompt to add any missing details</li>
                                        </ul>
                                    </div>
                                    {/* 
                                    <div className="mt-6 text-center">
                                        <button onClick={() => setActiveTab("final-suggested-prompt")}
                                            className="bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded">
                                            Get Started
                                        </button>
                                    </div> */}
                                </div>
                            </TabsContent>
                            {/* <TabsContent value="final-suggested-prompt" className="m-0 px-1 py-2 rounded bg-background">
                                <div className=" py-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-20rem)]">
                                    <ReactMarkdown className="prose prose-sm p-2 text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full min-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
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
                            </TabsContent> */}
                            <TabsContent value="existing-prompt" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="m-2 p-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                    <div className="text-white px-2 bg-gray-900 max-h-[calc(100vh-21rem)] overflow-y-auto">
                                        {!editedPrompt ? (
                                            <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                                {`${data?.phData?.domain.prompt || "No prompt in store."}`}
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
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}



