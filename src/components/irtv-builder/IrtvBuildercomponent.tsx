"use client"
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
// import { Message } from '@/types/Message';
import { convertDocxToMarkdown } from '@/utils/DOCX-to-Markdown';
import TextareaAutosize from 'react-textarea-autosize';


import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { LoadingCircularProgress } from '@/components/loading';
import DigitalRainIntro from '@/components/ai-chat/DigitalRainIntro';
import ReactMarkdown from 'react-markdown';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import GettingStartedGuide from '@/components/irtv-builder/GettingStartedGuide';
import { PROMPT_TEMPLATES, PromptTemplate } from '@/components/irtv-builder/promptTemplates';
import { REFINE_TEMPLATES } from '@/components/ai-chat/refineTemplates';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

import { ObjectSchema } from "@/objectSchema";
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, Metis, Model } from '@/features/model-universe/modelSlice';

import { SystemPrompt, SystemBehaviorGuidelines, ExistingOntology, UserPrompt, UserInput, ExistingContext, MetamodelPrompt } from '@/app/model-builder/prompts';


const debug = false; // Set to true for debugging   

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
// IRTV Builder specific props interface
interface IRTVBuilderComponentProps {
    input: string;
    setInput: (input: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    onResponseChange: (response: string) => void;
    onViewInPreview: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    onAddContent: (content: string) => void;
    irtvContent: string;
    setIrtvContent: (content: string) => void;
    irtvPreview: string;
    setIrtvPreview: (preview: string) => void;
    setCurrentMessages: (messages: any[]) => void;
}

const MAX_MODEL_RETRIES = 4;

// IRTV-specific prompts (you'll need to create these)
const IRTVSystemPrompt = `You are an expert IRTV (Information Requirements for Testing and Verification) analyst. 
Your task is to analyze requirements and generate comprehensive IRTV documentation that identifies all information needs for testing and verification activities.

Focus on:
- Information Requirements identification
- Test data specifications
- Verification criteria
- Traceability requirements
- Documentation standards`;

const IRTVUserPrompt = `Generate IRTV documentation for the given requirements. Include:
1. Information Requirements Matrix
2. Test Data Requirements
3. Verification Information Needs
4. Traceability Information
5. Documentation Requirements`;

const IRTVBuilderComponent: React.FC<IRTVBuilderComponentProps> = ({
    input,
    setInput,
    selectedModel,
    setSelectedModel,
    onResponseChange,
    onViewInPreview,
    setShowLeftPanel,
    onAddContent,
    irtvContent,
    setIrtvContent,
    irtvPreview,
    setIrtvPreview,
    setCurrentMessages
}) => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();

    // const [metis, setMetis] = useState<Metis | null >(null);
    const [model, setModel] = useState<{ id?: string; name?: string; description?: string; objects?: any[]; relships?: any[] } | null>(null);
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    // const [temperature, setTemperature] = useState<number>(0.7); // Default value 0.7

    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    // IRTV Builder state
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('current-analysis');
    const [activeSubTab, setActiveSubTab] = useState('requirements-summary');
    const [dispatchDone, setDispatchDone] = useState(false);
    const mdFileInputRef = useRef<HTMLInputElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const [showGuideModal, setShowGuideModal] = useState(false);
    // IRTV specific state
    const [irtvAnalysis, setIrtvAnalysis] = useState<any>(null);
    const [requirements, setRequirements] = useState<string>('');
    const [testScenarios, setTestScenarios] = useState<any[]>([]);
    const [verificationCriteria, setVerificationCriteria] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<string>('Business');
    // Prompt state
    const [userPrompt, setUserPrompt] = useState(IRTVUserPrompt);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [systemPrompt, setSystemPrompt] = useState<string>(`You are a helpful AI assistant that provides clear, concise, and accurate responses.
    You are provided with following documents for reference. When answering the user's questions, ALWAYS analyze and refer to the content of these documents.
        `);
    const [systemBehaviorGuidelines, setSystemBehaviorGuidelines] = useState("");
    const [userInput, setUserInput] = useState("");
    const [contextItems, setContextItems] = useState("");
    const [contextOntology, setContextOntology] = useState("");
    const [contextMetamodel, setContextMetamodel] = useState("");


    // Add streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [contextContent, setContextContent] = useState<string>('');
    const [isContextAttached, setIsContextAttached] = useState(false);
    const isInitialRender = useRef(true);
    const previousModelRef = useRef<string>(selectedModel);
    const retryInProgress = useRef(false);
    const [selectedReportTemplate, setSelectedReportTemplate] = useState<string>('');
    const [existingInfoObjects, setExistingInfoObjects] = useState<{ objects: { id: any; name: any; description: any; typeName: any; }[], relships: { id: any; name: any; nameFrom: any; nameTo: any; }[] }>({ objects: [], relships: [] });


    // Add temperature state
    const [temperature, setTemperature] = useState<number>(0.7);
    const [docRefine, setDocRefine] = useState(false);
    const [selectedRefineTemplate, setSelectedRefineTemplate] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [previewMessageIndex, setPreviewMessageIndex] = useState<number | null>(null);
    const [streamedContent, setStreamedContent] = useState<string>('');
    // const [isStreaming, setIsStreaming] = useState<boolean>(false);

    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
    const [mdPreview, setMdPreview] = useState('');




    // Generate categories list dynamically from templates
    const CATEGORIES = [...Array.from(
        new Set(PROMPT_TEMPLATES.map(template => template.usage))
    ).sort(), "All"];

    const filteredTemplates = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.usage === selectedCategory);
    // Define templates for document refinement
    const refineTemplates = REFINE_TEMPLATES;

    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    // open md picker
    const handleAddMD = () => {
        mdFileInputRef.current?.click();
        // setDocRefine(true);
    };

    useEffect(() => {
        if (data) {
            const metis = data.phData?.metis;
            if (!metis) {
                console.error('Data does not contain metis:', data);
                return;
            }

            if (metis?.metamodels) {
                const metamodel = metis.metamodels.find((mmodel: { id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] }) => mmodel.name.includes('IRTV'));
                if (metamodel) {
                    setCurMetamodel(metamodel);
                }
            }
        } else {
            console.error('Data is null or undefined:', data);
        }
    }, [data]); // Only depend on data

    // Separate useEffect for when curMetamodel changes
    useEffect(() => {
        if (!curMetamodel || !data?.phData?.metis) return;

        const filteredObjTypes = curMetamodel.objecttypes.filter((objtype: any) =>
            objtype.typeName !== 'Element' &&
            objtype.typeName !== 'EntityType' &&
            objtype.typeName !== 'Generic' &&
            objtype.typeName !== 'Label'
        );

        const filteredRelTypes = curMetamodel.relshiptypes.filter((reltype: any) =>
            reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Element') &&
            reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'EntityType') &&
            reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Generic') &&
            reltype.fromobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Label') &&
            reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Element') &&
            reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'EntityType') &&
            reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Generic') &&
            reltype.toobjtypeRef !== filteredObjTypes?.find(ot => ot.name === 'Label')
        );

        const metatypesString = `**${curMetamodel.name}**\n
                ${filteredObjTypes?.map(objtype => `id: ${objtype.id}, name: ${objtype.name}, typeviewRef: ${objtype.typeviewRef}`).join('\n')}\n\n
                ${filteredRelTypes?.map(reltype => `id: ${reltype.id},name: ${reltype.name}, from: ${reltype.fromobjtypeRef}, to: ${reltype.toobjtypeRef}`).join('\n')}\n\n
                ${curMetamodel.objecttypeviews.map(objtypeview => `${objtypeview.id}, ${objtypeview.name}`).join('\n')}
            `;

        const contextmetatypesString = `## **Metamodel**\n\n ${metatypesString}`;

        if (!debug) console.log('122 metatypesString:', curMetamodel);

        const models = data.phData.metis.models;
        const irtvmod = models?.find(model => model.metamodelRef === curMetamodel.id);
        if (irtvmod && (!curmod || curmod.id !== irtvmod.id)) { // Only update if different
            setCurmod(irtvmod);
            dispatch(setFocusModel({ id: irtvmod.id, name: irtvmod.name }));
        }

        // Set prompts only once when metamodel is set
        setSystemPrompt(SystemPrompt);
        setSystemBehaviorGuidelines(SystemBehaviorGuidelines);
        setContextOntology(ExistingOntology);
        setUserPrompt(UserPrompt);
        setUserInput(UserInput);
        setContextMetamodel(`\n`);
        // setContextMetamodel(`${MetamodelPrompt} \n\n ${contextmetatypesString}`);
        if (debug) console.log('159 Context Items:', contextmetatypesString);

    }, [curMetamodel, data?.phData?.metis, dispatch]); // Don't include curmod in dependencies

    // Separate useEffect for when curmod changes
    useEffect(() => {
        if (!curmod || !data?.phData?.ontology) return;

        const filteredRelationships = curmod.relships?.filter(rel => {
            const fromObject = curmod.objects?.find(obj => obj.id === rel.fromobjectRef);
            const toObject = curmod.objects?.find(obj => obj.id === rel.toobjectRef);
            return fromObject?.typeName === 'Information' && toObject?.typeName === 'Information' && rel;
        }) || [];

        const existingObjects = curmod.objects?.map(obj => ({ id: obj.id, name: obj.name, description: obj.description, typeName: obj.typeName })) || [];
        const existingRelationships = filteredRelationships?.map(rel => ({ id: rel.id, name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo })) || [];

        const newExistingInfoObjects = {
            objects: existingObjects?.filter(obj => obj && obj.typeName === 'Information') || [],
            relships: existingRelationships.filter(rel =>
                existingObjects.some(obj => obj.id === rel.nameFrom || obj.id === rel.nameTo)
            ) || []
        };

        setExistingInfoObjects(newExistingInfoObjects);

        const existInfoConcepts = {
            concepts: newExistingInfoObjects.objects.map((obj: any) => ({ name: obj.name, description: obj.description })),
            relships: newExistingInfoObjects.relships.map((rel: any) => ({ name: rel.name, description: rel.nameFrom + ' ' + rel.nameTo }))
        };

        let conceptString = `**Objects**\n\n ${data.phData.ontology?.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
        if (existInfoConcepts.concepts.length > 0) {
            conceptString += `**Objects**\n\n${existInfoConcepts.concepts.map((c: any) => `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            conceptString += `**Relationships**\n\n${existInfoConcepts.relships.map((r: any) => `- ${r.name} - ${r.description} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
        }

        setContextItems((conceptString !== '') ? `${ExistingContext} \n\n ${conceptString}` : "");

    }, [curmod?.id, data?.phData?.ontology?.concepts]); // Use curmod.id instead of full curmod object

    // Load saved temperature preference
    useEffect(() => {
        const savedTemp = localStorage.getItem('aiDashboard_temperature');
        if (savedTemp) {
            setTemperature(parseFloat(savedTemp));
        }
    }, []);

    // Add useEffect to monitor content changes
    useEffect(() => {
        console.log('IRTV Content changed:', {
            length: irtvContent?.length || 0,
            preview: irtvContent?.substring(0, 100) || 'empty'
        });
    }, [irtvContent]);


    // Function to detect placeholders in the format [placeholder]
    useEffect(() => {
        if (!input) {
            setTemplatePlaceholders([]);
            return;
        }

        const placeholderRegex = /\[([^\[\]]+)\]/g;
        const placeholders: { text: string, start: number, end: number }[] = [];
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


    // Function to select and jump to a placeholder
    const selectTemplatePlaceholder = (idx: number) => {
        if (!textareaRef.current) return;

        const placeholder = templatePlaceholders[idx];
        if (!placeholder) return;

        // Focus the textarea
        textareaRef.current.focus();

        // Set selection range to highlight the placeholder
        textareaRef.current.setSelectionRange(
            placeholder.start,
            placeholder.end
        );

        // Scroll the placeholder into view if needed
        const textarea = textareaRef.current;

        // Get character position information
        const charInfo = getCaretCoordinates(textarea, placeholder.start);

        // Calculate scroll position
        if (charInfo) {
            const scrollTop = textarea.scrollTop;
            const offsetTop = charInfo.top;
            const textareaHeight = textarea.clientHeight;

            // Adjust scroll if needed to ensure the placeholder is visible
            if (offsetTop < scrollTop || offsetTop > scrollTop + textareaHeight - 30) {
                textarea.scrollTop = Math.max(0, offsetTop - textareaHeight / 2);
            }
        }
    };

    // Helper function to get caret coordinates in a textarea
    function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
        // Create a dummy element to measure text dimensions
        const div = document.createElement('div');
        // Copy styles that affect dimensions
        const styles = window.getComputedStyle(element);
        const props = [
            'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
            'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
            'width', 'lineHeight', 'textAlign', 'wordSpacing', 'whiteSpace'
        ];

        props.forEach(prop => {
            const value = styles[prop as keyof typeof styles];
            div.style[prop as any] = value !== null ? value.toString() : '';
        });

        // Set content up to the caret position
        div.textContent = element.value.substring(0, position);

        // Create a span where the caret would be
        const span = document.createElement('span');
        span.textContent = element.value.charAt(position) || '.';
        div.appendChild(span);

        // Position absolutely out of view
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);

        // Measure position
        const rect = span.getBoundingClientRect();
        const result = {
            top: rect.top - div.getBoundingClientRect().top,
            left: rect.left - div.getBoundingClientRect().left,
            height: rect.height
        };

        document.body.removeChild(div);
        return result;
    }


    // load .md file into input
    const handleMDFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatusMsg(`Processing ${file.name}...`);

            // Process based on file type
            const fileType = file.name.split('.').pop()?.toLowerCase();
            let content = '';

            if (fileType === 'docx') {
                content = await convertDocxToMarkdown(file, { skipImages: true });
                setStatusMsg(`Converted ${file.name} to Markdown. Images skipped.`);
            } else {
                // Handle markdown and other text files
                content = await file.text();
            }

            // setInput(refinePrompt);

            setStatusMsg(`Loaded file"${file.name}".`);
            setIrtvContent(content); // This will be shown in the preview
        } catch (err) {
            console.error(err);
            setStatusMsg(`Failed to load ${file.name}`);
        }

        e.target.value = '';
    };

    // Temperature Selector component
    const TemperatureSelector = () => {
        return (
            <div className="flex flex-row items-center justify-center text-xs text-gray-400 px-2 ">
                <label className="block text-sm font-medium mr-2">
                    Temp:
                </label>
                <div className="flex items-center gap-2">
                    <select
                        value={temperature}
                        onChange={(e) => {
                            const newTemp = parseFloat(e.target.value);
                            setTemperature(newTemp);
                            localStorage.setItem('aiDashboard_temperature', newTemp.toString());
                        }}
                        className="bg-gray-800 border border-gray-600 rounded text-sm py-1 px-2"
                        title="Temperature controls randomness. Lower values are more deterministic, higher values more creative."
                    >
                        <option value="0.0">0.0 (Deterministic)</option>
                        <option value="0.3">0.3 (Focused)</option>
                        <option value="0.5">0.5 (Balanced)</option>
                        <option value="0.7">0.7 (Creative)</option>
                        <option value="1.0">1.0 (Very Creative)</option>
                        <option value="1.2">1.2 (Highly Creative)</option>
                    </select>
                </div>
            </div>
        );
    };

    // Add dummy IRTV response for testing
    const getDummyIRTVResponse = (requirements: string) => {
        return `# IRTV Analysis Report

## Information Requirements Matrix

Based on the provided requirements:
${requirements}

### 1. Information Requirements Identification

| Requirement ID | Information Need | Data Source | Verification Method |
|---|---|---|---|
| REQ-001 | User authentication data | User database | Login test scenarios |
| REQ-002 | Payment processing data | Payment gateway | Transaction logs |
| REQ-003 | Report generation data | System database | Output verification |
| REQ-004 | Session management data | Session store | Timeout testing |
| REQ-005 | Audit trail data | Logging system | Audit log review |

## Summary

This IRTV analysis provides a comprehensive framework for testing and verification activities. All information requirements have been identified and mapped to appropriate verification methods.

*Generated by Dummy Model for testing purposes*`;
    };

    // Add streaming simulation for dummy model
    const simulateStreamingResponse = async (
        response: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void
    ) => {
        const words = response.split(' ');
        const chunkSize = 3; // Words per chunk

        for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
            onChunk(chunk);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        onComplete();
    };

    // Add this function if it doesn't exist
    const onViewInMarkdown = (content: string) => {
        setIrtvPreview(content);
        onViewInPreview(content);
    };

    // Add this function to handle copying messages
    const handleCopyMessage = async (content: string, index: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Add this function for handling retry
    const handleRetry = () => {
        // Implement retry logic here
        setStatusMsg('');
        // You might want to re-run the last operation
    };

    // Save IRTV to content
    const handleSaveIRTV = () => {
        if (!irtvAnalysis) {
            alert('No IRTV analysis to save');
            return;
        }

        const updatedContent = irtvContent ? `${irtvContent}\n\n---\n\n${irtvAnalysis}` : irtvAnalysis;
        setIrtvContent(updatedContent);
        onAddContent(updatedContent);
        setDispatchDone(true);
    };

    // Add this function for the thinking animation
    const ThinkingAnimation = () => {
        return (
            <div className="flex items-center gap-1 text-blue-400 font-mono p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 max-w-[200px]">
                <span className="ml-2">Thinking</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
        );
    };

    // Handle save to library
    const handleSaveToLibrary = (content: string) => {
        if (!content || content.trim() === '') {
            alert('No content to save to library');
            return;
        }

        // Dispatch action to save to library
        dispatch({
            type: 'ADD_TO_LIBRARY',
            payload: {
                content,
                model: selectedModel,
                category: selectedCategory
            }
        });

        setStatusMsg('Content saved to library successfully!');
    };
    // Handle save to file
    const handleSaveToFile = (content: string) => {
        if (!content || content.trim() === '') {
            alert('No content to save to file');
            return;
        }

        // Create a blob and download it
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `irtv_analysis_${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatusMsg('Content saved to file successfully!');
    };

    const handleModelBuilder = async () => {
        setIsLoading(true);
        setStep(1);
        setActiveTab('model');

        try {
            const res = await fetch("/api/genmodel", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiModelName: selectedModel || "gpt-4o-2024-08-06",
                    schemaName: 'ObjectSchema',
                    systemPrompt: systemPrompt || "",
                    systemBehaviorGuidelines: systemBehaviorGuidelines || "",
                    userPrompt: userPrompt || "",
                    userInput: userInput || "",
                    contextItems: contextItems || "",
                    contextOntology: contextOntology || "",
                    contextMetamodel: contextMetamodel || ""
                })
            });

            // Add detailed error logging
            if (!res.ok) {
                const errorText = await res.text();
                console.error('API Error Details:', {
                    status: res.status,
                    statusText: res.statusText,
                    errorText: errorText
                });
                throw new Error(`API Error ${res.status}: ${errorText}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let data = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                data += decoder.decode(value, { stream: true });
            }

            console.log('Raw response data:', data);

            if (!data || data.trim() === '') {
                throw new Error('Empty response from API');
            }

            let parsed;
            try {
                parsed = JSON.parse(data);
                console.log('Parsed Response:', parsed);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', data);

                // Create a fallback response with the raw text
                const fallbackResponse = {
                    name: "Text Response Model",
                    description: `Raw response from AI: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`,
                    objects: [],
                    relships: []
                };

                parsed = fallbackResponse;
                console.log('Using fallback response:', parsed);
            }

            let validatedData;
            try {
                validatedData = ObjectSchema.parse(parsed);
                console.log('Validated Data:', validatedData);
            } catch (validationError) {
                console.error('Schema validation failed:', validationError);

                // Create a minimal valid response
                validatedData = {
                    name: parsed.name || "Generated Model",
                    description: parsed.description || "AI-generated model",
                    objects: [],
                    relships: []
                };
                console.log('Using minimal valid response:', validatedData);
            }

            // Convert to markdown format
            const markdownResponse = formatJSONAsMarkdown(validatedData);

            // Add assistant message with markdown formatted response
            const assistantMessage: Message = {
                role: 'assistant',
                content: markdownResponse
            };

            setMessages(prev => [...prev, assistantMessage]);
            setModel({ ...validatedData, id: curmod?.id });
            setStep(3);

        } catch (e) {
            console.error("Model Builder Error:", e instanceof Error ? e.message : e);
            setStatusMsg(`Model building failed: ${e instanceof Error ? e.message : 'Unknown error'}`);

            // Add a user-friendly message to the chat
            const errorMessage: Message = {
                role: 'assistant',
                content: `I encountered an error while processing your request:\n\n**Error:** ${e instanceof Error ? e.message : 'Unknown error'}\n\n**Suggestions:**\n- Try using a different AI model\n- Simplify your request\n- Check your internet connection\n- Try again in a few moments`
            };

            setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
        setStep(3);
    };

    // Add this helper function to format JSON as markdown
    const formatJSONAsMarkdown = (data: any): string => {
        let markdown = `# ${data.name || 'Generated Model'}\n\n`;

        if (data.description) {
            markdown += `**Description:** ${data.description}\n\n`;
        }

        // Format objects
        if (data.objects && data.objects.length > 0) {
            markdown += `## Objects\n\n`;
            data.objects.forEach((obj: any, index: number) => {
                markdown += `### ${index + 1}. ${obj.name}\n\n`;
                markdown += `- **ID:** ${obj.id}\n`;
                markdown += `- **Description:** ${obj.description}\n`;
                markdown += `- **Type Reference:** ${obj.typeRef}\n`;
                markdown += `- **Type Name:** ${obj.typeName}\n`;
                markdown += `- **Proposed Type:** ${obj.proposedType}\n`;

                if (obj.properties && obj.properties.length > 0) {
                    markdown += `- **Properties:**\n`;
                    obj.properties.forEach((prop: any) => {
                        markdown += `  - **${prop.name}** (${prop.type}): ${prop.description}\n`;
                    });
                }
                markdown += `\n`;
            });
        }

        // Format relationships
        if (data.relships && data.relships.length > 0) {
            markdown += `## Relationships\n\n`;
            data.relships.forEach((rel: any, index: number) => {
                markdown += `### ${index + 1}. ${rel.name}\n\n`;
                markdown += `- **ID:** ${rel.id}\n`;
                markdown += `- **Description:** ${rel.description}\n`;
                markdown += `- **From:** ${rel.from}\n`;
                markdown += `- **To:** ${rel.to}\n`;
                markdown += `- **Type:** ${rel.type}\n\n`;
            });
        }

        return markdown;
    };

    // handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        let userMessageContent = input;

        if (docRefine) {
            userMessageContent = `${userMessageContent} #Content:\n ${irtvContent}`;
        } else {
            userMessageContent = `${userMessageContent} #Context:\n ${irtvContent}`;
        }

        const userMessage: Message = { role: 'user', content: userMessageContent };

        // Add the user message to conversation history without truncating it
        setMessages((prev) => [...prev, userMessage]);
        // Send all messages including the new one to maintain conversation context
        await handleModelBuilder([...messages, userMessage]);

        setInput(''); // Clear the input field after submission
        onResponseChange(''); // Clear parent state if needed
        setShowDigitalRain(false); // Turn OFF digital rain when sending a message
    };

    // Simple Modal component
    const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
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
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    // Handle system prompt click
    // Function to open system prompt modal
    const handleSystemPromptClick = () => {
        setIsSystemPromptOpen(true);
    };
    // Alternative: Use useMemo for the prompts div to avoid useEffect issues
    const printPromptsDiv = useMemo(() => (
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
                <h3 className="text-lg font-bold text-blue-400 mb-2">Document Content (Primary Input)</h3>
                <div className="bg-gray-800 p-3 rounded">
                    <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                        {irtvContent || 'No document content available'}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    ), [irtvContent, systemPrompt, userPrompt]);

    return (
        <>
            <div className="flex flex-col min-h-0 h-[96%] rounded-lg sm:h-[99%] sm:min-w-[460px] overflow-hidden relative">
                {/* Message container with scrollable area */}
                <div className="flex-1 min-h-0 overflow-y-auto pb-[150px] w-full" id="message-container">
                    {/* style={{ height: `${ topHeight } px` }}> this is for draggable bar*/}
                    {messages.length < 1 && (!input || input.trim() === "") ? (
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
                    ) : null}

                    <div className="flex flex-col p-4 rounded-lg w-full bg-transparent overflow-auto">
                        {messages.map((message, index) => (
                            <div key={index}
                                className={`mb-4 p-3 rounded-lg flex flex-col gap-2 ${message.role === 'user'
                                    ? 'bg-card ml-auto max-w-[80%] text-card-foreground flex-col border border-blue-900'
                                    : 'bg-secondary mr-auto w-full text-card-foreground flex-col border-4 border-secondary'
                                    } `}
                            >
                                {/* header with avatar/role */}
                                <div className="flex items-center justify-between gap-3 ps-1">
                                    <div className="flex-shrink-0">
                                        {message.role === 'user' ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-6 h-6 text-blue-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M5.121 17.804A4 4 0 0112 15a4 4 0 016.879 2.804M12 11a4 4 0 100-8 4 4 0 000 8z"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-6 h-6 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 2a7 7 0 00-7 7v6a7 7 0 007 7 7 7 0 007-7V9a7 7 0 00-7-7zm0 2a5 5 0 015 5v6a5 5 0 01-5 5 5 5 0 01-5-5V9a5 5 0 015-5zm-2 7h4m-2-2v4"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 me-auto overflow-auto">
                                        {message.role === 'user' ? 'You' : `Assistant (${selectedModel})`}
                                    </div>

                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mt-2 ml-auto rounded-md p-2">
                                            {message.role === 'assistant' && (
                                                <>
                                                    {/* Add Save to Library button */}
                                                    <button
                                                        title="Save to Library"
                                                        onClick={() => handleSaveToLibrary(message.content)}
                                                        className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                                                    >

                                                        <BookmarkPlus className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        title="Save to File"
                                                        onClick={() => handleSaveToFile(message.content)}
                                                        className={`text-xs ms-2 ${statusMsg === '' ? 'text-yellow-500 hover:text-yellow-300' : 'text-gray-400'} flex items-center gap-1`}
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyMessage(message.content, index)}
                                                        className="ms-2 text-xs text-gray-400 hover:text-gray-200"
                                                    >
                                                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            console.log('Previewing message in markdown:', message.content);
                                                            onViewInMarkdown(message.content);
                                                            // Toggle preview state locally
                                                            if (previewMessageIndex === index) {
                                                                setPreviewMessageIndex(null);
                                                            } else {
                                                                setPreviewMessageIndex(index);
                                                            }
                                                        }}
                                                        className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                                    >
                                                        {previewMessageIndex === index ? "Show Plain Text" : "Markdown Preview"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* message content */}
                                <div
                                    className={`flex w-full p-4 ${message.role === 'assistant' ? 'bg-primary-foreground' : ''} whitespace-pre-wrap break-words break-all overflow-auto`}
                                    style={{ overflowWrap: 'anywhere' }}
                                >
                                    {previewMessageIndex === index ? (
                                        <div className="prose prose-invert custom-markdown markdown-preview w-full">
                                            <MarkdownPreview mdPreview={mdPreview} />
                                        </div>
                                    ) : (
                                        message.content
                                    )}
                                </div>

                                {/*  bottom buttons */}
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mt-2 ml-auto rounded-md p-2">
                                        {message.role === 'assistant' && (
                                            <>
                                                {/* Add Save to Library button */}

                                                <button
                                                    title="Save to Library"
                                                    onClick={() => handleSaveToLibrary(message.content)}
                                                    className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                                                >

                                                    <BookmarkPlus className="h-4 w-4" />
                                                </button>

                                                <button
                                                    title="Save to File"
                                                    onClick={() => handleSaveToFile(message.content)}
                                                    className={`text-xs ms-2 ${statusMsg === '' ? 'text-yellow-500 hover:text-yellow-300' : 'text-gray-400'} flex items-center gap-1`}
                                                >
                                                    <Save className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCopyMessage(message.content, index)}
                                                    className="ms-2 text-xs text-gray-400 hover:text-gray-200"
                                                >
                                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        console.log('Previewing message in markdown:', message.content);
                                                        onViewInMarkdown(message.content);
                                                        // Toggle preview state locally
                                                        if (previewMessageIndex === index) {
                                                            setPreviewMessageIndex(null);
                                                        } else {
                                                            setPreviewMessageIndex(index);
                                                        }
                                                    }}
                                                    className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                                >
                                                    {previewMessageIndex === index ? "Show Plain Text" : "Markdown Preview"}
                                                </button>


                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Display the currently streaming message */}
                        {isStreaming && irtvAnalysis && (
                            <div className="mb-4 p-3 rounded-lg flex flex-col gap-2 bg-secondary mr-auto w-full text-card-foreground flex-col border-4 border-secondary">
                                <div className="flex items-center justify-between gap-3 ps-1">
                                    <div className="flex-shrink-0">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-6 h-6 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 2a7 7 0 00-7 7v6a7 7 0 007 7 7 7 0 007-7V9a7 7 0 00-7-7zm0 2a5 5 0 015 5v6a5 5 0 01-5 5 5 5 0 01-5-5V9a5 5 0 015-5zm-2 7h4m-2-2v4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="text-xs text-gray-400 me-auto overflow-auto">
                                        {`Assistant (${selectedModel}) - Accumulating response...`}
                                    </div>
                                </div>

                                <div
                                    className="flex w-full p-1 px-4 whitespace-pre-wrap break-words break-all overflow-auto"
                                    style={{ overflowWrap: 'anywhere' }}
                                >
                                    {streamedContent}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex justify-start my-4">
                                <ThinkingAnimation />
                                <div className="h-6" />
                            </div>
                        )}
                        {/* This is the end of the messages */}
                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
                {/* <SimpleDivider
                currentSize={topHeight}
                onResize={(newHeight) => setTopHeight(Math.max(40, newHeight))}
                /> */}
                {/* Add  message display near the top */}
                {
                    statusMsg && (
                        <div className="flex items-center bg-blue-400/20 border-blue-700 text-blue-500 px-4 py-2 mb-2 rounded-md text-sm">
                            <Info className="w-4 h-4 mr-2" />
                            <span>{statusMsg}</span>
                            {(statusMsg.includes('timed out') || statusMsg.includes('Failed to communicate') || statusMsg.includes('An error occurred')) && (
                                <button
                                    onClick={handleRetry}
                                    className="ml-auto px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                    disabled={isLoading || retryInProgress.current}
                                >
                                    {isLoading ? 'Retrying...' : 'Retry Request'}
                                </button>
                            )}
                        </div>
                    )
                }
                {/* Input area always at the bottom */}
                <div className="relative bottom-0 left-0 right-0 bg-popover pb-safe mt-1 rounded-lg">
                    <div className="flex items-center justify-between p-2">
                        {/* button row above the chat */}
                        <div className="flex items-center gap-2">
                            {/* System Prompt Button */}
                            <div
                                className="flex items-center gap-2 px-3 cursor-pointer hover:bg-gray-700 rounded"
                                onClick={handleSystemPromptClick}
                                title="Click to view system prompt"
                            >
                                <span className="flex items-center gap-1 text-gray-400 text-xs">
                                    <span role="img" aria-label="robot" className="w-4 h-4">🤖</span>
                                    {/* System Prompt */}
                                    {/* <Info className="h-3 w-3 ml-1" /> */}
                                </span>
                            </div>
                            {/* Context file input */}

                            <button
                                type="button"
                                onClick={handleAddMD}
                                className={`p-2 flex items-center gap-2 hover:text-gray-300 ${irtvContent ? 'text-green-500' : 'text-gray-500'}`}
                                disabled={isLoading}
                                title="Add a local file to be refined."
                            >
                                <FileText className="w-5 h-5" /> {statusMsg.includes('Loaded') ? (irtvContent ? 'File Loaded' : 'Load a file') : 'Load a file'}
                            </button>
                            <input
                                ref={mdFileInputRef}
                                type="file"
                                accept=".md, .txt, .markdown, .docx"
                                style={{ display: 'none' }}
                                className="hidden"
                                onChange={handleMDFileSelect}
                            />
                            {irtvContent && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={docRefine && !irtvContent}
                                        disabled={!irtvContent || isLoading}
                                        onChange={() => {
                                            if (!irtvContent) {
                                                setDocRefine(true);
                                                setInput('');
                                            } else {
                                                const newRefineState = !docRefine;
                                                setDocRefine(newRefineState);
                                                // setInput(newRefineState ? refinePrompt : '');
                                            }
                                        }}
                                        className="sr-only" // Hide default checkbox but keep it accessible
                                    />
                                    <div className={`h-5 w-5 border ${docRefine && irtvContent ? 'bg-blue-500 border-blue-600' : 'border-gray-600'} rounded flex items-center justify-center`}>
                                        {docRefine && irtvContent && (
                                            <div className="h-2 w-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-gray-500">{irtvContent ? "Refine text" : "No document in the left panel"}</span>
                                </label>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Template selection */}
                            {irtvContent && docRefine &&
                                <div className="flex items-center gap-2">
                                    <select
                                        title="Select a style for the document"
                                        className="bg-popover text-sm border border-gray-600 rounded px-2 py-1"
                                        onChange={(e) => {
                                            const selectedTemplate = refineTemplates[e.target.value as keyof typeof refineTemplates];
                                            if (selectedTemplate) {
                                                setInput(selectedTemplate);
                                                // setDocRefine(true);
                                            }
                                        }}
                                        disabled={isLoading || !irtvContent}
                                    >
                                        <option value="">Select style...</option>
                                        {Object.keys(refineTemplates).map((key) => (
                                            <option key={key} value={key}>{key}</option>
                                        ))}
                                    </select>
                                </div>
                            }
                            <div className="flex items-center gap-2">
                                {!docRefine &&
                                    <div className="relative">
                                        <button
                                            className="bg-popover text-xs border border-gray-600 rounded px-2 py-1 w-96 flex items-center gap-1 hover:bg-gray-700"
                                            onClick={() => {
                                                const dropdown = document.getElementById('template-dropdown');
                                                if (dropdown) {
                                                    // Check position relative to viewport
                                                    const button = document.activeElement as HTMLElement;
                                                    const buttonRect = button.getBoundingClientRect();
                                                    const viewportHeight = window.innerHeight;
                                                    const spaceBelow = viewportHeight - buttonRect.bottom;
                                                    const spaceAbove = buttonRect.top;

                                                    // First toggle visibility
                                                    dropdown.classList.toggle('hidden');

                                                    // If there's not enough space below, position above
                                                    if (spaceBelow < 300 && spaceAbove > 150) {
                                                        // Position above with margin to prevent cutoff
                                                        dropdown.style.bottom = 'calc(100% + 5px)';  // Add 5px gap
                                                        dropdown.style.top = 'auto';
                                                        dropdown.style.maxHeight = `${spaceAbove - 20}px`;  // Leave more space
                                                    } else {
                                                        // Otherwise position below with margin
                                                        dropdown.style.top = 'calc(100% + 5px)';  // Add 5px gap
                                                        dropdown.style.bottom = 'auto';
                                                        dropdown.style.maxHeight = `${Math.max(150, spaceBelow - 20)}px`;
                                                    }

                                                    // Ensure the dropdown is fully visible within viewport
                                                    setTimeout(() => {
                                                        const dropdownRect = dropdown.getBoundingClientRect();
                                                        if (dropdownRect.top < 0) {
                                                            // If still cut off at top, adjust position
                                                            dropdown.style.top = '5px';
                                                            dropdown.style.bottom = 'auto';
                                                        }
                                                    }, 0);
                                                }
                                            }}
                                            title="Select a template"
                                        >
                                            <span>Prompt Templates (Personal/Business)</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div
                                            id="template-dropdown"
                                            className="absolute z-50 mt-1 hidden bg-popover border border-gray-600 rounded shadow-lg w-94 right-0"
                                        >
                                            <div className="p-1 border-b border-gray-600">
                                                <select
                                                    className="w-full bg-popover text-xs border border-gray-600 rounded px-1 py-0.5"
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                >
                                                    {CATEGORIES.map((category) => (
                                                        <option key={category} value={category}>
                                                            {category === "All" ? "All" : category}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="overflow-y-auto max-h-[180px]">
                                                {filteredTemplates.map((template, index) => (
                                                    <button
                                                        key={index}
                                                        className="w-full text-left px-2 py-1 hover:bg-gray-700 text-xs truncate"
                                                        onClick={() => {
                                                            setSelectedReportTemplate(template.title);
                                                            setInput(template.content);
                                                            document.getElementById('template-dropdown')?.classList.add('hidden');
                                                        }}
                                                    >
                                                        {template.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2"></div>
                </div>

                {/* START FORM */}
                <form onSubmit={handleSubmit} className="pt-1 px-2 bg-popover rounded-lg">
                    {/* Add placeholder jump buttons */}
                    {templatePlaceholders.length > 0 && (
                        <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                            <span className="text-sm text-gray-400">Click the button to jump to the placeholder ... </span>
                            {templatePlaceholders.map((placeholder, idx) => (
                                <button
                                    key={idx}
                                    type="button" // Add this to prevent form submission
                                    onClick={() => selectTemplatePlaceholder(idx)}
                                    className={buttonAccent}
                                >
                                    {placeholder.text.length > 50
                                        ? `${placeholder.text.substring(0, 49)}...`
                                        : placeholder.text}
                                </button>
                            ))}
                        </div>
                    )}
                    <TextareaAutosize
                        ref={textareaRef}
                        value={input || ''}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                const now = Date.now();
                                // Use a custom property on the event target to track the last Enter key time
                                const textarea = e.currentTarget as HTMLTextAreaElement & { lastEnterTime?: number };
                                if (textarea.lastEnterTime && now - textarea.lastEnterTime < 2000) {
                                    e.preventDefault();
                                    // If two returns occur within 2 seconds, submit the form
                                    handleSubmit(e);
                                    textarea.lastEnterTime = 0;
                                } else {
                                    // Set the last enter time and allow the default new line insertion
                                    textarea.lastEnterTime = now;
                                }
                            }

                            // Add tab key navigation for placeholders
                            if (e.key === 'Tab' && templatePlaceholders.length > 0) {
                                e.preventDefault(); // Prevent default tab behavior

                                // Get current cursor position
                                const cursorPos = e.currentTarget.selectionStart;

                                // Find the next placeholder after cursor position
                                let nextPlaceholder = templatePlaceholders.find(p => p.start > cursorPos);

                                // If no next placeholder, loop back to the first one
                                if (!nextPlaceholder && templatePlaceholders.length > 0) {
                                    nextPlaceholder = templatePlaceholders[0];
                                }

                                // Select the placeholder if found
                                if (nextPlaceholder) {
                                    selectTemplatePlaceholder(templatePlaceholders.indexOf(nextPlaceholder));
                                }
                            }
                        }}
                        placeholder="Ask AI …"
                        className="w-full px-1 bg-popover border border-gray-600 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minRows={6}
                        maxRows={12}
                        disabled={isLoading}
                    />
                    <div className="flex flex-row justify-between rounded gap-1 ">
                        <div className="flex items-center gap-2"></div>
                        <div className="flex flex-row items-center text-foreground gap-1">
                            <div className="text-xs text-gray-400 border rounded bg-gray-800">
                                <ModelSelector

                                    selectedModel={selectedModel}
                                    onModelChange={(newModel) => {
                                        setSelectedModel(newModel);
                                        // Persist selected model to localStorage
                                        localStorage.setItem('aiDashboard_selectedModel', newModel);
                                    }}
                                />
                            </div>
                            <TemperatureSelector />
                        </div>

                        {/* now include the send‐button here */}
                        <div className="flex justify-between px-2 ">
                            <button
                                type="submit"
                                className="flex items-center bg-gray-800 rounded-full ps-2 mb-1 text-blue-300 hover:text-blue-800"
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
                    </div>
                </form>

                {/* System Prompt Modal */}
                <Modal isOpen={isSystemPromptOpen} onClose={() => setIsSystemPromptOpen(false)}>
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-blue-400">System Prompt</h2>
                        <div className="bg-gray-800 p-4 rounded-md border border-gray-600">
                            <pre className="whitespace-pre-wrap text-sm">{systemPrompt}</pre>
                        </div>

                        {contextContent && isContextAttached && (
                            <>
                                <h3 className="text-lg font-semibold mt-6 mb-2 text-blue-400">Context Files</h3>
                                <div className="bg-gray-800 p-4 rounded-md border border-gray-600 max-h-[300px] overflow-auto">
                                    <p className="mb-2 text-sm text-gray-300">
                                        {contextFiles.length} file(s) attached as context:
                                    </p>
                                    <ul className="list-disc pl-5 text-sm">
                                        {contextFiles.map((file) => (
                                            <li key={file.name} className="mb-1">
                                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsSystemPromptOpen(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>

            </div >
        </>
    );
};

export default IRTVBuilderComponent;



// // Function to send messages to the API
// const sendMessageToAPI = useCallback(async (newMessages: Message[]) => {
//     setIsLoading(true);
//     setIsStreaming(false);
//     setStreamedContent('');

//     try {
//         // Create messagesToSend array as you did before
//         const messagesToSend: Message[] = [];

//         // First add system messages if context is attached
//         if (contextContent && isContextAttached) {
//             messagesToSend.push(
//                 {
//                     role: 'system',
//                     content: systemPrompt
//                 },
//                 {
//                     role: 'system',
//                     content: `# Context:\n Here are the documents you must reference:\n\n${contextContent}`
//                 }
//             );
//         } else {
//             messagesToSend.push(
//                 {
//                     role: 'system',
//                     content: systemPrompt
//                 }
//             );
//         }

//         console.log(`Sending context to the model (${contextContent.length} chars)`);
//         // Add conversation messages
//         if (newMessages && newMessages.length > 0) {
//             messagesToSend.push(...newMessages);
//         } else {
//             console.error('No messages in newMessages array');
//             setStatusMsg('Error: No prompt detected. Please enter a question or message.');
//             return; // Exit early if no messages
//         }

//         // Final safety check if 0 messages
//         if (messagesToSend.length === 0) {
//             console.error('messagesToSend is empty after all processing');
//             setStatusMsg('Error: Unable to create a valid message for the AI. Please try again.');
//             return;
//         }

//         // Build the API request body
//         const requestBody: any = {
//             messages: messagesToSend,
//             model: selectedModel,
//             temperature: temperature
//         };

//         // Log what we're sending (for debugging)
//         console.log('Sending to API:', {
//             model: selectedModel,
//             messagesCount: messagesToSend.length,
//             hasContext: Boolean(contextContent && isContextAttached),
//             messagePreview: JSON.stringify(messagesToSend.slice(0, 2))
//         });

//         // Set up event source for streaming
//         setIsStreaming(true);
//         // First, create a session ID for this request
//         const sessionId = Date.now().toString();

//         // Store the messages in session storage temporarily
//         sessionStorage.setItem(`chat_session_${sessionId}`, JSON.stringify(messagesToSend));

//         // Before creating the EventSource, validate messages
//         if (!messagesToSend || messagesToSend.length === 0) {
//             console.error('No messages to send');
//             setStatusMsg('Error: No messages to send. Please enter a prompt.');
//             setIsLoading(false);
//             setIsStreaming(false);
//             return;
//         }

//         // Send the messages via POST
//         fetch('/api/chat/create-stream', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 sessionId,
//                 messages: messagesToSend,
//                 model: selectedModel,
//                 temperature: temperature
//             })
//         }).then(response => {
//             if (!response.ok) {
//                 throw new Error(`HTTP error! Status: ${response.status}`);
//             }

//             // Now create EventSource with only sessionId, model, and temperature
//             const eventSource = new EventSource(
//                 `/api/chat/stream?sessionId=${sessionId}&model=${selectedModel}&temperature=${temperature}`
//             );

//             let accumulatedResponse = '';

//             eventSource.onmessage = (event) => {
//                 try {
//                     // Check for end of stream
//                     if (event.data === "[DONE]") {
//                         console.log('794 Stream complete, adding full response to messages', accumulatedResponse);
//                         // Stream complete, add the assistant message with the full response
//                         console.log('797 ', ((prev: Message[]) => [...prev, { role: 'assistant', content: accumulatedResponse }]));
//                         setMessages((prev) => [...prev, { role: 'assistant', content: accumulatedResponse }]);
//                         setIsLoading(false);
//                         setIsStreaming(false);
//                         console.log('801EventSource closed after completion', messages);
//                         eventSource.close();
//                         return;
//                     }

//                     const data = JSON.parse(event.data);
//                     if (data.content) {
//                         // Check if this is a rate limit message
//                         if (data.content.includes('rate limit')) {
//                             setStatusMsg(`Rate limit reached for ${selectedModel}. Consider waiting a minute or switching models.`);
//                         }

//                         accumulatedResponse += data.content;
//                         setStreamedContent(accumulatedResponse);
//                     }
//                 } catch (error) {
//                     console.error('Error parsing SSE message:', error);
//                 }
//             };

//             // Enhanced error handler
//             eventSource.onerror = (error) => {
//                 // Enhanced error logging with context
//                 const errorDetails = {
//                     readyState: eventSource.readyState, // 0=connecting, 1=open, 2=closed
//                     url: eventSource.url,
//                     timestamp: new Date().toISOString(),
//                     model: selectedModel,
//                     messageCount: messagesToSend.length
//                 };

//                 // console.error('EventSource error:', errorDetails);

//                 // User-friendly error handling based on readyState
//                 let errorMessage = 'Error connecting to AI. ';

//                 if (eventSource.readyState === 2) { // CLOSED
//                     errorMessage += 'The connection was closed unexpectedly.';
//                 } else if (eventSource.readyState === 0) { // CONNECTING
//                     errorMessage += 'Unable to establish connection. The server may be unavailable.';
//                 }

//                 setStatusMsg(errorMessage);
//                 setIsLoading(false);
//                 setIsStreaming(false);
//                 eventSource.close();

//                 // If we have accumulated some content, still show it
//                 if (accumulatedResponse) {
//                     setMessages((prev) => [...prev, { role: 'assistant', content: accumulatedResponse }]);
//                 }
//             };
//         }).catch(error => {
//             console.error('Failed to initiate streaming:', error);
//             setStatusMsg(`Failed to start AI response: ${error.message}`);
//             setIsLoading(false);
//             setIsStreaming(false);
//         });
//     } catch (error) {
//         console.error('Error sending message:', error);
//         const errorMessage = error instanceof Error
//             ? error.message
//             : String(error);

//         // Check if it's a timeout error
//         const isTimeout =
//             errorMessage.includes('timeout') ||
//             errorMessage.includes('timed out') ||
//             errorMessage.includes('AbortError');

//         setStatusMsg(
//             isTimeout
//                 ? `Request timed out. AI is taking too long to respond. ${selectedModel} might be busy. Try again or switch models.`
//                 : `Failed to communicate with AI ${selectedModel}: ${errorMessage}`
//         );
//     } finally {
//         console.log('876 AI request completed', messages);
//         setIsLoading(false);
//         retryInProgress.current = false;
//     }
// }, [selectedModel, contextContent, isContextAttached, contextFiles]);



// // When selectedModel changes, retry sending the last non-retry user message
// useEffect(() => {
//     // Skip on first render
//     if (isInitialRender.current) {
//         isInitialRender.current = false;
//         previousModelRef.current = selectedModel;
//         return;
//     }

//     // Only trigger if model changed and we have messages
//     if (
//         selectedModel &&
//         previousModelRef.current !== selectedModel &&
//         modelRetryCount < MAX_MODEL_RETRIES &&
//         !retryInProgress.current &&
//         messages.length > 0
//     ) {
//         // Find the last non-retry user message
//         const lastUserMessage = messages.findLast(
//             (m) => m.role === 'user' && !m.content.startsWith('Retry with model:')
//         );

//         if (lastUserMessage) {
//             retryInProgress.current = true;
//             const modelChangeMessage: Message = {
//                 role: 'user',
//                 content: `Retry with model: ${selectedModel} `,
//             };
//             setMessages((prev) => [...prev, modelChangeMessage]);
//             setModelRetryCount((prev) => prev + 1);
//             sendMessageToAPI([lastUserMessage, modelChangeMessage]).finally(() => {
//                 retryInProgress.current = false;
//             });
//         }
//     }

//     // Update for next comparison
//     previousModelRef.current = selectedModel;
// }, [selectedModel, sendMessageToAPI, modelRetryCount, messages, statusMsg]);

// // Enhanced error handling for quota issues
// const handleIRTVAnalysis = async () => {
//     console.log('handleIRTVAnalysis called');
//     console.log('irtvContent:', irtvContent);

//     if (!irtvContent?.trim()) {
//         alert('Please add content to the Document panel in the left sidebar to analyze');
//         return;
//     }

//     console.log('Starting IRTV analysis...');

//     setIsLoading(true);
//     setIsStreaming(true);
//     setStep(1);
//     setActiveTab('irtv-analysis');
//     setIrtvAnalysis('');

//     try {
//         // Check if dummy model is selected
//         if (selectedModel === 'dummy') {
//             console.log('Using dummy model for testing...');

//             const dummyResponse = getDummyIRTVResponse(irtvContent);
//             let accumulatedResponse = '';

//             await simulateStreamingResponse(
//                 dummyResponse,
//                 (chunk) => {
//                     accumulatedResponse += chunk;
//                     setIrtvAnalysis(accumulatedResponse);
//                     onResponseChange(accumulatedResponse);
//                     onViewInPreview(accumulatedResponse);
//                 },
//                 () => {
//                     setIsStreaming(false);
//                     console.log('Dummy streaming completed');
//                 }
//             );

//             setCurrentMessages([
//                 {
//                     role: "user",
//                     content: irtvContent,
//                     timestamp: Date.now()
//                 },
//                 {
//                     role: "assistant",
//                     content: accumulatedResponse,
//                     timestamp: Date.now()
//                 }
//             ]);

//             setStep(2);
//             setIsLoading(false);
//             setIsStreaming(false);
//             return;
//         }

//         // Existing API logic for real models
//         console.log('Making API request...');

//         const res = await fetch("/api/chat", {
//             method: "POST",
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 model: selectedModel,
//                 messages: [
//                     {
//                         role: "system",
//                         content: systemPrompt
//                     },
//                     {
//                         role: "user",
//                         content: `${userPrompt}\n\nDocument Content to Analyze:\n${irtvContent}`
//                     }
//                 ],
//                 temperature: temperature,
//                 max_tokens: 4000,
//                 stream: true
//             })
//         });

//         console.log('API response status:', res.status);

//         if (!res.ok) {
//             const errorText = await res.text();
//             console.error('API error:', errorText);
//             throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
//         }

//         const reader = res.body?.getReader();
//         if (!reader) {
//             throw new Error('Failed to get response reader');
//         }

//         const decoder = new TextDecoder();
//         let accumulatedResponse = '';

//         console.log('Starting to read stream...');

//         try {
//             while (true) {
//                 const { done, value } = await reader.read();

//                 if (done) {
//                     console.log('Stream reading completed');
//                     break;
//                 }

//                 const chunk = decoder.decode(value, { stream: true });
//                 console.log('Raw chunk received:', chunk.substring(0, 200));

//                 const lines = chunk.split('\n');

//                 for (const line of lines) {
//                     const trimmedLine = line.trim();
//                     console.log('Processing line:', trimmedLine.substring(0, 100));

//                     if (trimmedLine.startsWith('data: ')) {
//                         const data = trimmedLine.slice(6).trim();
//                         console.log('Data to parse:', data);

//                         if (data === '[DONE]') {
//                             console.log('Received [DONE] signal');
//                             setIsStreaming(false);
//                             break;
//                         }

//                         if (!data || data === '') {
//                             continue;
//                         }

//                         try {
//                             const parsed = JSON.parse(data);
//                             console.log('Parsed data:', parsed);

//                             const content = parsed.choices?.[0]?.delta?.content ||
//                                 parsed.choices?.[0]?.message?.content ||
//                                 parsed.content;

//                             if (content) {
//                                 console.log('Content received:', content);
//                                 accumulatedResponse += content;
//                                 setIrtvAnalysis(accumulatedResponse);
//                                 onResponseChange(accumulatedResponse);
//                                 onViewInPreview(accumulatedResponse);
//                             }
//                         } catch (parseError) {
//                             console.warn('Failed to parse chunk:', data, 'Error:', parseError);
//                             continue;
//                         }
//                     }
//                 }
//             }
//         } finally {
//             reader.releaseLock();
//         }

//         console.log('Final accumulated response length:', accumulatedResponse.length);

//         if (accumulatedResponse.length === 0) {
//             console.log('No content received from streaming, trying non-streaming approach...');
//             await handleIRTVAnalysisAlternative();
//             return;
//         }

//         setCurrentMessages([
//             {
//                 role: "user",
//                 content: irtvContent,
//                 timestamp: Date.now()
//             },
//             {
//                 role: "assistant",
//                 content: accumulatedResponse,
//                 timestamp: Date.now()
//             }
//         ]);

//         setStep(2);
//     } catch (error) {
//         console.error("IRTV Analysis failed:", error);

//         let errorMessage = error.message;
//         if (errorMessage.includes('quota') || errorMessage.includes('429')) {
//             errorMessage = 'API quota exceeded. Please:\n1. Try Dummy Model for testing\n2. Try GPT-3.5 Turbo model\n3. Check your OpenAI billing\n4. Wait and try again later';
//         }

//         alert(`Failed to generate IRTV analysis:\n${errorMessage}`);
//         setActiveTab('current-analysis');
//         setStep(0);
//     }

//     setIsLoading(false);
//     setIsStreaming(false);
// };

// // Also update the alternative method to be more robust
// const handleIRTVAnalysisAlternative = async () => {
//     console.log('Using alternative non-streaming approach...');

//     if (!irtvContent?.trim()) {
//         alert('Please add content to the Document panel in the left sidebar to analyze');
//         return;
//     }

//     try {
//         const res = await fetch("/api/chat", {
//             method: "POST",
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 model: selectedModel,
//                 messages: [
//                     {
//                         role: "system",
//                         content: systemPrompt
//                     },
//                     {
//                         role: "user",
//                         content: `${userPrompt}\n\nDocument Content to Analyze:\n${irtvContent}`
//                     }
//                 ],
//                 temperature: temperature,
//                 max_tokens: 4000,
//                 stream: false
//             })
//         });

//         if (!res.ok) {
//             const errorText = await res.text();
//             throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
//         }

//         const data = await res.json();
//         console.log('Non-streaming response:', data); // Debug log

//         const response = data.choices?.[0]?.message?.content ||
//             data.choices?.[0]?.text ||
//             data.content ||
//             data.response;

//         if (!response) {
//             throw new Error('No response content received from API');
//         }

//         console.log('Response received:', response.substring(0, 200)); // Debug log

//         setIrtvAnalysis(response);
//         onResponseChange(response);
//         onViewInPreview(response);

//         setCurrentMessages([
//             {
//                 role: "user",
//                 content: irtvContent,
//                 timestamp: Date.now()
//             },
//             {
//                 role: "assistant",
//                 content: response,
//                 timestamp: Date.now()
//             }
//         ]);

//         setStep(2);
//     } catch (error) {
//         console.error("Alternative IRTV Analysis failed:", error);
//         throw error; // Re-throw to be handled by the main function
//     }
// };