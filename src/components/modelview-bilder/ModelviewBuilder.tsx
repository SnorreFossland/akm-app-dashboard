"use client"
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, Info } from "lucide-react";
import { LoadingCircularProgress } from '@/components/loading';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
    addMessage,
    setMessages as chatSetMessages,
    Message
} from '@/features/chat/chatSlice';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import TextareaAutosize from 'react-textarea-autosize';
import DigitalRainIntro from '@/components/ai-chat/DigitalRainIntro';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';

import ReactMarkdown from 'react-markdown';

import { ModelviewSchema } from "@/modelviewSchema";
// import { ModelviewCard } from '@/components/modelview-card';

const debug = false;

interface ModelviewBuilderProps {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    selectedModel: any;
    setSelectedModel: React.Dispatch<any>;
    onResponseChange: (response: any) => void;
    onViewInMarkdown: (response: string) => void;
    onViewInPreview: (response: string) => void;
    setShowLeftPanel: React.Dispatch<React.SetStateAction<boolean>>;
    onAddContent: (content: string) => void;
    mvContent: string;
    setMvContent: React.Dispatch<React.SetStateAction<string>>;
    mvPreview: string;
    setMvPreview: React.Dispatch<React.SetStateAction<string>>;
    setCurrentMessages: React.Dispatch<React.SetStateAction<any[]>>;
    startupGuide: React.ReactElement;
    guide: React.ReactElement;
}

export default function ModelviewBuilder({
    input,
    setInput,
    selectedModel,
    setSelectedModel,
    onResponseChange,
    onViewInMarkdown,
    onViewInPreview,
    setShowLeftPanel,
    onAddContent,
    mvContent,
    setMvContent,
    mvPreview,
    setMvPreview,
    setCurrentMessages,
    startupGuide,
    guide
}: ModelviewBuilderProps) {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [curMetamodel, setCurMetamodel] = useState(null);
    const [model, setModel] = useState<{
        id?: string;
        name?: string;
        objects: Array<{
            id: string;
            name: string;
            description: string;
            typeName?: string;
        }>;
        relships: Array<{
            id: string;
            name: string;
            nameFrom: string;
            nameTo: string;
        }>;
    } | null>(null);
    const [modelview, setModelview] = useState<{
        id: string;
        name: string;
        description: string;
        objectviews: Array<{
            id: string;
            name: string;
            description: string;
            typeName: string;
            loc: string;
            objectRef: string;
        }>;
        relshipviews: Array<{
            id: string;
            name: string;
            fromobjviewRef: string;
            toobjviewRef: string;
            points: number[];
        }>;
    } | null>(null);
    interface ModelviewObjects {
        id: string;
        name: string;
        description: string;
        proposedType: string;
        typeRef: string;
        typeName: string;
        category: string;
    }
    interface ModelviewRelships {
        id: string;
        name: string;
        typeRef: string;
        fromobjectRef: string;
        nameFrom: string;
        toobjectRef: string;
        nameTo: string;
    }
    const [existingObjectsInModelview, setExistingObjectsInModelview] = useState<{
        objects: ModelviewObjects[];
        relships: ModelviewRelships[];
    }>({ objects: [], relships: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [dispatchDone, setDispatchDone] = useState(false);
    const [activeTab, setActiveTab] = useState('current-knowledge');
    const [activeSubTab, setActiveSubTab] = useState('model-summary');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showModel, setShowModel] = useState(false);
    const [userPrompt, setUserPrompt] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [streamedContent, setStreamedContent] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [canPreview, setCanPreview] = useState<boolean>(false);
    const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [showDigitalRain, setShowDigitalRain] = useState(true);
    const [irtvAnalysis, setIrtvAnalysis] = useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [temperature, setTemperature] = useState<number>(0.7);
    const [userEditedInput, setUserEditedInput] = useState(false);
    const [lastAutoPrompt, setLastAutoPrompt] = useState("");

    const handleCopyMessage = (content: string, index: number) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
        });
    };

    const handleClearChat = () => {
        setMessages([]);
        setCurrentMessages([]);
        setInput("");
        setIrtvAnalysis(null);
        setStreamedContent("");
        setMvContent("");
        setMvPreview("");
        onResponseChange("");
        setShowDigitalRain(true);
    };

    useEffect(() => {
        if (!data) return;

        const models = data?.phData?.metis?.models || [];
        const focusedId = data?.phFocus?.focusModel?.id;
        setCurmod(models.find((m: any) => m.id === focusedId) || models[0]);

        // Only update state when the model ID actually changes to avoid re-renders/loops
        setModel((prevModel) => {
            if (!curmod) return prevModel;
            if (prevModel && prevModel.id === curmod.id) {
                return prevModel; // no change -> no re-render from this setter
            }
            return curmod;
        });

        // Safely compute filtered relationships and objects
        const filteredRelationships = (curmod?.relships || []).filter((rel: any) => {
            const fromObject = (curmod?.objects || []).find((obj: any) => obj.id === rel.nameFrom);
            const toObject = (curmod?.objects || []).find((obj: any) => obj.id === rel.nameTo);
            return fromObject && toObject && rel;
        });

        // compute new value
        const newExisting = {
            objects: curmod?.objects || [],
            relships: (filteredRelationships || []).filter((rel: any) =>
                (curmod?.objects || []).some((obj: any) => obj.id === rel.nameFrom || obj.id === rel.nameTo)
            ) || []
        };

        // guarded functional update to avoid no-op setState that triggers renders
        setExistingObjectsInModelview((prev) => {
            // quick length checks
            const prevObjects = prev?.objects || [];
            const prevRelships = prev?.relships || [];

            const sameObjects =
                prevObjects.length === newExisting.objects.length &&
                prevObjects.every((o: any, i: number) => o?.id === newExisting.objects[i]?.id);

            const sameRelships =
                prevRelships.length === newExisting.relships.length &&
                prevRelships.every((r: any, i: number) => r?.id === newExisting.relships[i]?.id);

            if (sameObjects && sameRelships) {
                return prev; // no change -> avoid triggering re-render
            }
            return newExisting;
        });
    }, []);

    useEffect(() => {
        console.log("224 Current model changed:", curmod);
        const nextAutoPrompt = "Create a Modelview with Objectviews and Relshipviews for " +
            (curmod?.objects.length || 0) + " objects and " + (curmod?.relships.length || 0) + " relationships.";


        if (!nextAutoPrompt) return;

        setUserPrompt(nextAutoPrompt);

        // Decide whether to inject/overwrite the textarea input:
        // Overwrite if:
        //  - input is empty
        //  - OR input equals the last auto prompt (user hadn't personalized it)
        //  - OR user never edited (userEditedInput === false)
        if (!input || input === lastAutoPrompt || !userEditedInput) {
            setInput(nextAutoPrompt);
            setLastAutoPrompt(nextAutoPrompt);
            setUserEditedInput(false); // still considered auto
            if (debug) console.log("[auto-prompt] applied", nextAutoPrompt.slice(0, 60));
        } else {
            if (debug) console.log("[auto-prompt] NOT applied (user edited)");
        }
    }, [curmod?.id, curMetamodel?.id]); // keep deps focused
    // ---------- Temperature preference ----------
    useEffect(() => {
        const savedTemp = localStorage.getItem("aiDashboard_temperature");
        if (savedTemp) setTemperature(parseFloat(savedTemp));
    }, [curmod]);




    const printPromptsDiv = React.useMemo(() => (
        <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            <DialogTitle>---- System Prompt</DialogTitle>
        </div>
    ), [model]);

    const formatJSONAsMarkdown = (data: any): string => {
        let markdown = `# ${data.name || "Generated Model"}\n\n`;
        if (data.description) {
            markdown += `**Description:** ${data.description}\n\n`;
        }
        if (data.objects?.length) {
            markdown += "## Objects\n\n";
            data.objects.forEach((obj: any, i: number) => {
                markdown += `### ${i + 1}. ${obj.name}\n\n`;
                markdown += `- **ID:** ${obj.id}\n`;
                markdown += `- **Description:** ${obj.description}\n`;
                markdown += `- **Type Reference:** ${obj.typeRef}\n`;
                markdown += `- **Type Name:** ${obj.typeName}\n`;
                markdown += `- **Proposed Type:** ${obj.proposedType}\n\n`;
            });
        }
        if (data.relships?.length) {
            markdown += "## Relationships\n\n";
            data.relships.forEach((rel: any, i: number) => {
                markdown += `### ${i + 1}. ${rel.name}\n\n`;
                markdown += `- **ID:** ${rel.id}\n`;
                markdown += `- **Description:** ${rel.description || ""}\n`;
                markdown += `- **From:** ${rel.from || rel.nameFrom || ""}\n`;
                markdown += `- **To:** ${rel.to || rel.nameTo || ""}\n`;
                markdown += `- **Type:** ${rel.type || rel.typeRef || ""}\n\n`;
            });
        }
        return markdown;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // if (!input && !mvContent) return;
        if (!input) input = "Generate a modelview based on the objects and relationships.";
        const content = `${input} #Content:\n ${mvContent}`
        setMessages((prev) => [...prev, { role: "user", content }]);
        await handleModelviewBuilder();
        setInput("");
        onResponseChange("");
        setShowDigitalRain(false);
        setIsLoading(false);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Map chat model to genmodel's supported aiModelName
    function mapModelForGenmodel(m: string): string {
        const lower = (m || '').toLowerCase();
        if (lower.startsWith('deepseek')) return lower; // deepseek-chat, deepseek-coder, deepseek-r1
        if (lower.includes('mistral')) return 'mistral';
        if (lower.startsWith('gpt-')) return lower; // gpt-5, gpt-5-mini
        if (lower === 'dummy') return 'dummy';
        return 'gpt-5-mini';
    }

    const handleModelviewBuilder = async () => {
        setIsLoading(true);
        setActiveTab('modelview');
        setError(null);
        setStreamedContent('');
        setIsStreaming(true);
        setCanPreview(false);


        const modelviewSystemPrompt = `
  You are a helpful assistant and a highly knowledgeable expert in schematic and diagramming presentation and layout.
  You are tasked with presenting the objects and relationships generated from previous step in a modelview.
  
  The modelview will include objectviews and relshipviews for each object and relationship.
  Give the objectviews and relshipviews id as uuids.
  
  You will place the objectviews in the modelview using the "loc" attribute with x and y coordinates as string with format "x y".
  Make room between the objects to show the relationships clearly.
  Align the objects horizontally and vertically to make the modelview look good.
  Make space both horizontally (x distance more than 100) and vertically (y distance more than 20) between the objectviews to show the relationships clearly.
  
  Position all Roles in a column to the left.
  Next on the right put the Tasks.
  Next to the right of the Tasks put the Views.
  Finally, to the right of the Views put the Information objects.
  
  Make sure to also give horizontal and vertical space between the objects to make the modelview look good.
      `;
        const systemBehaviorGuidelines = `
  - Always respond in valid JSON format according to the ModelviewSchema.
  - Ensure all objectviews and relshipviews have unique UUIDs.
  - Maintain clear and organized layout with appropriate spacing.
  - Prioritize readability and clarity in the modelview structure.
      `;
        const modelviewUserPrompt = ` 
  Your first and primary objective is to generate a modelview with all the objects and relationships from the previous step.
  Next, you will create objectviews and relshipviews for each object and relationship.
  You will also create Roles, Tasks, and Views based on the concepts.
  Position all objectviews with enough space between them to show the relationships clearly.
  Make horizontal and vertical space between the objects to make the modelview look good.

  Verify that the text is based on the provided context.
      `;

        const modelviewContextItems = `
  ## Context:
    **Objects and Relationships:**
    ${curmod?.objects.map((obj: any) => `- ${obj.id} ${obj.name} ${obj.description}`).join('\n')} 
    ${curmod?.relships.map((rel: any) => `- ${rel.id} ${rel.name} ${rel.nameFrom} ${rel.nameTo}`).join('\n')}
      `;

        const modelviewContextOntology = "";
        const modelviewContextMetamodel = `
## Metamodel:
    Objectviews:
        id: UUID;
        name: "same as object name"
        description: same as object description
        loc: x y coordinates 
        objectRef: Object Id
    Relshipviews:
        id: UUID
        name: "same as relationship name"
        fromobjviewRef: Object Id
        toobjviewRef: Object Id
        points: array of x,y coordinates for the relshipview line          
`;

        let parsedSuccessfully = false;
        let accumulated = "";

        if (!debug) console.log('615 Prompts: ', selectedModel, '\n\n',
            'systemPrompt\n', modelviewSystemPrompt, '\n\n',
            'systemBehaviorGuidelines\n', systemBehaviorGuidelines, '\n\n',
            'userPrompt\n', modelviewUserPrompt, '\n\n',
            'userInput\n', input, '\n\n',
            'contextItems\n', modelviewContextItems, '\n\n',
            'contextOntology\n', "", '\n\n',
            'contextMetamodel\n', modelviewContextMetamodel);

        try {
            const determineAiModelName = (sel: any) => {
                // If a string was passed, use it
                if (typeof sel === 'string' && sel.trim()) return sel;
                // If an object with id or name, prefer id then name
                if (sel && typeof sel === 'object') {
                    if (typeof sel.id === 'string' && sel.id.trim()) return sel.id;
                    if (typeof sel.name === 'string' && sel.name.trim()) return sel.name;
                }
                // Fallback default
                return 'gpt-5-mini';
            };

            const rawAiModelName = determineAiModelName(selectedModel);
            const aiModelNameForGenmodel = mapModelForGenmodel ? mapModelForGenmodel(rawAiModelName) : rawAiModelName;

            console.debug('[ModelviewBuilder] Sending aiModelName to /api/genmodel:', { rawAiModelName, aiModelNameForGenmodel });

            // Then change the body to use `aiModelName: aiModelNameForGenmodel`:
            const res = await fetch("/api/genmodel", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schemaName: 'ModelviewSchema',
                    aiModelName: aiModelNameForGenmodel,
                    systemPrompt: modelviewSystemPrompt || "",
                    systemBehaviorGuidelines: "",
                    userPrompt: (input && input.trim()) ? input : (modelviewUserPrompt || ""),
                    userInput: (input && input.trim()) ? input : (modelviewUserPrompt || ""),
                    contextItems: modelviewContextItems || "",
                    contextOntology: "", // no ontology for modelviews only use objects/relships
                    contextMetamodel: modelviewContextMetamodel || ""
                })
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(`genmodel ${res.status}: ${t}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });

                // Update live preview while streaming
                setStreamedContent(accumulated);
                // expose the raw stream as preview for immediate UI feedback
                setMvPreview(accumulated);

                // Try to parse incrementally. If parsing fails, keep streaming.
                try {
                    const maybe = JSON.parse(accumulated);
                    // Validate parsed data with schema
                    const validated = ModelviewSchema.parse(maybe);
                    // Commit validated modelview
                    setModelview(validated);
                    // store a pretty-printed JSON string in the mvContent prop and expose to library
                    const pretty = JSON.stringify(validated, null, 2);
                    const markdownResponse = formatJSONAsMarkdown(validated);

                    const assistantMessage: Message = {
                        role: "assistant",
                        content: markdownResponse
                    };

                    setMvContent(pretty);
                    onAddContent(pretty);
                    setMessages(prev => [...prev, assistantMessage]);
                    setCanPreview(true);
                    parsedSuccessfully = true;
                    break; // stop reading further once parsed & validated
                } catch (err) {
                    // ignore JSON parse errors while streaming (partial data)
                }
            }

            // If we never parsed successfully during streaming, attempt a final parse
            if (!parsedSuccessfully) {
                try {
                    const finalText = accumulated;
                    const parsed = JSON.parse(finalText);
                    const validated = ModelviewSchema.parse(parsed);
                    setModelview(validated);
                    const pretty = JSON.stringify(validated, null, 2);
                    setMvContent(pretty);
                    onAddContent(pretty);
                    setMessages(prev => [...prev, { role: 'assistant', content: formatJSONAsMarkdown(validated) }]);
                    setCanPreview(true);
                    parsedSuccessfully = true;
                } catch (err: any) {
                    // store the final stream for debugging/preview and set an error
                    setStreamedContent(accumulated);
                    setMvPreview(accumulated);
                    throw new Error(`Failed to parse modelview JSON from AI: ${err?.message ?? String(err)}`);
                }
            }
        } catch (e: any) {
            console.error("Modelview build failed:", e);
            setError(e?.message ?? String(e));
        } finally {
            setIsStreaming(false);
            setIsLoading(false);
        }
    }

    // ---------- Stable preview handler ----------
    const handleViewInMarkdown = useCallback(
        (content: string) => {
            setMvPreview(content);
            onViewInPreview(content);
            if (onViewInMarkdown) {
                try {
                    onViewInMarkdown(content);
                } catch (err) {
                    console.error("onViewInMarkdown prop error:", err);
                }
            } else if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "[ModelviewBuilderComponent] onViewInMarkdown prop not supplied; internal preview only."
                );
            }
        },
        [onViewInPreview, onViewInMarkdown, setMvPreview]
    );


    // Thinking animation (single definition)
    const ThinkingAnimation = () => (
        <div className="flex items-center gap-1 text-blue-400 font-mono p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 max-w-[200px]">
            <span className="ml-2">Thinking</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <div
                className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
            />
            <div
                className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
            />
        </div>
    );

    const TemperatureSelector = () => (
        <div className="flex flex-row items-center justify-center text-xs text-gray-400 px-2">
            <label className="block text-sm font-medium mr-2">Temp:</label>
            <select
                value={temperature}
                onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setTemperature(t);
                    localStorage.setItem("aiDashboard_temperature", t.toString());
                }}
                className="bg-gray-800 border border-gray-600 rounded text-sm py-1 px-2"
                title="Lower = deterministic, higher = creative"
            >
                <option value="0.0">0.0</option>
                <option value="0.3">0.3</option>
                <option value="0.5">0.5</option>
                <option value="0.7">0.7</option>
                <option value="1.0">1.0</option>
                <option value="1.2">1.2</option>
            </select>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] w-full">
            <div className="flex-1 flex flex-col h-0 bg-secondary/40 overflow-hidden relative">
                {showGuide && (
                    <div className="flex flex-col items-center mt-1 mb-2 me-2 px-1 border border-yellow-800 rounded-lg w-80 h-full flex-shrink-0">
                        <div className="flex items-center justify-between w-full px-1">
                            <div className="text-lg font-semibold text-orange-500/60">
                                Guide
                            </div>
                            <button
                                onClick={() => setShowGuide(false)}
                                className="text-gray-400 hover:text-white"
                                title="Close Guide"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 max-h-[calc(100vh-22rem)] overflow-y-auto p-1 bg-yellow-900/60">
                            {guide}
                        </div>
                    </div>
                )}

                <div className="flex flex-col h-full bg-secondary/40 overflow-hidden relative">
                    <div className="flex items-center gap-2">
                        {!showGuide && (
                            <button
                                onClick={() => setShowGuide(true)}
                                className="text-gray-400 hover:text-blue-400 hover:bg-gray-800 pt-1 rounded-md"
                                title="Show Guide"
                            >
                                <HelpCircle className="bg-yellow-700 text-white rounded h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div
                        className="flex-1 min-h-0 max-h-[calc(100vh-17rem)] overflow-y-auto pb-[150px]"
                        id="message-container"
                    >
                        {messages.length < 1 && (
                            <div className="flex flex-col items-center justify-start w-full overflow-auto">
                                {showDigitalRain ? (
                                    <DigitalRainIntro
                                        onInteraction={() => setShowDigitalRain(false)}
                                        speed={4}
                                        backgroundColor="rgba(10, 20, 10, 0.03)"
                                    />
                                ) : (
                                    <GettingStartedGuide />
                                )}
                            </div>
                        )}
                        {/* Render messages */}
                        <div className="flex flex-col p-4 rounded-lg w-full bg-transparent overflow-auto">
                            {messages.map((message, index) => {
                                const isUser = message.role === "user";
                                return (
                                    <div
                                        key={index}
                                        className={`mb-4 p-3 rounded-lg flex flex-col gap-2 ${isUser
                                            ? "bg-card ml-auto max-w-[80%] border border-blue-900"
                                            : "bg-secondary mr-auto w-full border-4 border-secondary"
                                            }`}
                                    >
                                        <div className="text-xs opacity-60">
                                            {message.role.toUpperCase()}
                                        </div>
                                        <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs"
                                                onClick={() => handleCopyMessage(message.content, index)}
                                            >
                                                {copiedIndex === index ? "Copied" : "Copy"}
                                            </button>
                                            {!isUser && (
                                                <button
                                                    className="px-2 py-1 rounded bg-blue-900/50 hover:bg-blue-800 text-xs text-blue-300"
                                                    onClick={() => handleViewInMarkdown(message.content)}
                                                >
                                                    Preview
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {isStreaming && (
                                <div className="mb-4 p-3 rounded-lg flex flex-col gap-2 bg-secondary mr-auto w-full border-4 border-secondary">
                                    <ThinkingAnimation />
                                    <div className="text-sm whitespace-pre-wrap">{streamedContent}</div>
                                </div>
                            )}

                            {/* {isLoading && (
                                <div className="flex justify-start my-4">
                                    <ThinkingAnimation />
                                </div>
                            )} */}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    {(messages.length > 0 || canPreview) && (
                        <div className="flex justify-end w-full">
                            <button
                                onClick={handleClearChat} // <-- use the new handler
                                title="Clear chat history"
                                className="py-1 text-xs text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {canPreview && (
                                <button
                                    onClick={() => {
                                        try {
                                            window.dispatchEvent(new CustomEvent('threepanel:setRightTab', { detail: { key: 'previewModel' } }));
                                            window.dispatchEvent(new Event('threepanel:openRight'));
                                            window.dispatchEvent(new Event('outputpanel:activateModelview'));
                                        } catch { }
                                    }}
                                    title="Open Modelview preview in right panel"
                                    className="py-1 px-2 ml-2 text-xs text-blue-300 bg-blue-900/50 hover:bg-blue-800 rounded"
                                >
                                    Preview Modelview
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Bottom input area – mirrors IrtvBuilderComponent */}
            {/* <div className="relative bottom-7 left-0 right-0 bg-popover pb-safe mt-1 rounded-t-lg z-10 w-full border-t border-gray-700">
                <form onSubmit={handleSubmit} className="p-1 bg-popover rounded-lg">
                    <TextareaAutosize
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                        }}
                        placeholder="Describe how to layout the modelview or leave blank to auto-generate..."
                        className="w-full px-2 py-2 bg-popover border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minRows={4}
                        maxRows={10}
                        disabled={isLoading}
                    />
                    <div className="flex flex-row justify-between rounded gap-1 items-center">
                        <div className="flex items-center gap-2" />
                        <div className="flex items-center text-foreground gap-2">
                            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                            <Button type="submit" disabled={isLoading} className="text-xs">
                                {isLoading ? 'Building…' : 'Generate Modelview'}
                            </Button>
                            {error && <span className="text-xs text-red-400">{error}</span>}
                        </div>
                    </div>
                </form>
            </div> */}
            <div className="relative bottom-7 left-0 right-0 bg-popover pb-safe mt-1 rounded-lg z-10">
                <form onSubmit={handleSubmit} className="p-1 bg-popover rounded-lg">
                    <TextareaAutosize
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setUserEditedInput(true); // Mark as user-edited
                        }}
                        placeholder="Type your requirements or instructions here..."
                        className="w-full px-2 py-2 bg-popover border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minRows={6}
                        maxRows={12}
                        disabled={isLoading}
                    />
                    <div className="flex flex-row justify-between rounded gap-1">
                        <div className="flex items-center gap-2" />
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

                        {/* now include the send‐button here */}
                        <div className="flex justify-between px-2 ">
                            <button
                                type="submit"
                                className="flex items-center bg-gray-800 rounded-full px-2 mb-1 text-blue-300 hover:text-blue-800"
                                disabled={isLoading || !input?.trim()}
                                title="Send your question"
                            >Send
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    className="w-8 h-8"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17V7m0 0l-5 5m5-5l5 5" />

                                </svg>
                            </button>
                        </div>
                        {!isLoading && lastAutoPrompt && userEditedInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setInput(lastAutoPrompt);
                                    setUserEditedInput(false);
                                }}
                                className="flex items-center bg-gray-700 rounded-full px-2 py-1 mb-1 text-xs text-gray-300 hover:bg-gray-600"
                                title="Revert to generated prompt"
                            >
                                Reset Prompt
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
