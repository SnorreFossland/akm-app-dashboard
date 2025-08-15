"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo
} from "react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { useDispatch, useSelector } from "react-redux";
import { X, HelpCircle, Info } from "lucide-react";
// (Make sure these imports exist; adjust paths to your project)
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, Metis, Model } from '@/features/model-universe/modelSlice';
import { RootState, AppDispatch } from "@/store";
import { ObjectSchema } from "@/objectSchema";
import ModelSelector from '@/components/ai-chat/ModelSelector';
import DigitalRainIntro from '@/components/ai-chat/DigitalRainIntro';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
import { SystemPrompt, IrtvSystemPrompt, SystemBehaviorGuidelines, ExistingOntology, UserPrompt, UserInput, ExistingContext } from '@/app/model-builder/prompts';
import { convertDocxToMarkdown } from '@/utils/DOCX-to-Markdown';

const debug = false;

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}


interface IrtvBuilderComponentProps {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    onViewInPreview: (response: string) => void;
    onResponseChange: (response: string) => void;
    onViewInMarkdown?: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    onAddContent: (content: string) => void;
    irtvContent: Model | null;
    setIrtvContent: (content: Model | null) => void;
    irtvPreview: string;
    setIrtvPreview: (preview: string) => void;
    setCurrentMessages: (messages: any[]) => void;
    gettingStartedGuide: React.ReactNode;
    guide: React.ReactNode;
}

export default function IrtvBuilderComponent(props: IrtvBuilderComponentProps) {
    const {
        input,
        setInput,
        selectedModel,
        setSelectedModel,
        onResponseChange,
        onViewInPreview,
        onViewInMarkdown,
        setShowLeftPanel,
        onAddContent,
        irtvContent,
        setIrtvContent,
        irtvPreview,
        setIrtvPreview,
        setCurrentMessages,
        gettingStartedGuide,
        guide
    } = props;

    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();

    const [model, setModel] = useState<any>(null);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<any>(null);
    const [modelview, setModelview] = useState<any>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [statusMsg, setStatusMsg] = useState("");

    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState("current-analysis");
    const [activeSubTab, setActiveSubTab] = useState("requirements-summary");
    const [dispatchDone, setDispatchDone] = useState(false);

    const mdFileInputRef = useRef<HTMLInputElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<
        { text: string; start: number; end: number }[]
    >([]);
    const [showGuide, setShowGuide] = useState(false);

    const [irtvAnalysis, setIrtvAnalysis] = useState<any>(null);
    const [requirements, setRequirements] = useState("");
    const [testScenarios, setTestScenarios] = useState<any[]>([]);
    const [verificationCriteria, setVerificationCriteria] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState("Business");

    const [userPrompt, setUserPrompt] = useState("");
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [systemPrompt, setSystemPrompt] = useState<string>(`You are a helpful AI assistant that provides clear, concise, and accurate responses.
You are provided with following documents for reference. When answering the user's questions, ALWAYS analyze and refer to the content of these documents.
  `);
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [contextItems, setContextItems] = useState("");
    const [contextOntology, setContextOntology] = useState("");
    const [contextMetamodel, setContextMetamodel] = useState("");

    const [isStreaming, setIsStreaming] = useState(false);
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [contextContent, setContextContent] = useState("");
    const [isContextAttached, setIsContextAttached] = useState(false);
    const retryInProgress = useRef(false);
    const [selectedReportTemplate, setSelectedReportTemplate] = useState("");
    const [existingInfoObjects, setExistingInfoObjects] = useState<{
        objects: { id: any; name: any; description: any; typeName: any }[];
        relships: { id: any; name: any; nameFrom: any; nameTo: any }[];
    }>({ objects: [], relships: [] });

    const [temperature, setTemperature] = useState<number>(0.7);
    const [docRefine, setDocRefine] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [previewMessageIndex, setPreviewMessageIndex] = useState<number | null>(
        null
    );
    const [streamedContent, setStreamedContent] = useState("");
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
    const [mdPreview, setMdPreview] = useState("");
    const [lastAutoPrompt, setLastAutoPrompt] = useState("");
    const [userEditedInput, setUserEditedInput] = useState(false);

    const MAX_MODEL_RETRIES = 4;

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

    // Domain-specific prompts
    const IRTVSystemPrompt = `You are an expert IRTV (Information Requirements for Testing and Verification) analyst. 
Your task is to analyze requirements and generate comprehensive IRTV documentation that identifies all information needs for testing and verification activities.

Focus on:
- Information Requirements identification
- Test data specifications
- Verification criteria
- Traceability requirements
- Documentation standards

Verify that your responses are based on the provided context and requirements.
`;

    // ---------- Stable preview handler ----------
    const handleViewInMarkdown = useCallback(
        (content: string) => {
            setIrtvPreview(content);
            onViewInPreview(content);
            if (onViewInMarkdown) {
                try {
                    onViewInMarkdown(content);
                } catch (err) {
                    console.error("onViewInMarkdown prop error:", err);
                }
            } else if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "[IrtvBuilderComponent] onViewInMarkdown prop not supplied; internal preview only."
                );
            }
        },
        [onViewInPreview, onViewInMarkdown, setIrtvPreview]
    );


    useEffect(() => {
        const metis = data?.phData?.metis;
        const focusId = data?.phFocus?.focusModel?.id;

        if (!metis || !metis.models?.length || !focusId) {
            // If focus cleared, also clear local state
            setCurmod(null);
            setCurMetamodel(null);
            if (debug) console.log("[focus-sync] cleared (no metis or focusId)");
            return;
        }

        const nextModel = metis.models.find((m: any) => m.id === focusId) || null;
        const nextMetamodel =
            nextModel
                ? metis.metamodels?.find((mm: any) => mm.id === nextModel.metamodelRef) || null
                : null;

        // Only update if changed (avoid extra renders)
        setCurmod(prev => (prev?.id === nextModel?.id ? prev : nextModel));
        setCurMetamodel(prev => (prev?.id === nextMetamodel?.id ? prev : nextMetamodel));

        if (debug) {
            console.log("[focus-sync] focusId:", focusId,
                "model:", nextModel?.name,
                "metamodel:", nextMetamodel?.name);
        }
    }, [
        data?.phFocus?.focusModel?.id,
        data?.phData?.metis?.models,
        data?.phData?.metis?.metamodels
    ]);


    useEffect(() => {
        if (!curmod || !curMetamodel) return;
        const types = (curMetamodel.objecttypes || [])
            .filter((o: any) => o.name !== "EntityType")
            .map((o: any) => o.name);
        let nextAutoPrompt = "";
        switch (curMetamodel.name) {
            case "IRTV_META":
                nextAutoPrompt = "Create Information objects based on the ontology concepts below, then add Views, Tasks and Roles related to the Information objects.";
                break;
            case "CORE_META":
                nextAutoPrompt =
                    "Create a Metamodel using the following object types: " +
                    (types.length ? types.join(" ") + " based on the ontology concepts below: " : "");
                break;
            case "POPS_META":
                nextAutoPrompt =
                    "Create a POPS model using the following object types: " +
                    (types.length ? types.join(" ") + " based on the ontology concepts below: " : "");
                break;
            case "BPMN_META":
                nextAutoPrompt =
                    "Create a BPMN model using the following object types: " +
                    (types.length ? types.join(" ") + " based on the ontology concepts below: " : "");
                break;
        }

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
    // ---------- 4. Build system behavior + context when curMetamodel changes ----------
    useEffect(() => {
        if (!curMetamodel || !data?.phData?.metis) return;

        let metatypesString = "";
        if (curMetamodel.name === "IRTV_META") {
            const allowed = ["Role", "Task", "View", "Information"];
            const filteredObjTypes = curMetamodel.objecttypes.filter((o: any) =>
                allowed.includes(o.name)
            );
            const idToName = curMetamodel.objecttypes.reduce((m: any, o: any) => {
                m[o.id] = o.name;
                return m;
            }, {});
            const filteredRelTypes = curMetamodel.relshiptypes.filter((r: any) => {
                const fromName = idToName[r.fromobjtypeRef];
                const toName = idToName[r.toobjtypeRef];
                return allowed.includes(fromName) && allowed.includes(toName);
            });
            metatypesString = `**${curMetamodel.name}**
${filteredObjTypes
                    .map(
                        (objtype: any) =>
                            `id: ${objtype.id}, name: ${objtype.name}, typeviewRef: ${objtype.typeviewRef}`
                    )
                    .join("\n")}

${filteredRelTypes
                    .map(
                        (reltype: any) =>
                            `id: ${reltype.id}, name: ${reltype.name}, from: ${reltype.fromobjtypeRef}, to: ${reltype.toobjtypeRef}`
                    )
                    .join("\n")}
`;
            setSystemBehaviorGuidelines(IRTVSystemPrompt);
        } else if (curMetamodel.name === "CORE_META") {
            metatypesString = serializeTypes(curMetamodel);
            setSystemBehaviorGuidelines(
                `You are an expert in creating Metamodels. Your task is to create a Metamodel based on the provided object types and relationships. Ensure logical consistency and Active Knowledge Modeling principles.`
            );
        } else if (curMetamodel.name === "POPS_META") {
            metatypesString = serializeTypes(curMetamodel);
            setSystemBehaviorGuidelines(
                `You are an expert in creating POPS models. Create a POPS model based on the provided ontology concept types and relationships. Ensure consistency with Active Knowledge Modeling principles.`
            );
        } else if (curMetamodel.name === "BPMN_META") {
            metatypesString = serializeTypes(curMetamodel);
            setSystemBehaviorGuidelines(
                `You are an expert in creating BPMN models. Use BPMN notation, pools, lanes, and ensure logical consistency with Active Knowledge Modeling principles.`
            );
        }

        const contextmetatypesString = `## **Metamodel**\n\n${metatypesString}`;

        // Set base system prompt (assuming SystemPrompt is available globally/import)
        setSystemPrompt(SystemPrompt);
        setContextMetamodel(contextmetatypesString);
        setUserPrompt(""); // reset user prompt if it matched default before

        // Keep focus model synced
        const irtvmod = data.phData.metis.models?.find(
            (m: any) => m.metamodelRef === curMetamodel.id
        );
        if (irtvmod && (!curmod || curmod.id !== irtvmod.id)) {
            setCurmod(irtvmod);
            dispatch(setFocusModel({ id: irtvmod.id, name: irtvmod.name }));
        }
    }, [curMetamodel, data?.phData?.metis, dispatch, curmod]);

    function serializeTypes(mm: any) {
        return `**${mm.name}**
${mm.objecttypes
                .map(
                    (o: any) =>
                        `id: ${o.id}, name: ${o.name}, typeviewRef: ${o.typeviewRef}`
                )
                .join("\n")}

${mm.relshiptypes
                .map(
                    (r: any) =>
                        `id: ${r.id}, name: ${r.name}, from: ${r.fromobjtypeRef}, to: ${r.toobjtypeRef}`
                )
                .join("\n")}
`;
    }

    // ---------- 5. When curmod changes, update existing info objects and ontology diff ----------
    useEffect(() => {
        if (!curmod || !data?.phData?.ontology) return;

        const infoRels =
            curmod.relships?.filter((rel: any) => {
                const fromObject = curmod.objects?.find(
                    (o: any) => o.id === rel.fromobjectRef
                );
                const toObject = curmod.objects?.find(
                    (o: any) => o.id === rel.toobjectRef
                );
                return (
                    fromObject?.typeName === "Information" &&
                    toObject?.typeName === "Information"
                );
            }) || [];

        const existingObjects =
            curmod.objects?.map((o: any) => ({
                id: o.id,
                name: o.name,
                description: o.description,
                typeName: o.typeName
            })) || [];

        const existingRelationships =
            infoRels.map((rel: any) => ({
                id: rel.id,
                name: rel.name,
                nameFrom: rel.nameFrom,
                nameTo: rel.nameTo
            })) || [];

        const newExistingInfoObjects = {
            objects: existingObjects.filter((o: any) => o.typeName === "Information"),
            relships: existingRelationships
        };

        setExistingInfoObjects(newExistingInfoObjects);

        const existingNames = newExistingInfoObjects.objects.map((o) => o.name);

        let conceptString = `**Existing Context**

**The following objects and relationships are already defined and only used for connecting new relationships.**
- Before creating a new object, check if its name exists in existingObjectNames (case-insensitive).
- existingObjectNames = ${existingNames.join(", ")}

`;

        if (newExistingInfoObjects.objects.length > 0) {
            conceptString += `**Objects**\n\n${newExistingInfoObjects.objects
                .map((o: any) => `- ${o.name} - ${o.description || ""}`)
                .join("\n")}\n\n`;
        }
        if (newExistingInfoObjects.relships.length > 0) {
            conceptString += `**Relationships**\n\n${newExistingInfoObjects.relships
                .map(
                    (r: any) =>
                        `- ${r.name} - ${r.nameFrom || ""} -> ${r.nameTo || ""}`
                )
                .join("\n")}\n\n`;
        }

        const ontology = data.phData.ontology;
        const filteredConcepts = (ontology?.concepts || []).filter(
            (c: any) => !existingNames.includes(c.name)
        );
        const filteredRels = (ontology?.relationships || []).filter(
            (r: any) =>
                !newExistingInfoObjects.relships.some((ir: any) => ir.name === r.name)
        );

        const newOntologyString =
            filteredConcepts.length > 0
                ? `**Objects**\n\n${filteredConcepts
                    .map((c: any) => `${c.name} - ${c.description || ""}`)
                    .join("\n")}\n\n**Relationships**\n\n${filteredRels
                        .map(
                            (r: any) =>
                                `${r.nameFrom || ""} - ${r.name} - ${r.nameTo || ""}`
                        )
                        .join("\n")}\n\n`
                : "";

        const ontologyString = `**Objects**\n\n${ontology?.concepts
            ?.map((c: any) => `- ${c.name} - ${c.description || ""}`)
            .join("\n")}\n\n**Relationships**\n\n${ontology?.relationships
                ?.map(
                    (r: any) => `- ${r.name} - ${r.description || ""} - ${r.nameFrom} - ${r.nameTo}`
                )
                .join("\n")}\n\n`;

        setContextItems(`${conceptString}\n\n`);
        setContextOntology(`${ontologyString}\n\n${newOntologyString}`);
    }, [curmod?.id, data?.phData?.ontology?.concepts]);

    // ---------- 6. Temperature preference ----------
    useEffect(() => {
        const savedTemp = localStorage.getItem("aiDashboard_temperature");
        if (savedTemp) setTemperature(parseFloat(savedTemp));
    }, []);

    // ---------- 7. Track irtvContent changes (debug) ----------
    useEffect(() => {
        if (!irtvContent) return;
        if (!debug) return;
        const contentString = String(irtvContent);
        console.log("488b[irtvContent changed]", {
            type: typeof irtvContent,
            length: contentString.length,
            preview: contentString.slice(0, 120)
        });
    }, [irtvContent, debug]);

    // ---------- 8. Placeholder detection ----------
    useEffect(() => {
        if (!input) {
            setTemplatePlaceholders([]);
            return;
        }
        const placeholderRegex = /\[([^\[\]]+)\]/g;
        const placeholders: { text: string; start: number; end: number }[] = [];
        let match;
        while ((match = placeholderRegex.exec(input)) !== null) {
            placeholders.push({
                text: match[1],
                start: match.index,
                end: match.index + match[0].length
            });
        }
        setTemplatePlaceholders(placeholders);
    }, [input]);

    // ---------- Helpers ----------
    const handleRetry = () => {
        setStatusMsg("");
        // could re-trigger last action
    };

    const handleSaveIRTV = () => {
        if (!irtvAnalysis) {
            alert("No IRTV analysis to save");
            return;
        }
        const updatedContent = irtvContent
            ? `${irtvContent}\n\n---\n\n${irtvAnalysis}`
            : irtvAnalysis;
        setIrtvContent(updatedContent);
        onAddContent(updatedContent);
        setDispatchDone(true);
    };

    const handleCopyMessage = (content: string, index: number) => {
        navigator.clipboard
            .writeText(content)
            .then(() => {
                setCopiedIndex(index);
                setTimeout(() => setCopiedIndex(null), 2000);
            })
            .catch((err) => console.error("Copy failed:", err));
    };

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

    const handleModelBuilder = async () => {
        setIsLoading(true);
        setStep(1);
        setActiveTab("model");

        try {
            const res = await fetch("/api/genmodel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    aiModelName: selectedModel || "gpt-4o",
                    schemaName: "ObjectSchema",
                    systemPrompt: systemPrompt || "",
                    systemBehaviorGuidelines: systemBehaviorGuidelines || "",
                    userPrompt: userPrompt || "",
                    userInput: input?.trim() || "",
                    contextItems: contextItems || "",
                    contextOntology: contextOntology || "",
                    contextMetamodel: contextMetamodel || ""
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`API Error ${res.status}: ${errorText}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let raw = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                raw += decoder.decode(value, { stream: true });
            }

            if (!raw.trim()) throw new Error("Empty response from API");

            let parsed: any;
            try {
                parsed = JSON.parse(raw);
            } catch {
                parsed = {
                    name: "Text Response Model",
                    description: `Raw response (truncated): ${raw.slice(0, 400)}`,
                    objects: [],
                    relships: []
                };
            }

            let validatedData: any;
            try {
                const sanitized = {
                    name: parsed.name || "Generated Model",
                    description: parsed.description || "AI-generated model",
                    objects: (parsed.objects || []).map((o: any, i: number) => ({
                        id: o.id || `obj-${Date.now()}-${i}`,
                        name: o.name || `Object ${i + 1}`,
                        description: o.description || `Generated object ${i + 1}`,
                        typeRef: o.typeRef || `type-${Date.now()}-${i}`,
                        typeName: o.typeName || "GeneratedType",
                        proposedType: o.proposedType || "Information"
                    })),
                    relships: (parsed.relships || []).map((r: any, i: number) => ({
                        id: r.id || `rel-${Date.now()}-${i}`,
                        name: r.name || `Relationship ${i + 1}`,
                        typeRef: r.typeRef || `reltype-${Date.now()}-${i}`,
                        fromobjectRef: r.fromobjectRef || "",
                        nameFrom: r.nameFrom || "",
                        toobjectRef: r.toobjectRef || "",
                        nameTo: r.nameTo || ""
                    }))
                };
                validatedData = ObjectSchema.parse(sanitized);
            } catch {
                validatedData = {
                    name: parsed.name || "Generated Model",
                    description: parsed.description || "AI-generated model",
                    objects: [],
                    relships: []
                };
            }

            setIrtvContent(parsed);
            const markdownResponse = formatJSONAsMarkdown(validatedData);

            const assistantMessage: Message = {
                role: "assistant",
                content: markdownResponse
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setModel({ ...parsed, id: curmod?.id });
            setStep(3);
        } catch (e: any) {
            const msg = e?.message || "Unknown error";
            setStatusMsg(`Model building failed: ${msg}`);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `I encountered an error:\n\n**Error:** ${msg}\n\nSuggestions:\n- Try a different model\n- Simplify your request\n- Check connectivity\n- Retry later`
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;
        const content = docRefine ? `${input} #Content:\n ${irtvContent}` : input;
        setMessages((prev) => [...prev, { role: "user", content }]);
        await handleModelBuilder();
        setInput("");
        onResponseChange("");
        setShowDigitalRain(false);
    };

    // Minimal modal component
    const Modal = ({
        isOpen,
        onClose,
        children
    }: {
        isOpen: boolean;
        onClose: () => void;
        children: React.ReactNode;
    }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="p-6">{children}</div>
                </div>
            </div>
        );
    };

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

    const printPromptsDiv = useMemo(
        () => (
            <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">System Prompt</h3>
                    <div className="bg-gray-800 p-3 rounded">
                        <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                            {systemPrompt}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">User Prompt</h3>
                    <div className="bg-gray-800 p-3 rounded">
                        <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                            {userPrompt}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">
                        Document Content (Primary Input)
                    </h3>
                    <div className="bg-gray-800 p-3 rounded">
                        <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                            {mdPreview || "No document content available"}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        ),
        [systemPrompt, userPrompt, mdPreview]
    );

    if (debug) {
        console.log("[dbg textarea binding]", { input, curMetamodel });
    }

    return (
        <div className="flex flex-col min-h-0 h-full rounded-lg sm:h-[99%] sm:min-w-[460px] overflow-hidden relative">
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

                            {isStreaming && irtvAnalysis && (
                                <div className="mb-4 p-3 rounded-lg flex flex-col gap-2 bg-secondary mr-auto w-full border-4 border-secondary">
                                    <ThinkingAnimation />
                                    <div className="text-sm whitespace-pre-wrap">{streamedContent}</div>
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex justify-start my-4">
                                    <ThinkingAnimation />
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {statusMsg && (
                        <div className="flex items-center bg-blue-400/20 border-blue-700 text-blue-500 px-4 py-2 mb-2 rounded-md text-sm">
                            <Info className="w-4 h-4 mr-2" />
                            <span>{statusMsg}</span>
                            {(statusMsg.includes("timed out") ||
                                statusMsg.includes("Failed to communicate") ||
                                statusMsg.includes("error")) && (
                                    <button
                                        onClick={handleRetry}
                                        className="ml-auto px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                        disabled={isLoading || retryInProgress.current}
                                    >
                                        {isLoading ? "Retrying..." : "Retry Request"}
                                    </button>
                                )}
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="relative bottom-7 left-0 right-0 bg-popover pb-safe mt-1 rounded-lg z-10">
                <form onSubmit={handleSubmit} className="p-1 bg-popover rounded-lg">
                    <TextareaAutosize
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your requirements or instructions here..."
                        className="w-full px-2 py-2 bg-popover border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minRows={6}
                        maxRows={12}
                        disabled={isLoading}
                    />
                    <div className="flex flex-row justify-between rounded gap-1">
                        <div className="flex items-center gap-2" />
                        <div className="flex flex-row items-center text-foreground gap-1">
                            <div className="texts bg-gray-800 border border-gray-600 rounded text-sm px-2">
                                <ModelSelector
                                    selectedModel={selectedModel}
                                    onModelChange={(m) => {
                                        setSelectedModel(m);
                                    }}
                                />
                            </div>
                            <TemperatureSelector />
                        </div>

                        <div className="flex justify-between px-2">
                            <button
                                type="submit"
                                className="flex items-center bg-gray-800 rounded-full px-3 py-1 mb-1 text-blue-300 hover:text-blue-100 hover:bg-gray-700 disabled:opacity-50"
                                disabled={isLoading || !input?.trim()}
                                title="Send your question"
                            >
                                Send
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

                <Modal
                    isOpen={isSystemPromptOpen}
                    onClose={() => setIsSystemPromptOpen(false)}
                >
                    <h2 className="text-xl font-bold mb-4 text-blue-400">System Prompt</h2>
                    <div className="bg-gray-800 p-4 rounded-md border border-gray-600">
                        <pre className="whitespace-pre-wrap text-sm">
                            {systemPrompt || "(empty system prompt)"}
                        </pre>
                    </div>
                    {contextContent && isContextAttached && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Attached Context</h3>
                            <div className="bg-gray-900 p-3 rounded border border-gray-700 text-xs whitespace-pre-wrap">
                                {contextContent.slice(0, 800)}
                                {contextContent.length > 800 && "..."}
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setIsSystemPromptOpen(false)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            </div>
        </div>
    );
}