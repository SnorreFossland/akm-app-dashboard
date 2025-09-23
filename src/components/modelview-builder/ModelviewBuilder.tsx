"use client"
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { setFocusModel } from '@/features/model-universe/modelSlice';
import { Model, Modelview } from '@/features/model-universe/modelSlice';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import TextareaAutosize from 'react-textarea-autosize';
import DigitalRainIntro from '@/components/ai-chat/DigitalRainIntro';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';

import ReactMarkdown from 'react-markdown';

import { ModelviewSchema } from "@/modelviewSchema";
// import { ModelviewCard } from '@/components/modelview-card';
import { streamGenmodel } from '@/lib/ai/genmodel';
import { mapModelId } from '@/lib/ai/modelMap';

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
    const dispatch = useDispatch();
    const data = useSelector((state: RootState) => state.modelUniverse);
    const metis = useSelector((state: RootState) => state.modelUniverse.data?.metis);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<any>(null);
    const [curModelview, setCurModelview] = useState<Modelview | null>(null);
    const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);
    
    const [model, setModel] = useState<Model | null>(null);
    const [modelview, setModelview] = useState<Modelview | null>(null);

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

        // compute the model we should focus (respect focusModel if present)
        const newCurmod = models.find((m: any) => m.id === focusedId) || models[0] || null;

        // only update curmod if actually changed
        setCurmod((prev) => (prev?.id === newCurmod?.id ? prev : newCurmod));
        console.log("141 Data received:", data, newCurmod, curmod);

        if (!curmod?.objects || curmod.objects.length < 1) {
            console.log("no objects in current model");
            return;
        }

        // keep model state in sync (use newCurmod directly, not curmod which may be stale)
        setModel((prevModel) => {
            if (!newCurmod) return prevModel;
            if (prevModel && prevModel.id === newCurmod.id) return prevModel;
            return newCurmod;
        });

        // Safely compute filtered relationships and objects based on newCurmod
        const filteredRelationships = (newCurmod?.relships || []).filter((rel: any) => {
            const fromObject = (newCurmod?.objects || []).find((obj: any) => obj.id === rel.nameFrom);
            const toObject = (newCurmod?.objects || []).find((obj: any) => obj.id === rel.nameTo);
            return fromObject && toObject && rel;
        });

        const newExisting = {
            objects: newCurmod?.objects || [],
            relships: (filteredRelationships || []).filter((rel: any) =>
                (newCurmod?.objects || []).some((obj: any) => obj.id === rel.nameFrom || obj.id === rel.nameTo)
            ) || []
        };
    

        setExistingObjectsInModelview((prev) => {
            const prevObjects = prev?.objects || [];
            const prevRelships = prev?.relships || [];

            const sameObjects =
                prevObjects.length === newExisting.objects.length &&
                prevObjects.every((o: any, i: number) => o?.id === newExisting.objects[i]?.id);

            const sameRelships =
                prevRelships.length === newExisting.relships.length &&
                prevRelships.every((r: any, i: number) => r?.id === newExisting.relships[i]?.id);

            if (sameObjects && sameRelships) return prev;
            return newExisting;
        });
        const metamodels = (data?.phData?.metis?.metamodels as { id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] }[]) || [];
        const curMeta = metamodels.find((mm) => mm.id === curmod.metamodelRef) || null;
        setCurMetamodel(curMeta);
    }, [data?.phData?.metis?.models, data?.phFocus?.focusModel?.id, data]);

    useEffect(() => {
        if (!curmod && metis?.models?.length) {
            const m = metis.models[0];
            setCurmod(m);
            dispatch(setFocusModel({ id: m.id, name: m.name }));
        }
        if (curmod && !curModelview && curmod.modelviews?.length) {
            const mv = curmod.modelviews[0];
            setCurModelview(mv);
            setFocusModelview(mv ? { id: mv.id, name: mv.name } : null);
        }
    }, [metis, curmod, curModelview, dispatch]);

    useEffect(() => {
        console.log("224 Current model changed:", curmod);
        if (!curmod || curmod?.objects.length < 1) {
            setStreamedContent("No objects found in the current model.");
            return;
        }
        const nextAutoPrompt = `Create a Modelview with Objectviews and Relshipviews for the Objects and Relationships in the current model defined n the Context below.`
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
        let markdown = `# ${data.name || "Generated Modelview"}\n\n`;
        if (data.description) {
            markdown += `**Description:** ${data.description}\n\n`;
        }
        const oviews = data.objectviews || [];
        if (Array.isArray(oviews) && oviews.length) {
            markdown += "## Objectviews\n\n";
            oviews.forEach((ov: any, i: number) => {
                markdown += `### ${i + 1}. ${ov.name}\n\n`;
                markdown += `- **ID:** ${ov.id}\n`;
                markdown += `- **Type:** ${ov.typeName || ''}\n`;
                markdown += `- **Location:** ${ov.loc || ''}\n`;
                markdown += `- **Object Ref:** ${ov.objectRef || ''}\n`;
                markdown += `- **Description:** ${ov.description || ''}\n`;
            });
        }
        const rviews = data.relshipviews || [];
        if (Array.isArray(rviews) && rviews.length) {
            markdown += "## Relationship Views\n\n";
            rviews.forEach((rv: any, i: number) => {
                markdown += `### ${i + 1}. ${rv.name}\n\n`;
                markdown += `- **ID:** ${rv.id}\n`;
                markdown += `- **From Ref:** ${rv.fromobjviewRef || ''}\n`;
                markdown += `- **To Ref:** ${rv.toobjviewRef || ''}\n`;
                const pts = Array.isArray(rv.points) ? rv.points.join(', ') : '';
                markdown += `- **Points:** ${pts}\n\n`;
            });
        }
        return markdown;
    };


    // Normalize common AI response shapes into a single ModelviewSchema-compatible object
    const normalizeModelviewResponse = (raw: any) => {
        let candidate: any = raw;
        // Unwrap if wrapped in { modelview } or { modelviews: [..] }
        if (raw && typeof raw === 'object') {
            if (Array.isArray(raw.modelviews) && raw.modelviews.length) {
                candidate = raw.modelviews[0];
            } else if (raw.modelview && typeof raw.modelview === 'object') {
                candidate = raw.modelview;
            }
        }
        // Map alternate property names
        if (candidate.objects && !candidate.objectviews) candidate.objectviews = candidate.objects;
        if (candidate.relationships && !candidate.relshipviews) candidate.relshipviews = candidate.relationships;
        if (candidate.relations && !candidate.relshipviews) candidate.relshipviews = candidate.relations;

        // Ensure required fields
        if (!candidate.id) {
            try { candidate.id = crypto.randomUUID(); } catch { candidate.id = String(Date.now()); }
        }
        candidate.name = candidate.name || 'Generated Modelview';
        candidate.description = candidate.description || '';
        candidate.objectviews = Array.isArray(candidate.objectviews) ? candidate.objectviews : [];
        candidate.relshipviews = Array.isArray(candidate.relshipviews) ? candidate.relshipviews : [];

        // Helper: strict UUID check
        const isValidUUID = (s: any) => {
            if (typeof s !== 'string') return false;
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
        };

        const makeUUID = () => {
            try { return crypto.randomUUID(); } catch {
                // fallback formatted string with version 4 marker
                const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                // produce xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
                return `${rnd()}${rnd()}-${rnd()}-4${rnd().substr(0, 3)}-${((8 + (Math.random() * 4)) | 0).toString(16)}${rnd().substr(0, 3)}-${rnd()}${rnd()}${rnd()}`;
            }
        };

        // Maps for consistent remapping of non-UUID originals -> generated UUIDs
        const originalRelToUuid = new Map<string, string>();
        const originalTypeToUuid = new Map<string, string>();
        // note: objectviews mapping is built after normalizing objectviews

        const ensureMappedUUID = (map: Map<string, string>, original?: any) => {
            if (!original && original !== 0) return makeUUID();
            const key = String(original);
            if (isValidUUID(key)) return key;
            if (map.has(key)) return map.get(key)!;
            const g = makeUUID();
            map.set(key, g);
            return g;
        };

        // First, normalize objectviews and ensure consistent UUID ids and typeviewRef
        const objectviews = (candidate.objectviews || []).map((ov: any, idx: number) => {
            // try to pull potential ids from common fields (objectId, viewId, id)
            const possibleId = ov.id || ov.objectId || ov.viewId;
            const id = isValidUUID(possibleId) ? possibleId : makeUUID();

            const typeviewKey = ov.typeviewRef || ov.typeRef || ov.typeName || ov.type || null;
            // For typeviewRef we map names/non-uuids to generated UUIDs so schema sees a UUID
            const typeviewRef = ensureMappedUUID(originalTypeToUuid, typeviewKey);

            return {
                // keep other fields, but guarantee id & name exist and include typeviewRef
                id,
                name: ov.name || ov.objectName || `object-${idx + 1}`,
                description: ov.description || '',
                typeName: ov.typeName || ov.type || ov.proposedType || '',
                loc: ov.loc || ov.location || '',
                objectRef: ov.objectRef || ov.objectId || ov.ref || '',
                typeviewRef
            };
        });

        // Build lookup maps to resolve refs that might be returned as names or objectRefs
        const ovById = new Map<string, any>();
        const ovByName = new Map<string, any>();
        const ovByObjectRef = new Map<string, any>();
        objectviews.forEach((ov: any) => {
            ovById.set(ov.id, ov);
            if (ov.name) ovByName.set(String(ov.name).toLowerCase(), ov);
            if (ov.objectRef) ovByObjectRef.set(String(ov.objectRef), ov);
        });

        // Coerce relationship views fields and resolve references to the actual UUIDs from objectviews
        const relshipviewsRaw = (candidate.relshipviews || []).map((rv: any, idx: number) => {
            const id = isValidUUID(rv.id) ? rv.id : makeUUID();
            const name = rv.name || `rel-${idx + 1}`;

            // incoming potential reference strings (may be uuid, name, objectRef, index etc.)
            const rawFrom = rv.fromobjviewRef || rv.from || rv.fromRef || rv.fromId || rv.fromObject || rv.fromName || '';
            const rawTo = rv.toobjviewRef || rv.to || rv.toRef || rv.toId || rv.toObject || rv.toName || '';

            const resolveRef = (raw: any) => {
                if (!raw && raw !== 0) return null;
                const s = String(raw).trim();
                if (isValidUUID(s) && ovById.has(s)) return s;            // already uuid and points to a known objectview
                if (isValidUUID(s) && !ovById.has(s)) return s;           // uuid but unknown: keep it (schema may still accept)
                // try by name (case-insensitive)
                const byName = ovByName.get(s.toLowerCase());
                if (byName) return byName.id;
                // try by objectRef
                const byObjRef = ovByObjectRef.get(s);
                if (byObjRef) return byObjRef.id;
                // maybe it's an index-like "obj1" or "1" -> try numeric index mapping to objectviews
                const digits = s.replace(/[^\d]/g, '');
                if (digits) {
                    const num = Number(digits);
                    if (!isNaN(num) && objectviews[num - 1]) return objectviews[num - 1].id;
                }
                // not resolvable -> null
                return null;
            };

            let fromResolved = resolveRef(rawFrom);
            let toResolved = resolveRef(rawTo);

            // If unresolved, try fallback heuristics: match by "fromName"/"toName" occurrences inside rv payload
            if (!fromResolved && rv.fromName) fromResolved = resolveRef(rv.fromName);
            if (!toResolved && rv.toName) toResolved = resolveRef(rv.toName);

            // Final fallback: if still unresolved, attach to a deterministic objectview (first or a new UUID)
            if (!fromResolved) {
                if (objectviews.length > 0) {
                    fromResolved = objectviews[0].id;
                } else {
                    fromResolved = makeUUID();
                }
            }
            if (!toResolved) {
                if (objectviews.length > 1) {
                    toResolved = objectviews[1].id;
                } else if (objectviews.length === 1) {
                    // if only one objectview exists, point to the same (prevents null refs)
                    toResolved = objectviews[0].id;
                } else {
                    toResolved = makeUUID();
                }
            }

            // Ensure relshipRef exists and is a UUID
            const relshipRefKey = rv.relshipRef || rv.relshipId || rv.relationshipId || rv.relationship || rv.rel || null;
            const relshipRef = ensureMappedUUID(originalRelToUuid, relshipRefKey);

            // Ensure typeviewRef for relationship
            const typeviewKey = rv.typeviewRef || rv.typeRef || rv.typeName || rv.type || null;
            const typeviewRef = ensureMappedUUID(originalTypeToUuid, typeviewKey);

            // Normalize points array to numbers and flatten nested coordinates
            const points: number[] = [];
            if (Array.isArray(rv.points)) {
                rv.points.forEach((p: any) => {
                    if (typeof p === 'number') {
                        if (!Number.isNaN(p)) points.push(p);
                        return;
                    }
                    if (Array.isArray(p)) {
                        p.forEach((n) => {
                            const num = typeof n === 'number' ? n : Number(n);
                            if (!Number.isNaN(num)) points.push(num);
                        });
                        return;
                    }
                    if (p && typeof p === 'object') {
                        ['x', 'y'].forEach((key) => {
                            const num = Number((p as Record<string, unknown>)[key]);
                            if (!Number.isNaN(num)) points.push(num);
                        });
                    }
                });
            }

            return {
                id,
                name,
                fromobjviewRef: fromResolved,
                toobjviewRef: toResolved,
                relshipRef,
                typeviewRef,
                points
            };
        });

        // Deduplicate relshipviews by key (name/from/to/relshipRef/typeviewRef)
        const seenRelKeys = new Set<string>();
        const relshipviews = relshipviewsRaw.filter((rv) => {
            const key = [rv.name, rv.fromobjviewRef, rv.toobjviewRef, rv.relshipRef, rv.typeviewRef].join('::');
            if (seenRelKeys.has(key)) {
                return false;
            }
            seenRelKeys.add(key);
            return true;
        });

        // Replace candidate's arrays with the normalized ones
        candidate.objectviews = objectviews;
        candidate.relshipviews = relshipviews;

        // Guarantee required scalar fields so schema validation can succeed even if the model omits them
        const firstObjectId = objectviews[0]?.id;
        if (!candidate.id) {
            candidate.id = makeUUID();
        }
        candidate.modelRef = typeof candidate.modelRef === 'string' && candidate.modelRef
            ? candidate.modelRef
            : candidate.modelRef?.id || candidate.id;
        candidate.focusObjectviewRef = typeof candidate.focusObjectviewRef === 'string' && candidate.focusObjectviewRef
            ? candidate.focusObjectviewRef
            : (firstObjectId || candidate.focusObjectviewRef || candidate.id);
        candidate.description = candidate.description || '';

        return candidate;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // if (!input && !mvContent) return;
        if (!input) input = "Generate a modelview based on the objects and relationships.";
        const content = `${input} #Content:\n ${mvContent}`
        setMessages((prev) => [...prev, { role: "user", content }]);
        console.log("298  Submitting modelview build with input:", content);
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

    let modelviewContextItems = '';

    const handleModelviewBuilder = async () => {
        setIsLoading(true);
        setActiveTab('modelview');
        setError(null);
        setStreamedContent('');
        setIsStreaming(true);
        setCanPreview(false);
        if (!curmod || curmod?.objects.length < 1) {
            setStreamedContent("No object in current model");
            setIsLoading(false);
            setIsStreaming(false);
            setCanPreview(false);
            setTimeout(() => {
                setMessages([]);
                setCurrentMessages([]);
            }, 40000);
            return;
        }


        //         const modelviewSystemPrompt = `
        //   You are a helpful assistant and a highly knowledgeable expert in schematic and diagramming presentation and layout.
        //   You are tasked with presenting the objects and relationships generated from previous step in a modelview.

        //   The modelview will include objectviews and relshipviews for each object and relationship.
        //   Give the objectviews and relshipviews id as uuids.

        //   You will place the objectviews in the modelview using the "loc" attribute with x and y coordinates as string with format "x y".
        //   Make room between the objects to show the relationships clearly.
        //   Align the objects horizontally and vertically to make the modelview look good.
        //   Make space both horizontally (x distance more than 100) and vertically (y distance more than 20) between the objectviews to show the relationships clearly.

        //   Position all Roles in a column to the left.
        //   Next on the right put the Tasks.
        //   Next to the right of the Tasks put the Views.
        //   Finally, to the right of the Views put the Information objects.

        //   Make sure to also give horizontal and vertical space between the objects to make the modelview look good.
        //       `;
        //         const systemBehaviorGuidelines = `
        //   - Always respond with a SINGLE JSON object matching ModelviewSchema: { id, name, description, objectviews: [], relshipviews: [] }.
        //   - Do NOT wrap the result in arrays or a parent property (e.g., no "modelviews").
        //   - Ensure all objectviews and relshipviews have unique UUIDs.
        //   - Maintain clear and organized layout with appropriate spacing.
        //   - Prioritize readability and clarity in the modelview structure.
        //       `;

        let modelviewUserPrompt = '';
        if (curMetamodel?.name === "IRTV_META") {
            modelviewUserPrompt = ` 
You will create Roles, Tasks, and Views based on the current models objects and relationships.
First place the Information objects with their connected Properties near on the right side.
Next place the Views that display the Information objects nearby to the left of the connected Information objects.
Next place the Tasks that apply the Views nearbyto the left of the Views.
Finally place the Roles that perform the Tasks on the left side of the modelview.
`;
        } else if (curMetamodel?.name === "CORE_META") {
            modelviewUserPrompt = `
Your first and primary objective is to generate a modelview with all the objects and relationships from the previous step.
Next, you will create objectviews and relshipviews for each object and relationship.
You will create Metamodel objects with 'contains' relationships to the EntityTypes included in the Metamodel
The relationships between EntityTypes must be of type 'relationshipType'
`;
        } else if (curMetamodel?.name === "POPS_META") {
            modelviewUserPrompt = `
Your first and primary objective is to generate a modelview with all the objects and relationships from the previous step.
Next, you will create Processes, Organisations, Products and Services.
`;
        } else {
            modelviewUserPrompt = `
Your first and primary objective is to generate a modelview with all the objects and relationships from the previous step.
Next, you will create objectviews and relshipviews for each object and relationship.
`;
        }




        modelviewContextItems = `
## Context:
### Objects
${(curmod?.objects || []).map((obj: any) => `- ${obj.id}, ${obj.name}, ${obj.description}, ${obj.typeName}`).join('\n')}
### Relationships
${(curmod?.relships || []).map((rel: any) => `- ${rel.id}, ${rel.name}, ${rel.fromobjectRef}, ${rel.nameFrom}, ${rel.toobjectRef}, ${rel.nameTo}`).join('\n')}
`;

        const modelviewContextMetamodel = `
## Metamodel:
{
    modelviews: [
        {
            id: UUID;
            name: "Modelview name"
            description:"same as modelview description"
            objectviews: [
                {
                    id: UUID;
                    name: "same as object name"
                    description: "same as object description"
                    loc: x y coordinates
                    objectRef: Object Id
                }
            ],
            relshipviews: [
                {
                    id: UUID
                    name: "same as relationship name"
                    description: "same as relationship description"
                    relshipRef: Relationship Id
                    fromobjviewRef: Object Id
                    toobjviewRef: Object Id
                    points: array of x,y coordinates for the relshipview line
                }
            ]
        }
    ]
}
`

        let parsedSuccessfully = false;
        let accumulated = "";

        const finalSystemPrompt = `You are a senior assistant specialized in Diagramming and Modelview Layout.
Your task is to construct a modelview from the current models objectviews and relationshipviews and arrange them in a clear, non-overlapping layout.
You must follow the Developer Guidelines strictly. 
Make sure no relationshipviews are created more then once between the same two objectviews.
Dont do any routing of relationshipviews, just create straight lines between the objectviews.
`;
        // - On fatal errors, output only: { "errors": [ { "code": "...", "detail": "..." } ] }.

        const finalDeveloperPrompt = `### Developer Guidelines for Modelview Layout
- Follow the Metamodel structure exactly.
- Ensure all required fields are present and correctly formatted.
- Use consistent and valid UUIDs for all ids.
- Maintain a clean, non-overlapping layout with clear spacing.
- Prioritize readability and logical grouping of related objects.
- Validate the final output against all rules before returning.

## Metamodel (unchanged structure)
- Modelview:
  - Required: id, name, description, objectviews[], relshipviews[], layoutDiagnostics.
- Objectviews:
  - Required: id, name, description, objectRef, typeviewRef, loc (string "x y").
- Relshipviews:
  - Required: id, name, fromobjviewRef, toobjviewRef, relshipRef, typeviewRef, points (array of x,y).

## Canvas & Grid
- canvasWidth: 1800 (min), canvasHeight: 1000 (min). Use these as target; you may increase width up to 12400 if needed before scaling.
- margin: {top: 40, right: 40, bottom: 40, left: 40}
- grid: snapToGrid = true, columnWidth = 180, rowHeight = 20, gutterX = 60, gutterY = 40

## Hard Non-Overlap Rules
- No two object bounding boxes may intersect.
- Minimum gaps: horizontal >= 120, vertical >= 50 (measured between bounding boxes).
- After placing all objects, compute \`overlaps\`; it MUST be 0.

## Layout
- Use LayeredDiagraph or similar algorithm to get a nice layout.
- Objects must be placed with sufficient space to show relationships clearly.
- Start with Roles on the left, then Tasks, then Views, then Information, then Properties on the right.
- Objects with 'has' relationships should be placed next to their parent.
- Align objects to grid; all coordinates (loc and points) must be integers.
- Prioritize readability: group related objects, avoid long edges, and maintain a clean structure.
- Apply consistent spacing and alignment to enhance visual clarity.

The Objectviews and Relationshipviews shall have the same names as the the objects and relationships.
Make sure to give enough space between the objects to make the modelview look good and readable.
Make sure to align the objects horizontally and vertically to make the modelview look good.

## Ordering (Determinism)
- Primary sort: topological order from relationships (parents before children).
- Secondary sort: type (main, supporting, property).
- Tertiary sort: name (A→Z), then id (ascending).
- Use this order when filling columns/rows.

## Scaling & Pagination (Fallbacks)
- If layout exceeds canvasWidth=2400 even after optimal packing:
  1) Apply uniform \`scale\` down to 0.85 (update coordinates accordingly); set \`layoutDiagnostics.scaled=true\`.
  2) If still not feasible, split into multiple modelviews by logical clusters (e.g., per main object or subdomain); set \`layoutDiagnostics.paginated=true\`.
- Never emit overlapping coordinates.

## Validation (Must Pass)
- layoutDiagnostics.overlaps == 0
- layoutDiagnostics.minHorizontalGap >= 120
- layoutDiagnostics.minVerticalGap >= 40
- Edge routes do not intersect object boxes.
- If any check fails, re-layout (repack) or apply Fallbacks before output.

## Naming
- Modelview.name reflects the main object or cohesive group.
- Objectview.name == object.name; description mirrors object.description.
- Relationship naming mirrors the relationship's name.

## Output
- Include \`layoutDiagnostics\` with truthful metrics and notes on any scaling or pagination.
    `;

        const finalUserPrompt = `${modelviewContextMetamodel} \n ${modelviewContextItems} \n ${modelviewUserPrompt} \n ${input} `;
        const aiModelName = mapModelId(selectedModel);

        const commitModelview = (validated: any) => {
            const completeModelview = {
                ...validated,
                modelRef: validated.id,
                modified: false,
                markedAsDeleted: false,
                objectviews: validated.objectviews.map((ov: any) => ({
                    ...ov,
                    type: ov.type || "",
                    size: ov.size || "",
                    memberscale: ov.memberscale !== undefined ? ov.memberscale : 1,
                    modified: ov.modified !== undefined ? ov.modified : false,
                    markedAsDeleted: ov.markedAsDeleted !== undefined ? ov.markedAsDeleted : false,
                    isSelect: ov.isSelect !== undefined ? ov.isSelect : false,
                    isGroup: ov.isGroup !== undefined ? ov.isGroup : false,
                    isExpanded: ov.isExpanded !== undefined ? ov.isExpanded : false,
                    viewkind: ov.viewkind || "",
                    typeviewRef: ov.typeviewRef || "",
                })),
                relshipviews: validated.relshipviews.map((rv: any) => ({
                    ...rv,
                    fromName: rv.fromName || "",
                    toName: rv.toName || "",
                    typeviewRef: rv.typeviewRef || "",
                    relshipRef: rv.relshipRef || "",
                })),
            };

            setModelview(completeModelview);
            const pretty = JSON.stringify(validated, null, 2);
            const markdownResponse = formatJSONAsMarkdown(validated);

            setMvContent(pretty);
            onAddContent(pretty);
            setMessages(prev => [...prev, { role: 'assistant', content: markdownResponse }]);
            setCanPreview(true);
            setStreamedContent('Modelview ready.');
            setIsStreaming(false);
        };

        const deriveListing = (text: string): string => {
            try {
                const parsed = JSON.parse(text);
                const normalized = normalizeModelviewResponse(parsed);
                const objs = normalized.objectviews || normalized.objects || [];
                if (!Array.isArray(objs) || objs.length === 0) return "";
                return objs
                    .map((o: any) => {
                        const name = o.name || o.id || "";
                        const desc = (o.description || "").replace(/\s+/g, " ").trim();
                        const typ = o.typeName || o.type || o.proposedType || "";
                        const parts = [name];
                        if (desc) parts.push(desc);
                        if (typ) parts.push(typ);
                        return `- ${parts.join(" — ")}`;
                    })
                    .join("\n");
            } catch {
                const nameRe = /"name"\s*:\s*"([^"]+)"/g;
                const descRe = /"description"\s*:\s*"([^"]*)"/g;
                const typeRe = /"type(Name|)"\s*:\s*"([^"]*)"/g;

                const names = Array.from(text.matchAll(nameRe), (m) => m[1]);
                const descs = Array.from(text.matchAll(descRe), (m) => m[1]);
                const types = Array.from(text.matchAll(typeRe), (m) => m[2]);

                const max = Math.max(names.length, descs.length, types.length);
                if (max === 0) return "";

                const lines: string[] = [];
                for (let i = 0; i < max; i++) {
                    const n = names[i] || `obj${i + 1}`;
                    const d = descs[i] || "";
                    const t = types[i] || "";
                    const parts = [n];
                    if (d) parts.push(d.replace(/\s+/g, " ").trim());
                    if (t) parts.push(t);
                    lines.push(`- ${parts.join(" — ")}`);
                }
                return lines.join("\n");
            }
        };

        if (!debug) console.log('615 Prompts: ', selectedModel, '\n\n',
            'finalSystemPrompt:', finalSystemPrompt, '\n\n',
            'finalDeveloperPrompt:', finalDeveloperPrompt, '\n\n',
            'finalUserPrompt:', finalUserPrompt,
            '\nmodelId:', aiModelName);

        try {
            // Set an initial friendly streaming message (do not show raw JSON)
            setStreamedContent("Generating modelview…");

            const finalText = await streamGenmodel(
                {
                    aiModelName,
                    schemaName: "ModelviewSchema",
                    systemPrompt: finalSystemPrompt || "",
                    developerPrompt: finalDeveloperPrompt || "",
                    userPrompt: finalUserPrompt || "",
                },
                (chunk) => {
                    if (parsedSuccessfully) {
                        accumulated += chunk;
                        return;
                    }

                    accumulated += chunk;

                    const listing = deriveListing(accumulated);
                    if (listing && listing.trim().length > 0) {
                        setStreamedContent(listing);
                    }

                    setMvPreview(accumulated);

                    try {
                        const maybe = JSON.parse(accumulated);
                        const normalized = normalizeModelviewResponse(maybe);
                        const validated = ModelviewSchema.parse(normalized);
                        commitModelview(validated);
                        parsedSuccessfully = true;
                    } catch {
                        // ignore JSON parse errors while streaming (partial data)
                    }
                }
            );

            accumulated = finalText || accumulated;

            if (!parsedSuccessfully) {
                try {
                    const parsed = JSON.parse(accumulated);
                    const normalized = normalizeModelviewResponse(parsed);
                    const validated = ModelviewSchema.parse(normalized);
                    commitModelview(validated);
                    parsedSuccessfully = true;
                } catch (err: any) {
                    console.error("Modelview final parse failed:", err);
                    setError(err?.message ?? String(err));
                }
            }

            setMvPreview(accumulated);
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
                </div>
            </div>

            {/* Input Area */}
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
