"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo
} from "react";
import Link from 'next/link';
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { useDispatch, useSelector } from "react-redux";
import { X, HelpCircle, Info } from "lucide-react";
// (Make sure these imports exist; adjust paths to your project)
import {
    addMessage,
    setMessages as chatSetMessages,
} from '@/features/chat/chatSlice';
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, setFocusModelview, Metis, Model } from '@/features/model-universe/modelSlice';
import { RootState, AppDispatch } from "@/store";
import { ObjectSchema } from "@/objectSchema";
import ModelSelector from '@/components/ai-chat/ModelSelector';
import TemperatureSelector from '@/components/ai-chat/TemperatureSelector';
import DigitalRainIntro from '@/components/ai-chat/DigitalRainIntro';
import GettingStartedGuide from '@/components/model-builder/GettingStartedGuide';
import { SystemPrompt, DeveloperPrompt, UserPrompt } from '@/app/model-builder/prompts';
import { mapModelId } from '@/lib/ai/modelMap';
import { convertDocxToMarkdown } from '@/utils/DOCX-to-Markdown';
import { streamGenmodel } from '@/lib/ai/genmodel';

const debug = false;
interface ModelBuilderProps {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    selectedModel: "dummy" | "deepseek-chat" | "mistral" | "gpt-5" | "gpt-5-mini";
    setSelectedModel: React.Dispatch<React.SetStateAction<"dummy" | "deepseek-chat" | "mistral" | "gpt-5" | "gpt-5-mini">>;
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    onViewInPreview: (response: string) => void;
    setShowLeftPanel: React.Dispatch<React.SetStateAction<boolean>>;
    onAddContent: (content: string) => void;
    modelContent: string;
    setModelContent: React.Dispatch<React.SetStateAction<string | Model | null>>;
    modelPreview: string;
    setModelPreview: React.Dispatch<React.SetStateAction<string>>;
    setCurrentMessages: React.Dispatch<React.SetStateAction<any[]>>;
    gettingStartedGuide: React.ReactNode;
    guide: React.ReactNode;
}

export default function ModelBuilderComponent(props: ModelBuilderProps) {
    const {
        input,
        setInput,
        selectedModel, //AI model
        setSelectedModel,
        onResponseChange,
        onViewInPreview,
        onViewInMarkdown,
        setShowLeftPanel,
        onAddContent,
        modelContent,
        setModelContent,
        modelPreview,
        setModelPreview,
        setCurrentMessages,
        gettingStartedGuide,
        guide
    } = props;

    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();

    const domain = useSelector((state: RootState) => data.phData?.domain);
    const [model, setModel] = useState<any>(null);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<any>(null);
    const [modelview, setModelview] = useState<any>(null);
    const focusModelview = useSelector((state: RootState) => data.phFocus?.focusModelview?.id || '');
    const [messages, setMessages] = useState<Message[]>([]);
    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [statusMsg, setStatusMsg] = useState("");
    const [inputMessage, setInputMessage] = useState("");

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

    const [modelAnalysis, setmodelAnalysis] = useState<any>(null);
    const [requirements, setRequirements] = useState("");
    const [testScenarios, setTestScenarios] = useState<any[]>([]);
    const [verificationCriteria, setVerificationCriteria] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState("Business");

    const [userPrompt, setUserPrompt] = useState("");
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [systemPrompt, setSystemPrompt] = useState<string>("");
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [contextItems, setContextItems] = useState("");
    const [contextOntology, setContextOntology] = useState("");
    const [context, setContext] = useState<any>(domain);
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
    //     const IRTVSystemPrompt = `You are an expert IRTV (Information Requirements for Testing and Verification) analyst. 
    // Your task is to analyze requirements and generate comprehensive IRTV documentation that identifies all information needs for testing and verification activities.

    // Focus on:
    // - Information Requirements identification
    // - Test data specifications
    // - Verification criteria
    // - Traceability requirements
    // - Documentation standards

    // Verify that your responses are based on the provided context and requirements.
    // `;

    // ---------- Stable preview handler ----------
    const handleViewInMarkdown = useCallback(
        (content: string) => {
            setModelPreview(content);
            onViewInPreview(content);
            if (onViewInMarkdown) {
                try {
                    onViewInMarkdown(content);
                } catch (err) {
                    console.error("onViewInMarkdown prop error:", err);
                }
            } else if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "[ModelBuilderComponent] onViewInMarkdown prop not supplied; internal preview only."
                );
            }
        },
        [onViewInPreview, onViewInMarkdown, setModelPreview]
    );


    // ----------  Sync focus model from redux to local state ----------
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
        setCurMetamodel((prev: any) => (prev?.id === (nextMetamodel as any)?.id ? prev : nextMetamodel));

        if (debug) {
            console.log("[focus-sync] focusId:", focusId,
                "model:", nextModel?.name,
                "metamodel:", (nextMetamodel as any)?.name);
        }
    }, [
        data?.phFocus?.focusModel?.id,
        data?.phData?.metis?.models,
        data?.phData?.metis?.metamodels
    ]);

    // ---------- Auto-prompt generation when curmod or curMetamodel changes ----------
    useEffect(() => {
        if (!curmod || !curMetamodel) return;
        // Find relevant models for context (POPS and IRTV)
        const popsmodel = data?.phData?.metis?.models?.find((m: any) => m.name.includes("POPS"));
        const popsProcesses = popsmodel?.objects?.filter((o: any) => o.typeName === "Process") || []; // all processes in POPS for use in IRTV
        const popsProcessesNames = popsProcesses.map((p: any) => p.name);

        const irtvmodel = data?.phData?.metis?.models?.find((m: any) => m.name.includes("IRTV"));

        const irtvObjectNames = irtvmodel?.objects
            ?.filter((o: any) => ["Information", "Role", "Task", "View"].includes(o.typeName) && o.name)
            .map((o: any) => o.name) || [];
        const irtvRelNames = irtvmodel?.relships // filter only Information relationships for CORE_META
            .map((p: any) => p.name)
            .filter((name: string, idx: number, arr: string[]) => arr.indexOf(name) === idx) || [];
        const irtvInfoObjects = irtvmodel?.objects // filter only Information objects for CORE_META
            ?.filter((o: any) => o.typeName === "Information" && o.name)
            .map((o: any) => o.name) || [];
        // const irtvInfoRelationships = irtvmodel?.relships
        //     ?.filter((r: any) => (r.fromObjectRef && r.toObjectRef)
        //     .map((r: any) => r.name) || [];
        const irtvInfoRelationships = [""]; // Placeholder for now
        let types: string[] = [];
        let nextAutoPrompt = "";

        // Basic filtering for relevant types (not used?)
        types = (curMetamodel.objecttypes || []) // filter out no relevant types
            .filter((o: any) => o.name !== "EntityType")
            .filter((o: any) => o.name !== "Gateway")
            .filter((o: any) => o.name !== "Element")
            .filter((o: any) => o.name !== "Generic")
            .filter((o: any) => o.name !== "Label")
            .map((o: any) => o.name + ', ');
        nextAutoPrompt = "Create objects and relationships based on the ontology concepts below and according to the types defined in the Metamodel"

        switch (curMetamodel.name) {
            case "IRTV_META":
                types = (curMetamodel.objecttypes || []) // filter out no relevant types
                    .filter((o: any) => o.name !== "Element")
                    .filter((o: any) => o.name !== "Generic")
                    .filter((o: any) => o.name !== "Label")
                    .map((o: any) => o.name + ', ');

                nextAutoPrompt = `Build IRTV Workspaces for the the following Processes: ${popsProcessesNames.join(", ")}. and the Domain definition in the #Context below.
Create a Container for each process and add Information objects with vital Properties. 
Then add Views, Tasks and Roles related to the Information objects, using the metamodel-types:  ${types.length ? types.join(" ") : ""} 
Create a hasMember relationship from the Process Container to each IRTV objects it uses.
Do not repeate type-names in the name of objects.
`;
                break;
            case "CORE_META":
                types = (curMetamodel.objecttypes || []) // filter out no relevant types
                    .filter((o: any) => o.name !== "InputPattern")
                    .filter((o: any) => o.name !== "Details")
                    .filter((o: any) => o.name !== "Method")
                    .filter((o: any) => o.name !== "MethodType")
                    .filter((o: any) => o.name !== "ViewFormat")
                    .filter((o: any) => o.name !== "Fieldtype")
                    .filter((o: any) => o.name !== "Type")
                    .map((o: any) => o.name + ', ');
                nextAutoPrompt = `Build a TYPE model based on IRTV Information objects: ${irtvInfoObjects.join(", ")} and relationships: ${irtvInfoRelationships.join(", ")},  
and the Domain definition in the #Context below.
Evaluate the Information objects with Properties and Relationships for logical consistency.
Do not repeat type-names in the name of objects. Remove any IRTV type-names in the name of objects. The Information objects should be represented as EntityType objects.
${types.length ? `Create objects and relationships using the following object types: ${types.join(" ")}` : ""}
Start with creating an object of type Metamodel with a relship "contains" to all objects of type EntityType.
`
                break;
            case "POPS_META":
                types = (curMetamodel.objecttypes || []) //
                    .filter((o: any) => o.name !== "EntityType")
                    .filter((o: any) => o.name !== "Geobody")
                    .filter((o: any) => o.name !== "Material")
                    .filter((o: any) => o.name !== "DistributNetwork")
                    .filter((o: any) => o.name !== "Device")
                    .filter((o: any) => o.name !== "Label")
                    .filter((o: any) => o.name !== "Generic")
                    .filter((o: any) => o.name !== "Equipment")
                    .filter((o: any) => o.name !== "Facility")
                    .filter((o: any) => o.name !== "Event")
                    .filter((o: any) => o.name !== "Element")
                    .map((o: any) => o.name + ', ');

                nextAutoPrompt =
`Build a POPS model based on the Domain definition in the #Context below.
Create objects and relationships using the following object types:  ${
(types.length ? types.join(" ") : "")}
`;
                break;
            case "BPMN_META":
                types = (curMetamodel.objecttypes || [])
                    .filter((o: any) => o.name !== "EntityType")
                    .filter((o: any) => o.name !== "Gateway")
                    .filter((o: any) => o.name !== "Element")
                    .filter((o: any) => o.name !== "Generic")
                    .filter((o: any) => o.name !== "Label")
                    .map((o: any) => o.name + ', ');
                nextAutoPrompt =
`Build a BPMN model based on IRTV objects: ${irtvObjectNames.join(", ")} and relationships: ${irtvRelNames.join(", ")},  and the Domain definition in the #Context below.
Evaluate where BPMN pools and lanes are appropriate and ensure logical consistency. 
Do not use type-names in the name of objects. Remove any IRTV type-names in the name of objects. The Information objects should be represented as EntityType objects.

${types.length ? `Create objects and relationships using the following object types: ${types.join(" ")}` : ""}
`;
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



    // ---------- 5. When curmod changes, update existing info objects and ontology diff ----------
    useEffect(() => {
        if (!curmod || !data?.phData?.domain?.ontology) return;

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

        // Ensure we only map arrays
        const existingObjects =
            Array.isArray(curmod.objects)
                ? curmod.objects.map((o: any) => ({
                    id: o.id,
                    name: o.name,
                    description: o.description,
                    typeName: o.typeName
                }))
                : [];

        const existingRelationships =
            Array.isArray(curmod.relships)
                ? curmod.relships.map((rel: any) => ({
                    id: rel.id,
                    name: rel.name,
                    nameFrom: rel.nameFrom,
                    nameTo: rel.nameTo
                }))
                : [];

        // BUGFIX: use existingObjects (array), not existingInfoObjects (state object)
        const newExistingInfoObjects = {
            objects: existingObjects,
            relships: existingRelationships
        };

        setExistingInfoObjects(newExistingInfoObjects.objects.length > 0 ? newExistingInfoObjects : { objects: [], relships: [] });

        // Guard against non-array
        const existingNames = (newExistingInfoObjects.objects || []).map((o: any) => o.name);

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

        const ontology = data.phData.domain?.ontology;
        const filteredConcepts = (ontology?.concepts || []).filter(
            (c: any) => !existingNames.includes(c.name)
        );
        const filteredRels = (ontology?.relationships || []).filter(
            (r: any) =>
                !newExistingInfoObjects.relships.some((ir: any) => ir.name === r.name)
        );

        const newOntologyString =
            filteredConcepts.length > 0
                ? `#Ontology\n\n##Concepts\n\n${filteredConcepts
                    .map((c: any) => `${c.name} - ${c.description || ""}`)
                    .join("\n")}\n\n**Relationships**\n\n${filteredRels
                        .map(
                            (r: any) =>
                                `${r.nameFrom || ""} - ${r.name} - ${r.nameTo || ""}`
                        )
                        .join("\n")}\n\n`
                : "";

        const ontologyString = `**Concepts**\n\n${ontology?.concepts
            ?.map((c: any) => `- ${c.name} - ${c.description || ""}`)
            .join("\n")}\n\n**Relationships**\n\n${ontology?.relationships
                ?.map(
                    (r: any) => `- ${r.name} - ${r.description || ""} - ${r.nameFrom} - ${r.nameTo}`
                )
                .join("\n")}\n\n`;

        (newExistingInfoObjects.objects.length > 0) && setContextItems(`${conceptString}\n\n`);
        setContextOntology(`${newOntologyString}`);
    }, [curmod?.id, data?.phData?.domain?.ontology?.concepts]);

    // ---------- 6. Temperature preference ----------
    useEffect(() => {
        const savedTemp = localStorage.getItem("aiDashboard_temperature");
        if (savedTemp) setTemperature(parseFloat(savedTemp));
    }, []);

    // ---------- 7. Track modelContent changes (debug) ----------
    useEffect(() => {
        if (!modelContent) return;
        if (!debug) return;
        const contentString = String(modelContent);
        console.log("488b[modelContent changed]", {
            type: typeof modelContent,
            length: contentString.length,
            preview: contentString.slice(0, 120)
        });
    }, [modelContent, debug]);

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
        if (!modelAnalysis) {
            alert("No IRTV analysis to save");
            return;
        }
        const updatedContent = modelContent
            ? `${modelContent}\n\n---\n\n${modelAnalysis}`
            : modelAnalysis;
        setModelContent(updatedContent);
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

    const handleClearChat = useCallback(() => {
        setMessages([]);                // clear local UI
        dispatch(chatSetMessages([]));  // clear Redux slice (keeps global in sync)
        setStatusMsg("");
        setStreamedContent("");
        setPreviewMessageIndex(null);
    }, [dispatch]);

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

    // ---------- Build system behavior + context when curMetamodel changes ----------
    useEffect(() => {
        if (!curMetamodel || !data?.phData?.metis) return;

        let metatypesString = "";
        let exampleString = "";
        if (curMetamodel.name === "IRTV_META") {
            setSystemBehaviorGuidelines(DeveloperPrompt);

            metatypesString = serializeTypes(curMetamodel);
            metatypesString = metatypesString
                .split("\n")
                .filter(line => !line.includes("name: EntityType"))
                .join("\n");
        } else if (curMetamodel.name === "CORE_META") {
            setSystemBehaviorGuidelines(`You are an expert in Type definition analysis. 
Your task is to create a Type definition Model based on the provided CORE_META Metamodel. 
One object of type "Metamodel"  with relationship "contains" to all EntityType objects.
EntityType objects representing domain concepts may have properties.
Ensure logical consistency and relationship principles.`
            );
            metatypesString = serializeTypes(curMetamodel);
            // console.log('316 metatypesString', metatypesString);
            exampleString += `
{
    "models: [
        {
            id: "UUID",
            "name": "FoodProduction",
            "description": "A model representing food production processes and products.",
            "metamodelRef": "POPS_META uuid",
            "modelviews": [
                {
                    "name": "Main",
                    "description": "The main view of the model",
                    "objects": [
                        {
                            "id": "UUID",
                            "name": "Bike",
                            "description": "A two-wheeled vehicle that is powered by pedaling.",
                            "typeRef": "Process uuid",
                            "typeName": "Process"
                        }
                    ],
                    "relationships": [
                        {
                            "id": "UUID",
                            "name": "approves",
                            "typeRef": "Relationship Type uuid",
                            "fromobjectRef": "Process uuid",
                            "toobjectRef": "Property uuid",
                        }
                    ]
                }
            ]
        }
    ]
}
        `;
        } else if (curMetamodel.name === "POPS_META") {
            setSystemBehaviorGuidelines(
                `You are an expert in creating POPS models. Create a POPS model based on the provided ontology concept types and relationships. Ensure consistency with Active Knowledge Modeling principles.`
            );
            metatypesString = serializeTypes(curMetamodel);
            metatypesString = metatypesString
                .split("\n")
                .filter(line => !line.includes("name: EntityType"))
                .filter(line => !line.includes("name: Geobody"))
                .filter(line => !line.includes("name: Material"))
                .filter(line => !line.includes("name: DistributionNetwork"))
                .filter(line => !line.includes("name: Device"))
                .filter(line => !line.includes("name: Label"))
                .filter(line => !line.includes("name: Generic"))
                .filter(line => !line.includes("name: Equipment"))
                .filter(line => !line.includes("name: Facility"))
                .filter(line => !line.includes("name: DistributionNetwork"))
                .filter(line => !line.includes("name: Event"))
                .join("\n");

            exampleString += `
{ 
    "models: [
        { 
            id: "UUID",
            "name": "FoodProduction",
            "description": "A model representing food production processes and products.",
            "metamodelRef": "POPS_META uuid",
            "objects": [
                {
                    "id": "UUID",
                    "name": "Produce",
                    "description": "A two-wheeled vehicle that is powered by pedaling.",
                    "typeRef": "Process uuid",
                    "typeName": "Process"
                },
            ],
            "relationships": [
                {
                    "id": "UUID",
                    "name": "hasOutcome",
                    "typeRef": "Relationship Type uuid",
                    "fromobjectRef": "Process uuid",
                    "nameFrom": "Process",
                    "toobjectRef": "Product uuid",
                    "nameTo": "Product"
                }
            ]
        }
    ]
}
`;
        } else if (curMetamodel.name === "BPMN_META") {
            setSystemBehaviorGuidelines(
                `You are an expert in creating BPMN models. Use BPMN notation, pools, lanes, and ensure logical consistency with Active Knowledge Modeling principles.`
            );
            metatypesString = serializeTypes(curMetamodel);
            exampleString += `
    {
    "objects": [
        {
            "id": "UUID",
            "name": "Write code",
            "description": "A two-wheeled vehicle that is powered by pedaling.",
            "typeRef": "Task uuid",
            "typeName": "Task"
            },
        }
    ],
    "relationships": [
        {
            "id": "UUID",
            "name": "approves",
            "typeRef": "Relationship Type uuid",
            "fromobjectRef": "Role uuid",
            "nameFrom": "Role",
            "toobjectRef": "Task uuid",
            "nameTo": "Task"
        }
    ]
    }
        `;
        }

        const contextmetatypesString = `## Metamodel \n\n ${metatypesString} 

- When creating objects, always assign a valid typeRef and typeName from the Metamodel.
- When creating relationships, ensure from/to object types align with Metamodel definitions.    
`;
        // ## Example 
        //     ${exampleString}  



        // Set base system prompt (from local prompts.ts)
        setSystemPrompt(SystemPrompt);
        setContextMetamodel(contextmetatypesString);
        setUserPrompt(""); // reset user prompt if it matched default before

        // Keep focus model synced
        const mod = data.phData.metis.models?.find(
            (m: any) => m.metamodelRef === curMetamodel.id
        );
        if (mod && (!curmod || curmod.id !== mod.id)) {
            setCurmod(mod);
            dispatch(setFocusModel({ id: mod.id, name: mod.name }));
            if (focusModelview === '') {
                dispatch(setFocusModelview({ id: mod.modelviews?.[0]?.id, name: mod.modelviews?.[0]?.name }));
            }
        }
    }, [curMetamodel, data?.phData?.metis, dispatch, curmod]);

    function serializeTypes(mm: any) {
        const objectTypes = Array.isArray(mm.objecttypes) ? mm.objecttypes : [];
        const relshipTypes = Array.isArray(mm.relshiptypes) ? mm.relshiptypes : [];

        // Build a non-mutating copy where we ensure nameFrom/nameTo are resolved
        const relshipTypesWithNames = relshipTypes.map((reltype: any) => {
            const resolvedFrom = objectTypes.find((obj: any) => obj.id === reltype.fromobjtypeRef);
            const resolvedTo = objectTypes.find((obj: any) => obj.id === reltype.toobjtypeRef);

            return {
                // shallow copy to avoid mutating original reltype
                ...reltype,
                // prefer existing nameFrom/nameTo if present, otherwise resolved names, otherwise empty string
                nameFrom: reltype?.nameFrom || (resolvedFrom ? resolvedFrom.name : "") || "",
                nameTo: reltype?.nameTo || (resolvedTo ? resolvedTo.name : "") || ""
            };
        });

        const filteredObjectTypes = objectTypes;

        const filteredRelTypes = relshipTypesWithNames.filter((r: any) =>
            r && typeof r.name === 'string' && r.name !== "Is"
        );

        // Debug output kept as before
        console.log('serializeTypes', { objectTypes, filteredObjectTypes, relshipTypes, filteredRelTypes });
        console.log('serializeTypes', { data });

        return `**${mm.name}**
### Object Types
${filteredObjectTypes
                .map((o: any) => `id: ${o.id}, name: ${o.name}, description: ${o.description}, typeName: ${o.typeName}, typeRef: ${o.typeRef}`)
                .join("\n")}

### Relationship Types
${filteredRelTypes
                .map((r: any) => `id: ${r.id}, name: ${r.name},  fromobjectRef: ${r.fromobjtypeRef}, nameFrom: ${r.nameFrom}, toobjectRef: ${r.toobjtypeRef}, nameTo: ${r.nameTo}, typeRef: ${r.typeRef}, relshipkind: ${r.relshipkind}`)
                .join("\n")}
`;
    }
    // ----------  Prompts ----------
    const finalSystemPrompt = `
You are a senior assistant specialized in Enterprise, Informations and Active Knowledge Modeling.
Your task is to build a model from the provided 'Existing Context' and Domain definition, conforming to the provided Metamodel.
Do not add the objects typenames in the object names.
Use the Metamodel object types and relationship types as defined in the Metamodel.
Ensure logical consistency and relationship principles.
Always use valid UUID strings for all ids.
Always use the provided metamodel typeRef for object typeRef and relationship typeRef.
Do not make up new object types or relationship types.
If the Domain definition is missing or insufficient, respond with suggestions for improvement.
`;

    let finalDeveloperPrompt = ''

    finalDeveloperPrompt =
`### Developer Instructions
Model:
- Required: id, name, description, objects[], relships[].
- Name should be a shortnmame representing the domain (e.g., "BikeRental", "ECommerce"), with the metamodel name as _suffix without "_META" if not obvious.
- Description should be a brief summary of the model's purpose.
- All ids should be unique UUID strings.

Objects:
- Required: id, name, description, typeRef, typeName, typeviewRef.
- All ids should be unique UUID strings.
- TypeName and typeRef must match a valid object type from the Metamodel.
- Use the ontology Concept names to name objects, but use the metamodel typeRef for typeRef.

Relships:
- Required: id, name, typeRef, fromobjectRef, fromName, toobjectRef, toName, relshiptypeRef.
- Relationship name should not include from/to object name.
- Relationship name should not have suffix "Rel".
- Use the metamodel relshiptypeRef for typeRef.
- All ids should be unique UUID strings.
- Ensure fromobjectRef and toobjectRef reference valid object ids defined in the objects[] array.
- Ensure typeRef aligns with the Metamodel relshiptype.
- Dont repeat the fromName and toName in the relationship name.
`;

    if (curMetamodel?.name === "CORE_META") (
        finalDeveloperPrompt +=
`
# Evaluate the domain then build a TYPE definition model.
## When building the model, follow these principles:
- Make one Metamodel object representing the Domain. The name should reflect the domain (e.g., "HealthcareMetamodel", "FinanceMetamodel").
- From Metamodel object to EntityType objects use the "contains" relationship.
- Make key Concepts and Terminologies into EntityType objects. Skip Tools, Software, Systems, Locations, Diagram and non-conceptual items.
- From EntityType objects to other EntityType objects create name from the domain using the relationship type "relationshipType".
- From EntityType objects to parent EntityTypes objects use the "Is" for inheritance.
- From EntityType objects to Properties use the "has" relationship.
- Use Properties to represent attributes of EntityType objects.
- Use Details to capture additional information about EntityType objects.
- Use Methods to represent actions or functions related to EntityType objects.
- Use MethodTypes to categorize Methods.
- Use ViewFormats to define how information is presented.
- Use Fieldtypes to specify data types for Properties.
`)
    if (curMetamodel?.name === "IRTV_META") (
        finalDeveloperPrompt +=
`
# Evaluate the domain then build a IRTV Workplace model.
## When building the model, follow these principles:
- Make key Actors and Roles into Role objects.
- Make Activities and Processes into Tasks.
- Make Views to represent the information needs for the tasks.
- 
`)
    if (curMetamodel?.name === "POPS_META") (
        finalDeveloperPrompt +=
        `
# Evaluate the domain then build a POPS model.
## When building the model, follow these principles:
- Make key Activities and Processes into Process objects.
- Make key Products into Product objects.
- Make key Services into Service objects.
- Use Geobodies to represent physical locations or structures.
- Use Devices to represent tools or equipment used in processes.
- Use DistributionNetworks to represent channels through which products/services are delivered.
- Process triggers Process with "triggers" relationship.
- Process hasOutcome Product with "hasOutcome" relationship.
- Process uses Services and Systems.
- Process input and output to Data.
- Organizations owns Processes and Products with "owns" relationship.
`)
    finalDeveloperPrompt += `${contextMetamodel} \n`



    // const finalUserPrompt = `${contextMetamodel} \n ${contextItems} \n ${contextOntology}`;
    // const finalUserPrompt = `${userPrompt}  \n ${contextMetamodel} \n ${contextItems} \n ${contextOntology} \n ${contextMetamodel}`;

    const handleModelBuilder = async (userText?: string) => {
        setIsLoading(true);
        setStep(1);
        setActiveTab("model");

        // Use the provided userText if available; otherwise fall back to inputMessage
        const finalUserPrompt = `${userText} \n ${context.presentation}`;

        if (!debug) console.log(
            `877 Prompts: selectedModel: ${selectedModel}\n\n` +
            `finalSystemPrompt: ${finalSystemPrompt}\n\n` +
            `finalDeveloperPrompt: ${finalDeveloperPrompt}\n\n` +
            `finalUserPrompt: ${finalUserPrompt}`
        );

        try {
            const payload = {
                aiModelName: mapModelId(selectedModel || "gpt-5-mini"),
                schemaName: "ObjectSchema",
                systemPrompt: finalSystemPrompt || "",
                developerPrompt: finalDeveloperPrompt || "",
                userPrompt: finalUserPrompt || ""
            } as const;

            let raw = "";
            const finalText = await streamGenmodel(payload, (chunk) => {
                raw += chunk;
            });
            if (finalText && finalText.length > raw.length) raw = finalText;

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
            console.log("680 [ModelBuilder] validatedData: ", validatedData, "parsed :", parsed);
            setModelContent(parsed);
            const markdownResponse = formatJSONAsMarkdown(validatedData);

            const assistantMessage: Message = {
                role: "assistant",
                content: markdownResponse
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setModel({ ...parsed, id: curmod?.id });
            setModelPreview(markdownResponse);

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

    // Update handleSubmit to pass `input` into handleModelBuilder
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('895 Model handleSubmit called!', { input, docRefine }); // Add this first
        if (!input?.trim()) return;
        const content = docRefine ? `${input} #Content:\n ${modelContent}` : input;
        setMessages((prev) => [...prev, { role: "user", content }]);

        // pass `input` directly so handleModelBuilder doesn't rely on a pending state update
        await handleModelBuilder(input);

        // preserve the rest of your state updates
        setInput("");
        setInputMessage(""); // optional: you can remove inputMessage state entirely if unused elsewhere
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

    // use shared TemperatureSelector component

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
        <div className="flex flex-col min-h-0 h-screen rounded-lg sm:h-[99%] sm:min-w-[460px] overflow-hidden relative">
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

                            {isStreaming && modelAnalysis && (
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
                    {messages.length > 0 && (
                        <div className="flex justify-end w-full">
                            <button
                                onClick={handleClearChat} // <-- use the new handler
                                title="Clear chat history"
                                className="py-1 text-xs text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {/* 
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
                    )} */}
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-24 left-0 right-0 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/80 border-t border-gray-700 rounded-t-lg z-10">
                <form onSubmit={handleSubmit} className="p-1 bg-transparent rounded-lg" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}>
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
                                    try { localStorage.setItem('aiDashboard_selectedModel', newModel); } catch { }
                                }}
                            />
                            <TemperatureSelector temperature={temperature} onChange={(t) => setTemperature(t)} />
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
}
