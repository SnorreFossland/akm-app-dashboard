"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { LoadingCircularProgress } from "@/components/loading";
import { setDomainData } from "@/features/model-universe/modelSlice";

export default function DomainBuilder() {
    const data = useSelector((state) => state.modelUniverse);
    const dispatch = useDispatch();

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
    const containerRef = useRef(null);

    // Model selection state
    const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

    // Handle dragging functionality
    const startDragging = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const stopDragging = () => {
        setIsDragging(false);
    };

    const onDrag = (e) => {
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
    };

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
    }, [isDragging]);

    // Load existing domain data when component mounts
    useEffect(() => {
        if (data?.phData?.domain) {
            setDomainName(data.phData.domain.name || "");
            setDomainDescription(data.phData.domain.description || "");
            setDomainPresentationState(data.phData.domain.presentation || "");
        }
    }, [data?.phData?.domain]);

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
        setDispatchDone(false);
        dispatch(setDomainData(domainData));
        setDispatchDone(true);
        if (editingPrompt) {
            setEditingPrompt(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] border-solid rounded border-4 border-green-800 w-full bg-transparent">
            <CardTitle className="flex justify-start items-center text-gray-400 text-xl">
                <span className="text-active-item me-auto px-2">Domain Definition Builder</span>
                <span className="mx-auto text-center">AI Powered Domain Knowledge Canvas</span>
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
                </div>
            </CardTitle>

            <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden" ref={containerRef}>
                {/* Left panel */}
                <div className="p-1 border-solid rounded border-4 border-green-900 flex flex-col h-full" style={{ width: `${dividerPosition}%` }}>
                    <div className="h-full w-full overflow-y-auto">
                        <div className="p-2 mb-4">
                            <div className="mb-3">
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
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        className="bg-gray-800 text-white border-gray-600"
                                        rows={8}
                                    />
                                ) : (
                                    <div className="p-2 bg-gray-800 rounded border border-gray-700 max-h-[200px] overflow-y-auto overflow-x-hidden w-full">
                                        <ReactMarkdown className="prose prose-sm text-gray-300 break-words whitespace-pre-wrap w-full overflow-hidden" 
                                                      components={{
                                                        // Force any pre/code blocks to wrap and stay within container
                                                        pre: ({node, ...props}) => (
                                                          <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%'}} {...props} />
                                                        ),
                                                        code: ({node, ...props}) => (
                                                          <code style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%'}} {...props} />
                                                        ),
                                                        p: ({node, ...props}) => (
                                                          <p style={{maxWidth: '100%', overflowWrap: 'break-word'}} {...props} />
                                                        )
                                                      }}>
                                            {data?.phData?.domain?.prompt || "No prompt defined yet. Edit here or create one in the Prompt Builder."}
                                        </ReactMarkdown>
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

                        {domainPresentation && (
                            <div className="p-2 mt-2 border-t border-gray-700 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-green-400">Domain Definition</h3>
                                    <Button
                                        onClick={() => setEditing(!editing)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-green-400 hover:text-green-300"
                                    >
                                        <FontAwesomeIcon icon={editing ? faCheckCircle : faEdit} className="mr-1" />
                                        {editing ? "Save" : "Edit"}
                                    </Button>
                                </div>
                                {editing ? (
                                    <Textarea
                                        value={domainPresentation}
                                        onChange={(e) => setDomainPresentationState(e.target.value)}
                                        className="bg-gray-800 text-white border-gray-600"
                                        rows={14}
                                    />
                                ) : (
                                        <div className="p-2 bg-gray-800 rounded border border-gray-700 max-h-[200px] overflow-y-auto overflow-x-hidden w-full">
                                            <ReactMarkdown className="prose prose-sm text-gray-300 break-words whitespace-pre-wrap w-full overflow-hidden"
                                                components={{
                                                    // Force any pre/code blocks to wrap and stay within container
                                                    pre: ({ node, ...props }) => (
                                                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} {...props} />
                                                    ),
                                                    code: ({ node, ...props }) => (
                                                        <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} {...props} />
                                                    ),
                                                    p: ({ node, ...props }) => (
                                                        <p style={{ maxWidth: '100%', overflowWrap: 'break-word' }} {...props} />
                                                    )
                                                }}>
                                            {domainPresentation}
                                        </ReactMarkdown>
                                    </div>
                                )}
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

                {/* Right panel */}
                <div className="border-solid rounded border-1 border-green-900 h-full overflow-y-hidden" style={{ width: `${100 - dividerPosition}%` }} ref={containerRef}>
                    <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                            <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                                <TabsTrigger value="instructions" className="pb-2 mt-3">
                                    Instructions
                                </TabsTrigger>
                                <TabsTrigger value="presentation" className="pb-2 mt-3">
                                    Domain Definition
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="pb-2 mt-3">
                                    Preview
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="instructions" className="m-0 px-1 py-2 rounded bg-background ">
                                <div className="h-full p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                    <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Domain Builder</h2>

                                    <p className="text-white mb-3">
                                        The Domain Builder helps you define and create comprehensive domain knowledge collections
                                        that will be used by AI models to provide accurate and relevant information.
                                    </p>

                                    <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

                                    <ol className="text-white list-decimal ml-5 space-y-2"> 
                                        <li><span className="font-bold">Define your domain:</span> Provide a name and detailed description.</li>
                                        <li><span className="font-bold">Use existing prompt:</span> Your domain will use the prompt created in the Prompt Builder.</li>
                                        <li><span className="font-bold">Generate definition:</span> Let AI create a comprehensive domain presentation.</li>
                                        <li><span className="font-bold">Edit and refine:</span> Customize the generated content to your needs.</li>
                                        <li><span className="font-bold">Keep:</span> Save your domain definition for use in knowledge models.</li>
                                    </ol>

                                    <div className="mt-6 p-3 border border-green-700 rounded bg-gray-800">
                                        <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
                                        <ul className="text-white list-disc ml-5 space-y-1">
                                            <li>Be specific in your domain description</li>
                                            <li>Make sure you have a well-crafted prompt from the Prompt Builder</li>
                                            <li>Review and edit the AI-generated presentation</li>
                                            <li>Consider adding examples and use cases</li>
                                        </ul>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="presentation" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="p-2 bg-gray-800 rounded border border-gray-700 max-h-[200px] overflow-y-auto overflow-x-hidden w-full h-full">
                                    <div className="p-2 bg-gray-800 rounded border border-gray-700 w-full h-full overflow-y-auto">
                                        <ReactMarkdown 
                                            className="prose prose-sm text-gray-300 break-words whitespace-pre-wrap w-full"
                                            components={{
                                                // Force any pre/code blocks to wrap and stay within container
                                                pre: ({ node, ...props }) => (
                                                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} {...props} />
                                                ),
                                                code: ({ node, ...props }) => (
                                                    <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }} {...props} />
                                                ),
                                                p: ({ node, ...props }) => (
                                                    <p style={{ maxWidth: '100%', overflowWrap: 'break-word' }} {...props} />
                                                )
                                            }}>
                                            {domainPresentation || "No presentation generated yet. Fill in the domain information and click 'Generate Definition'."}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="m-0 px-1 py-2 rounded bg-background">
                                <div className="p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 max-h-[calc(100vh-21rem)]">
                                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
                                        <h1 className="text-2xl font-bold text-green-400 mb-4">{domainName || "Domain Name"}</h1>

                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Description</h3>
                                            <p className="text-gray-400">
                                                {domainDescription || "No description provided"}
                                            </p>
                                        </div>

                                        {domainPresentation && (
                                            <div className="border-t border-gray-700 pt-4">
                                                <h3 className="text-lg font-semibold text-gray-300 mb-2">Domain Knowledge</h3>
                                                <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                                                    {domainPresentation}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-gray-700">
                                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Next Steps</h3>
                                            <ActionCardTitleButton
                                                title="Go to Knowledge Explorer"
                                                done={true}
                                                onClick={() => window.location.href = "/knowledge-explorer"}
                                                icon={faLink}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}