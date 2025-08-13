"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { LoadingCircularProgress } from "@/components/loading";
import { setDomainData } from "@/features/model-universe/modelSlice";
import TemperatureSelector from "@/components/ai-chat/TemperatureSelector";
import ModelSelector from "@/components/ai-chat/ModelSelector";

const debug = false; // Set to true for debugging

interface DomainBuilderProps {
    input?: string;
    setInput?: (input: string) => void;
    selectedModel?: string;
    mdContent?: string;
    setMdContent?: (content: string) => void;
    setIsLibraryOpen?: (isOpen: boolean) => void;
    isLibraryOpen?: boolean;
    mdPreview: string;
    setMdPreview: (content: string) => void;
    onViewInMarkdown: (content: string) => void;
}

export default function DomainBuilder({
    input,
    setInput,
    mdContent,
    setMdContent,
    setIsLibraryOpen,
    isLibraryOpen,
    mdPreview,
    setMdPreview,
    onViewInMarkdown
}: DomainBuilderProps) {
    const data = useSelector((state: { modelUniverse: any }) => state.modelUniverse);
    const dispatch = useDispatch();

    // Add mounted state to prevent hydration mismatch
    const [mounted, setMounted] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState("instructions");
    const [isLoading, setIsLoading] = useState(false);
    const [dispatchDone, setDispatchDone] = useState(true);

    // Domain Data State
    const [domainName, setDomainName] = useState(data?.phData?.domain?.name || "");
    const [domainDescription, setDomainDescription] = useState(data?.phData?.domain?.description || "");
    const [domainPresentation, setDomainPresentationState] = useState(data?.phData?.domain?.presentation || "");



    // Editing State
    const [editing, setEditing] = useState(true);
    const [editingPrompt, setEditingPrompt] = useState(false);
    const [promptText, setPromptText] = useState(data?.phData?.domain?.prompt || "");

    // Draggable divider state
    const [dividerPosition, setDividerPosition] = useState(40); // 40% default width for left panel
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Model selection state
    const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

    // Handle dragging functionality
    const startDragging = (e: React.MouseEvent) => {
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

    // Add mouse event listeners
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

    // Load existing domain data when component mounts
    useEffect(() => {
        if (data?.phData?.domain) {
            setDomainName(data.phData.domain.name || "");
            setDomainDescription(data.phData.domain.description || "");
            setDomainPresentationState(data.phData.domain.presentation || "");
        }
    }, [data?.phData?.domain]);

    // Set mounted to true and initialize data after component mounts
    useEffect(() => {
        setMounted(true);
        // Initialize state with data after mounting to prevent hydration mismatch
        if (data?.phData?.domain) {
            setDomainName(data.phData.domain.name || "");
            setDomainDescription(data.phData.domain.description || "");
            setDomainPresentationState(data.phData.domain.presentation || "");
            setPromptText(data.phData.domain.prompt || "");
        }
    }, []);

    // Update state when data changes (but only after mounted)
    useEffect(() => {
        if (mounted && data?.phData?.domain) {
            setDomainName(data.phData.domain.name || "");
            setDomainDescription(data.phData.domain.description || "");
            setDomainPresentationState(data.phData.domain.presentation || "");
            setPromptText(data.phData.domain.prompt || "");
        }
    }, [data?.phData?.domain, mounted]);

    // // Reusable IconButton component
    // interface IconButtonProps {
    //     onClick: () => void;
    //     icon: any;
    //     className?: string;
    //     iconWidth?: string;
    //     iconSize?: SizeProp;
    // }

    // const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
    //     return (
    //         <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
    //             <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
    //         </Button>
    //     );
    // };


    // Generate domain presentation using AI
    const generateDomainPresentation = async () => {
        // if (!domainName.trim() || !domainDescription.trim()) {
        //     alert("Domain name and description are required to generate a presentation.");
        //     return;
        // }

        setIsLoading(true);

        try {
            // Get existing prompt from store
            const existingPrompt = data?.phData?.domain?.prompt || "";

            const promptInstruction = `
            Create a comprehensive presentation about the following domain:
            
            Domain Name: ${domainName}
            
            Domain Description: ${domainDescription}
            
            Domain Prompt: ${existingPrompt}
            
            Please provide a well-structured markdown presentation that includes:
            1. An introduction to the domain
            2. Key concepts and terminology
            3. Main challenges and opportunities
            4. Best practices and approaches
            5. Potential applications
            6. Future trends and developments
            
            Format the response as a professional markdown document with proper headings, bullet points, and formatting.
            `;

            let response;
            if (selectedModel === "dummy") {
                // Dummy response for testing
                response = {
                    ok: true,
                    json: async () => ({
                        response: `# ${domainName} Overview

## Introduction
This is a dummy presentation for ${domainName}. In a real scenario, this would be a comprehensive introduction to the domain.

## Key Concepts
- First key concept
- Second key concept
- Third key concept

## Main Challenges
1. Challenge one
2. Challenge two
3. Challenge three

## Best Practices
* Best practice one
* Best practice two
* Best practice three

## Applications
Wide-ranging applications include...

## Future Trends
Looking ahead, we can expect...`
                    })
                };
            } else {
                // Use real API
                response = await fetch("/api/genprompt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: promptInstruction,
                        aiModelName: selectedModel
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("API Error:", errorData.error);
                    return;
                }
            }

            const responseData = await response.json();
            setDomainPresentationState(responseData.response);
            setActiveTab("presentation");

        } catch (error) {
            console.error("Error generating domain presentation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save domain data to store
    const saveDomainData = () => {
        const domainData = {
            name: domainName,
            description: domainDescription,
            presentation: domainPresentation,
            prompt: editingPrompt ? promptText : (data?.phData?.domain?.prompt || ""),
            additionalContext: data?.phData?.domain?.additionalContext || ""
        };
        if (!debug) {
            console.log("Saving domain data:", domainData);
        }
        setDispatchDone(false);
        dispatch(setDomainData(domainData));
        setDispatchDone(true);
        if (editingPrompt) {
            setEditingPrompt(false);
        }
    };

    // Don't render content until mounted
    if (!mounted) {
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)] border-solid rounded border-4 border-green-800 w-full bg-transparent items-center justify-center">
                <LoadingCircularProgress />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] border-solid rounded border-4 border-green-800 w-full bg-transparent">


            <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden" ref={containerRef}>
                {/* Left panel */}
                <div className="p-1 flex flex-col h-full">
                    <div className="flex flex-col h-full w-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-medium text-gray-300">Current Prompt</h4>
                            <Button
                                onClick={() => setEditingPrompt(!editingPrompt)}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-green-400 hover:text-green-300"
                            >
                                <FontAwesomeIcon icon={editingPrompt ? faCheckCircle : faEdit} className="mr-1" />
                                {editingPrompt ? "Save" : "Edit"}
                            </Button>
                        </div>
                        {editingPrompt ? (
                            <Textarea
                                style={{ width: "100%", minWidth: "500px" }}
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                className="bg-background text-white border-gray-600 w-full h-full flex-1 resize-none"
                            />
                        ) : (
                            <div className="p-2 bg-background rounded border border-gray-700 overflow-y-auto overflow-x-hidden w-full flex-1">
                                <div className="prose prose-sm text-gray-300 break-words whitespace-pre-wrap w-full overflow-hidden">
                                    {promptText || "No prompt defined yet. Edit here or create one in the Prompt Builder."}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-4">
                        <Button
                            onClick={generateDomainPresentation}
                            className={`${(!promptText.trim() && !data?.phData?.domain?.prompt?.trim())
                                ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed"
                                : (domainPresentation) ? "bg-gray-500 hover:bg-gray-500" :
                                    "bg-green-700 hover:bg-green-600"
                                } text-white`}
                            disabled={isLoading || (!promptText.trim() && !data?.phData?.domain?.prompt?.trim())}
                        >
                            <FontAwesomeIcon icon={faBrain} className="mr-2" />
                            {isLoading
                                ? "Generating..."
                                : (!promptText.trim() && !data?.phData?.domain?.prompt?.trim())
                                    ? "Prompt Required"
                                    : "Generate Definition"
                            }
                        </Button>
                        <button
                            onClick={() => {
                                console.log('Previewing message in markdown:', domainName, domainDescription, domainPresentation);
                                onViewInMarkdown(domainPresentation);
                                // Toggle preview state locally
                                // if (previewMessageIndex === index) {
                                //     setPreviewMessageIndex(null);
                                // } else {
                                //     setPreviewMessageIndex(index);
                                // }
                            }}
                            className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                        >
                            Show Markdown Preview
                            {/* {previewMessageIndex === index ? "Show Plain Text" : "Markdown Preview"} */}
                        </button>
                        <Button
                            onClick={saveDomainData}
                            className={`${data?.phData?.domain?.prompt?.trim()
                                ? "bg-gray-500 hover:bg-gray-500"
                                : "bg-blue-700 hover:bg-blue-600"
                                } text-white`}
                            disabled={!domainPresentation.trim()}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                            {!domainPresentation.trim() ? "Dispatch Domain" : "Dispatch Domain"}
                        </Button>
                    </div>
                </div>
            </div>
            {/* <CardTitle className="flex justify-start items-center text-gray-400 text-xl"> */}
            {/* <span className="text-active-item me-auto px-2">Domain Definition Builder</span> */}
            {/* <span className="mx-auto text-center">AI Powered Domain Knowledge Canvas</span> */}
                        <div className="flex items-center text-foreground gap-1">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={(newModel) => {
                                    setSelectedModel(newModel);
                                    // Persist selected model to localStorage
                                    localStorage.setItem('aiDashboard_selectedModel', newModel);
                                }}
                            />
                            <TemperatureSelector />
                        </div>
            {/* </CardTitle> */}
        </div>
    );
}