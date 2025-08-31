'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Add this import
import { usePathname } from 'next/navigation';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed, ChevronLeft, ChevronRight } from 'lucide-react';
// import MarkdownPreview from './MarkdownPreview';
// import DraggableDivider from '@/components/DraggableDivider';
// import SimpleDivider from '@/components/SimpleDivider';
// import styles from '@/components/SplitPanel.module.css';

import { RootState } from '@/store';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import {
    addMessage,
    setMessages,
    Message
} from '@/features/chat/chatSlice';
// import { PROMPT_TEMPLATES, PromptTemplate } from './promptTemplates';
import { SystemPrompt, SystemBehaviorGuidelines, ExistingOntology, UserPrompt, UserInput, ExistingContext, MetamodelPrompt } from '@/app/ontology-builder/prompts';
import TextareaAutosize from 'react-textarea-autosize';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import DigitalRain from '@/components/DigitalRain';
import AnimatedAICircle from '../ui/AnimatedAICircle';
// Import mammoth.js for DOCX conversion
// import * as mammoth from 'mammoth';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import TemperatureSelector from '@/components/ai-chat/TemperatureSelector';
import { saveMarkdownDocument } from '@/features/model-universe/modelSlice'; // Updated import
import { convertDocxToMarkdown } from '@/utils/DOCX-to-Markdown';
import DigitalRainIntro from '@/components/ai-chat/DigitalRainIntro';
export type ModelId = "deepseek-chat" | "dummy" | "deepseek-coder" | "deepseek-r1" | "mistral-small-latest" | "mistral" | "mistral-mistral-small-24b-instruct-2501" | "gpt-4o-mini" | "gpt-4o-2024-08-06" | "gpt-5" | "gpt-5-mini";
// import GettingStartedGuide from './GettingStartedGuide';
// import { refineTemplates } from '@/features/documents/refine-templates';
// import { REFINE_TEMPLATES } from '@/components/ai-chat/refineTemplates';
// import { error } from 'console';
// import { Messages } from 'openai/resources/beta/threads/messages.mjs';
// import { API_BASE_URL } from '@/config/apiConfig';

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// interface Message {
//     role: 'user' | 'assistant' | 'system';
//     content: string;
// }



export interface ChatComponentProps {
    input: string;
    setInput: (input: string) => void;
    selectedModel: string;                // changed to string
    setSelectedModel: (model: string) => void; // changed to accept string
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (content: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    setShowRightPanel?: (show: boolean) => void;
    showLeftPanel?: boolean;
    chatInput?: string;
    onAddMD: () => void;
    mdContent: string;
    setMdContent: (content: string) => void;
    mdPreview: string;
    setMdPreview: (content: string) => void;
    setCurrentMessages: (messages: any[]) => void;
    previewMessageIndex?: number | null;
    gettingStartedGuide?: React.ReactNode;
    guide?: React.ReactNode;
}

const MAX_MODEL_RETRIES = 4;


interface DraggableDividerProps {
    direction: string;
    initialPosition: number;
    onResize: (newPosition: number) => void;
    'aria-orientation': string;
    'aria-valuenow': number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    onMouseDown: () => void;
    onTouchStart: () => void;
    className?: string;
}
export default function ChatComponent({
    input,
    setInput,
    selectedModel,
    setSelectedModel,
    onResponseChange,
    onViewInMarkdown,
    showLeftPanel,
    setShowLeftPanel,
    setShowRightPanel,

    chatInput,
    onAddMD,
    mdContent,
    setMdContent,

    mdPreview,
    setMdPreview,
    setCurrentMessages,
    gettingStartedGuide,
    guide,


}: ChatComponentProps) {
    const dispatch = useDispatch();

    const data = useSelector((state: RootState) => state.modelUniverse);
    const domain = useSelector((state: RootState) => state.modelUniverse.phData.domain);
    const ontology = useSelector((state: RootState) => state.modelUniverse.phData.ontology);
    const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);
    // Get messages from Redux instead of local state
    const messages = useSelector((state: RootState) => state.chat?.currentMessages ?? []); // safer
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputState, setInputState] = useState<string | undefined>(chatInput);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    const [temperature, setTemperature] = useState<number>(0.5); // Default value 0.5
    const [currentDocument, setCurrentDocument] = useState<string>(''); // Added missing state for currentDocument
    const [ontologyUrl, setOntologyUrl] = useState('https://raw.githubusercontent.com/your-repo/your-ontology/main/ontology.json');
    const [impOntologyString, setImpOntologyString] = useState(''); // imported ontology string

    const [topHeight, setTopHeight] = useState<number>(600); // 

    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const retryInProgress = useRef(false);
    // Context file state
    const [printPromptsDiv, setPrintPromptsDiv] = useState(<></>);
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [contextContent, setContextContent] = useState<string>('');
    const [isContextAttached, setIsContextAttached] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const isInitialRender = useRef(true);
    const previousModelRef = useRef<string | null>(null);
    const mdFileInputRef = useRef<HTMLInputElement>(null);
    const [docRefine, setDocRefine] = useState(false);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";
    const [showGuide, setShowGuide] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');

    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    // Add right after your state definitions
    const [selectedRefineTemplate, setSelectedRefineTemplate] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Personal');
    const [selectedReportTemplate, setSelectedReportTemplate] = useState<string>('');
    const [previewMessageIndex, setPreviewMessageIndex] = useState<number | null>(null);
    const [streamedContent, setStreamedContent] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);

    // Add throttling for stream updates
    const streamUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingStreamContentRef = useRef<string>('');

    // NEW: rAF handle for streaming scroll
    const streamScrollRafRef = useRef<number | null>(null);

    // Throttled function to update streamed content
    const updateStreamedContent = useCallback((content: string) => {
        pendingStreamContentRef.current = content;

        if (streamUpdateTimeoutRef.current) {
            clearTimeout(streamUpdateTimeoutRef.current);
        }

        streamUpdateTimeoutRef.current = setTimeout(() => {
            setStreamedContent(pendingStreamContentRef.current);
        }, 75); // was 50
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (streamUpdateTimeoutRef.current) {
                clearTimeout(streamUpdateTimeoutRef.current);
            }
        };
    }, []);

    // Define resetInactivityTimer BEFORE any useEffect that depends on it
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            setShowDigitalRain(true);
        }, 1000000); // 1000 seconds
    }, []);

    const textareaRef = useRef<HTMLTextAreaElement>(null);


    // Add this effect to adjust topHeight based on input size
    useEffect(() => {
        if (!textareaRef.current || !containerRef.current) return;

        // Get current heights
        const containerHeight = containerRef.current.offsetHeight;
        const textareaHeight = textareaRef.current.scrollHeight;

        // Define minimum space to keep for messages (adjust as needed)
        const minMessagesSpace = 500;

        // If textarea is larger than default, adjust topHeight
        if (textareaHeight > 150) { // 150px is approximately 7 rows of text
            // Calculate new topHeight that gives textarea enough room
            const idealMessagesHeight = containerHeight - textareaHeight - 60; // 160px for padding/margins

            // Make sure we don't shrink messages area too much
            const newTopHeight = Math.max(minMessagesSpace, idealMessagesHeight);

            // Only update if significantly different to avoid loops
            if (Math.abs(newTopHeight - topHeight) > 30) {
                setTopHeight(newTopHeight);
            }
        }
    }, [input, containerRef.current?.offsetHeight]);

    // Add a useEffect to set the initial height based on container size
    useEffect(() => {
        // This runs once after mount to set initial size
        if (containerRef.current) {
            const containerHeight = containerRef.current.offsetHeight;
            // Set initial top panel to fill most of the container (minus space for input)
            const initialTopHeight = Math.floor(containerHeight * 0.5);
            setTopHeight(initialTopHeight);
        }
    }, []); // Empty dependency array = runs once on mount

    // Add a useEffect to handle window resize events
    useEffect(() => {
        const handleResize = () => {
            const container = containerRef.current;
            const containerHeight = container ? container.offsetHeight : window.innerHeight;
            const minInputHeight = 160;
            const maxTopHeight = containerHeight - minInputHeight;
            // console.log('108 Container Height:', containerHeight, 'Top Height:', topHeight, 'Max Top Height:', maxTopHeight);
            if (topHeight > maxTopHeight) {
                setTopHeight(maxTopHeight);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [topHeight]);

    // Scroll to bottom whenever there is messages or messages change or loading completes
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current && messages.length > 0) {
                setTimeout(() => {
                    // smooth is fine when a complete message gets added
                    messagesEndRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end',
                    });

                    const parentElement = messagesEndRef.current?.parentElement as HTMLElement | null;
                    if (parentElement) {
                        parentElement.scrollTop = parentElement.scrollHeight;
                    }

                    const messageContainer = document.getElementById('message-container');
                    if (messageContainer) {
                        messageContainer.scrollTop = messageContainer.scrollHeight;
                    }
                }, 100);
            }
        };

        if (messages.length > 0) {
            scrollToBottom();
            const fallbackTimer = setTimeout(scrollToBottom, 300);
            return () => clearTimeout(fallbackTimer);
        }
        setCurrentMessages(messages);
    }, [messages, isLoading]); // removed isStreaming and streamedContent

    // Also add a separate useEffect specifically for streaming updates to ensure frequent scrolling
    useEffect(() => {
        if (isStreaming && streamedContent) {
            const scrollToBottom = () => {
                const messageContainer = document.getElementById('message-container');
                if (messageContainer) {
                    messageContainer.scrollTop = messageContainer.scrollHeight;
                }

                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({
                        behavior: 'auto', // Use 'auto' for immediate scrolling during streaming
                        block: 'end',
                    });
                }
            };

            // Scroll immediately when streaming content updates
            scrollToBottom();
        }
    }, [streamedContent, isStreaming]); // This will trigger every time streamedContent updates

    useEffect(() => {
        const lastAssistant = messages.findLast((m) => m.role === 'assistant');
        if (lastAssistant) {
            onResponseChange(lastAssistant.content);
        }
        setCurrentMessages(messages);
    }, [messages, onResponseChange]);

    useEffect(() => {
        if (chatInput !== undefined) {
            setInput(chatInput);
        }
    }, [chatInput]);

    // Setup inactivity timer
    useEffect(() => {
        resetInactivityTimer();

        // Add event listeners for user activity
        const handleUserActivity = () => {
            if (showDigitalRain) {
                setShowDigitalRain(false);
            }
            resetInactivityTimer();
        };

        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        ''
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
        };
    }, [resetInactivityTimer, showDigitalRain]);

    // Function to handle clicks outside dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const dropdown = document.getElementById('template-dropdown');
            const templateButton = document.querySelector('[title="Select a template"]');

            if (dropdown && !dropdown.classList.contains('hidden')) {
                // Check if click is outside both the dropdown and the button
                if (
                    dropdown &&
                    templateButton &&
                    !dropdown.contains(event.target as Node) &&
                    !templateButton.contains(event.target as Node)
                ) {
                    dropdown.classList.add('hidden');
                }
            }

        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load saved model preference from localStorage on component mount
    useEffect(() => {
        const savedModel = localStorage.getItem('aiDashboard_selectedModel');
        if (savedModel && savedModel !== selectedModel) {
            setSelectedModel(savedModel);
        }
    }, []);

    // Load saved temperature preference from localStorage
    useEffect(() => {
        const savedTemp = localStorage.getItem('aiDashboard_temperature');
        if (savedTemp) {
            setTemperature(parseFloat(savedTemp));
        }
    }, []);

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

    // open md picker
    const handleAddMD = () => {
        mdFileInputRef.current?.click();
        // setDocRefine(true);
    };


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
            setMdContent(content); // This will be shown in the preview
        } catch (err) {
            console.error(err);
            setStatusMsg(`Failed to load ${file.name}`);
        }

        e.target.value = '';
    };

    const ontologyReduxData = data.phData.ontology || null;

    // Memoize complex computed values to prevent unnecessary re-renders
    const existingConcepts = useMemo(() => {
        const ontologyConcepts = ontologyReduxData?.concepts;
        const modelConceptss = data.phData.metis?.models.map((model) =>
            (model.objects.length > 0) && model.objects?.filter(o => o.typeName === "information")
        );
        const modelConcepts = modelConceptss?.flat().filter(Boolean);

        return ontologyConcepts?.concat(
            modelConcepts?.filter(c => typeof c === 'object').map(c => ({ name: c.name, description: c.description })) || []
        );
    }, [ontologyReduxData?.concepts, data.phData.metis?.models]);

    const existingRelationships = useMemo(() => {
        const ontologyRelationships = ontologyReduxData?.relationships;
        const modelConceptss = data.phData.metis?.models.map((model) =>
            (model.objects.length > 0) && model.objects?.filter(o => o.typeName === "information")
        );
        const modelConcepts = modelConceptss?.flat().filter(Boolean);

        const modelRelationshipss = data.phData.metis?.models.map((model) =>
            (model as any).relationships?.length > 0 &&
            (model as any).relationships?.map((r: any) => {
                const found = modelConcepts?.find(o => o && o.id === r.fromObj);
                return found ? r : null;
            }).filter(Boolean)
        );
        const modelRelationships = modelRelationshipss?.flat().filter(Boolean);

        return ontologyRelationships?.concat(modelRelationships);
    }, [ontologyReduxData?.relationships, data.phData.metis?.models]);

    // Memoize the prompt building logic
    const promptData = useMemo(() => {
        let conceptString = '';
        if (existingConcepts && existingRelationships) {
            conceptString += `**Concepts**\n\n${existingConcepts?.map((c) => (c) && `- ${c.name} - ${c.description}`).join('\n')}\n\n`;
            conceptString += `**Relationships**\n\n${existingRelationships?.map((r) => (r) && `- ${r.name} - ${r.nameFrom} - ${r.nameTo}`).join('\n')}\n\n`;
        }

        const userPrompt = (data.phData.domain.name !== "") ? `${UserPrompt} \n\n **Domain name:**\n  ${data.phData.domain?.name} \n\n **Domain description:**\n ${data.phData.domain?.description || ""}` : UserPrompt;
        const userInput = (mdContent !== "") ? `**Additional domain information provided by user:** \n\n ${mdContent}` : "";
        const newContextOntology = ``
        const newContextItems = (conceptString !== '') ? `${ExistingContext} \n\n ${conceptString}` : "";
        const newContextMetamodel = `${MetamodelPrompt}`;

        return {
            userPrompt,
            userInput,
            newContextOntology,
            newContextItems,
            newContextMetamodel
        };
    }, [existingConcepts, existingRelationships, data.phData.domain?.name, data.phData.domain?.description, impOntologyString]);

    // Update state only when promptData changes
    // useEffect(() => {


    //     setPrintPromptsDiv(
    //         <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
    //             <DialogTitle>---- System Prompt</DialogTitle>
    //             <ReactMarkdown>{promptDatat}</ReactMarkdown>
    //             <DialogTitle>---- System behaviour Guidelines Prompt</DialogTitle>
    //             <ReactMarkdown>{promptData} < DialogTitle > ---- Ontology Prompt</>
    //             <ReactMarkdown>{promptData.newContextOntology}</ReactMarkdown>
    //             <DialogTitle>---- User Prompt</DialogTitle>
    //             <ReactMarkdown>{promptData.userPrompt}</ReactMarkdown>
    //             <DialogTitle>---- User Input</DialogTitle>
    //             <ReactMarkdown>{promptData.userInput}</ReactMarkdown>
    //             <DialogTitle>---- Context Prompt</DialogTitle>
    //             <ReactMarkdown>{promptData.newContextItems}</ReactMarkdown>
    //             <DialogTitle>---- Metamodel Prompt</DialogTitle>
    //             <ReactMarkdown>{promptData.newContextMetamodel}</ReactMarkdown>
    //         </div>
    //     );
    // }, [promptData]);

    const handleFetchOntology = async () => {
        try {
            const response = await fetch(`/proxy?url=${encodeURIComponent(ontologyUrl)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ontology from URL: ${response.statusText}`);
            }
            let data = await response.json();
            if (Array.isArray(data)) {
                data = data[0];
            }

            if (typeof data === 'object' && data !== null) {
                // const dataArr = Object.values(data);
                interface DataItem {
                    group: string;
                    entity_name: string;
                }
                const filteredMaster = Object.values(data).filter((item) => (item as DataItem).group === 'master-data');
                const filteredWP = Object.values(data).filter((item) => (item as DataItem).group === 'work-product-component');
                const conceptsNamesMaster = Array.from(new Set(filteredMaster.map((item) => (item as DataItem).entity_name + ' ')));
                const conceptsNamesWP = Array.from(new Set(filteredWP.map((item) => (item as DataItem).entity_name + ' ')));
                setImpOntologyString(`master-data:\n ${conceptsNamesMaster}, work-product-component:\n ${conceptsNamesWP}`);
            } else {
                console.error('Fetched data is neither an array nor an object:', data);
            }
        } catch (error) {
            console.error('Failed to fetch ontology data: ', error);
        }
    };

    // Add this helper inside the ChatComponent function (near other helpers)
    const generatedOntologyFromResponse = useCallback(async (assistantText: string) => {
        if (!assistantText || assistantText.trim() === "") return null;

        try {
            setStatusMsg('Generating structured domain output...');

            // Ensure assistantText is trimmed and used as fallback
            const assistantTextTrimmed = assistantText?.toString().trim() ?? '';

            // Build a single prompt string the server expects
            const promptParts = [
                promptData.userPrompt || '',
                '\n\nAssistant response:\n',
                assistantTextTrimmed,
                '\n\n',
                promptData.userInput || '',
                '\n\n',
                promptData.newContextItems || '',
                '\n\n',
                promptData.newContextMetamodel || ''
            ];

            // join parts but also ensure we have something meaningful
            let combinedPrompt = promptParts.filter(Boolean).join('').trim();

            // Fallback: if the combined prompt is empty for any reason, use assistantTextTrimmed
            if (!combinedPrompt || combinedPrompt.length === 0) {
                combinedPrompt = assistantTextTrimmed;
            }

            // Final defensive check
            if (!combinedPrompt || combinedPrompt.length === 0) {
                console.warn('generatedOntologyFromResponse: no prompt to send (assistantText empty). Aborting.');
                setStatusMsg('No prompt available to generate domain.');
                setTimeout(() => setStatusMsg(''), 3000);
                return null;
            }

            const payload = {
                prompt: combinedPrompt,
                aiModelName: selectedModel || 'gpt-5'
            };

            // Log the outgoing payload so you can inspect it in the browser console / network tab
            console.log('Sending /api/gendomain payload:', {
                promptPreview: combinedPrompt.slice(0, 1000), // avoid huge logs
                aiModelName: payload.aiModelName
            });

            const res = await fetch('/api/gendomain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // If the response isn't JSON, we'll still try to recover by reading text
            const contentType = res.headers.get('content-type') || '';

            let rawText: string | null = null;
            let json: any = null;

            try {
                // Try to parse as JSON first (normal case)
                json = await res.clone().json().catch(() => null);
            } catch (e) {
                json = null;
            }

            try {
                // Always capture raw text too for logging/fallback
                rawText = await res.clone().text().catch(() => null);
            } catch (e) {
                rawText = null;
            }

            if (!res.ok) {
                // show any error object we can read
                console.error('gendomain fetch failed:', res.status, {
                    json,
                    rawText
                });
                setStatusMsg(`Failed to generate domain (status ${res.status})`);
                return null;
            }

            // Helpful debug log: show what the endpoint returned
            console.log('gendomain returned content-type:', contentType);
            console.log('gendomain rawText (first 2000 chars):', rawText ? rawText.slice(0, 2000) : rawText);
            console.log('gendomain json:', json);

            // Derive a canonical object to inspect
            const candidate = json ?? (rawText ? (() => {
                // If rawText looks like JSON, try to parse it
                try {
                    return JSON.parse(rawText);
                } catch (e) {
                    // Not JSON, return as text body under a common key
                    return { text: rawText };
                }
            })() : null);

            // Try common places where structured output might appear
            const structured =
                (candidate && (candidate.response ?? candidate.presentation ?? candidate.text ?? candidate.result ?? candidate.message ?? candidate.data ?? null)) ||
                // If the candidate itself is an array with first item carrying content
                (Array.isArray(candidate) && (candidate[0]?.response ?? candidate[0]?.text ?? candidate[0])) ||
                null;

            // If we still don't have a "structured" value, but the entire rawText contains something useful, use it as fallback
            let finalStructured = structured;
            if (!finalStructured && rawText) {
                // If rawText is just a single JSON string without top-level keys, attempt to extract JSON block inside text
                const trimmed = rawText.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        finalStructured = parsed;
                    } catch (e) {
                        // not parseable — fall back to using raw text string
                        finalStructured = rawText;
                    }
                } else {
                    finalStructured = rawText;
                }
            }

            // Final safety: if the candidate itself is a string and we haven't set structured, use it
            if (!finalStructured && typeof candidate === 'string') {
                finalStructured = candidate;
            }

            if (finalStructured && setCurrentDocument) {
                try {
                    setCurrentDocument(finalStructured);
                    setStatusMsg('Structured domain output generated');
                } catch (err) {
                    console.warn('setCurrentDocument failed', err);
                    setStatusMsg('Generated structured output (could not set in UI)');
                }
            } else {
                // More detailed warning so it's clear what shape came back
                console.warn('No structured output found in genontology response', {
                    candidate,
                    finalStructured,
                    rawText,
                    json
                });
                setStatusMsg('Structured domain generator returned unexpected shape');
            }

            return candidate;
        } catch (err) {
            console.error('Error calling /api/genontology:', err);
            setStatusMsg(`Error generating ontology: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        } finally {
            setTimeout(() => setStatusMsg(''), 4000);
        }
    }, [selectedModel, setCurrentDocument, setStatusMsg, promptData]);

    const sendMessageToAPI = useCallback(async (newMessages: Message[]) => {
        setIsLoading(true);
        setIsStreaming(false);
        setStreamedContent('');
        console.log('773 sendMessageToAPI called with messages:', newMessages);

        if (selectedModel === 'dummy') {
            const dummyResponse =
                "This is a loooooooooooooooooooooooooooooooooo ooooooooooooooooooooooooooooooong loooooooooooooooooooooooooooooooo ooooooooooooooooooooooooooooooooong dummy response.";

            // Option A: add directly as a final assistant message (simplest)
            dispatch(addMessage({ role: 'assistant', content: dummyResponse }));
            setIsStreaming(false);
            setIsLoading(false);
            return;
        }

        try {
            // Create messagesToSend array as you did before
            const messagesToSend: Message[] = [];

            messagesToSend.push({
                role: 'system',
                content: SystemPrompt
            });

            console.log(`598 Sending context to the model (${contextContent.length} chars).`, messagesToSend);
            // Add conversation messages
            if (newMessages && newMessages.length > 0) {
                messagesToSend.push(...newMessages);
            } else {
                console.error('No messages in newMessages array');
                setStatusMsg('Error: No prompt detected. Please enter a question or message.');
                return;
            }

            // Final safety check
            if (messagesToSend.length === 0) {
                console.error('messagesToSend is empty after all processing');
                setStatusMsg('Error: Unable to create a valid message for the AI. Please try again.');
                return;
            }

            // Build the API request body
            const requestBody: any = {
                messages: messagesToSend,
                model: selectedModel,
                temperature: temperature
            };

            // Log what we're sending (for debugging)
            console.log('Sending to API:', {
                model: selectedModel,
                messagesCount: messagesToSend.length,
                hasContext: Boolean(contextContent && isContextAttached),
                messagePreview: JSON.stringify(messagesToSend.slice(0, 2))
            });

            // Set up event source for streaming
            setIsStreaming(true);
            // First, create a session ID for this request
            const sessionId = Date.now().toString();

            // Store the messages in session storage temporarily
            sessionStorage.setItem(`chat_session_${sessionId}`, JSON.stringify(messagesToSend));

            // Validate messages
            if (!messagesToSend || messagesToSend.length === 0) {
                console.error('No messages to send');
                setStatusMsg('Error: No messages to send. Please enter a prompt.');
                setIsLoading(false);
                setIsStreaming(false);
                return;
            }
            console.log('832 Messages to send:', messagesToSend);
            // Send the messages via POST
            fetch('/api/chat/create-stream', {
                method: 'POST',
                headers:
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    messages: messagesToSend,
                    model: selectedModel,
                    temperature: temperature
                })
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            }).then(data => {
                // Only create EventSource after successful POST
                console.log('Create-stream successful, now starting EventSource');

                const streamUrl = `/api/chat/stream?sessionId=${sessionId}&model=${selectedModel}&temperature=${temperature}`;
                console.log('Creating EventSource with URL:', streamUrl);

                const eventSource = new EventSource(streamUrl);

                // Add connection state logging
                eventSource.onopen = (event) => {
                    console.log('EventSource connection opened successfully:', {
                        readyState: eventSource.readyState,
                        url: eventSource.url,
                        timestamp: new Date().toISOString()
                    });
                };

                let accumulatedResponse = '';

                eventSource.onmessage = (event) => {
                    try {
                        // Check for end of stream
                        if (event.data === "[DONE]") {
                            console.log('672 Stream complete, adding full response to messages', accumulatedResponse);
                            // Clear any pending updates and set final content
                            if (streamUpdateTimeoutRef.current) {
                                clearTimeout(streamUpdateTimeoutRef.current);
                                streamUpdateTimeoutRef.current = null;
                            }
                            setStreamedContent(accumulatedResponse);

                            dispatch(addMessage({ role: 'assistant', content: accumulatedResponse }));
                            setIsLoading(false);
                            setIsStreaming(false);
                            (async () => {
                                try {
                                    const genOntologyResult = await generatedOntologyFromResponse(accumulatedResponse);

                                    // Optional: if the generator returns a single 'name/description' obj,
                                    // you can adapt here to set each field appropriately (e.g., setDomainName, setDomainDescription).
                                    // We already call setCurrentDocument inside generateOntologyFromResponse when possible.
                                    // If you want to update other UI fields, inspect genOntologyResult and set them here.
                                    if (!genOntologyResult) {
                                        console.warn('genOntology returned no result');
                                    } else {
                                        console.log('genOntology result:', genOntologyResult);
                                    }
                                } catch (err) {
                                    console.error('Error while generating ontology after stream:', err);
                                } finally {
                                    // close eventSource and cleanup already done by existing code
                                    eventSource.close();
                                }
                            })();
                            return;
                        }

                        const data = JSON.parse(event.data);
                        if (data.content) {
                            // Check if this is a rate limit message
                            if (data.content.includes('rate limit')) {
                                setStatusMsg('Rate limit exceeded. Please wait a moment before sending another message.');
                                setTimeout(() => setStatusMsg(''), 10000);
                                return;
                            }

                            accumulatedResponse += data.content;
                            // Use throttled update instead of direct setState
                            updateStreamedContent(accumulatedResponse);
                            // console.log('902 Received SSE message:', data.content);
                        }
                    } catch (error) {
                        console.error('Error parsing SSE message:', error);
                    }
                };

                // Enhanced error handler
                eventSource.onerror = (error) => {
                    // Enhanced error logging with context
                    const errorDetails = {
                        readyState: eventSource.readyState, // 0=connecting, 1=open, 2=closed
                        url: eventSource.url,
                        timestamp: new Date().toISOString(),
                        model: selectedModel,
                        messageCount: messagesToSend.length,
                        sessionId: sessionId,
                        error: error,
                        errorType: typeof error,
                        errorMessage: error instanceof Error ? error.message : 'Unknown error',
                        errorStack: error instanceof Error ? error.stack : 'No stack trace'
                    };

                    console.error('EventSource error details:', errorDetails);
                    console.error('Full error object:', error);

                    // Also log the EventSource URL for debugging
                    console.log('EventSource URL that failed:', eventSource.url);

                    // User-friendly error handling based on readyState
                    let errorMessage = 'Error connecting to AI. ';

                    if (eventSource.readyState === 2) { // CLOSED
                        errorMessage += 'The connection was closed unexpectedly.';
                    } else if (eventSource.readyState === 0) { // CONNECTING
                        errorMessage += 'Unable to establish connection. The server may be unavailable.';
                    } else if (eventSource.readyState === 1) { // OPEN
                        errorMessage += 'Connection was open but encountered an error.';
                    }

                    // Add specific debugging info to the error message
                    errorMessage += ` (ReadyState: ${eventSource.readyState}, Session: ${sessionId})`;

                    setStatusMsg(errorMessage);
                    setIsLoading(false);
                    setIsStreaming(false);
                    eventSource.close();

                    // If we have accumulated some content, still show it
                    if (accumulatedResponse) {
                        dispatch(addMessage({ role: 'assistant', content: accumulatedResponse }));
                    }
                };
            }).catch(error => {
                console.error('Failed to initiate streaming:', error);
                setStatusMsg(`Failed to start AI response: ${error.message}`);
                setIsLoading(false);
                setIsStreaming(false);
            });
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : String(error);

            // Check if it's a timeout error
            const isTimeout =
                errorMessage.includes('timeout') ||
                errorMessage.includes('timed out') ||
                errorMessage.includes('AbortError');

            setStatusMsg(
                isTimeout
                    ? `Request timed out. AI is taking too long to respond. ${selectedModel} might be busy. Try again or switch models.`
                    : `Failed to communicate with AI ${selectedModel}: ${errorMessage}`
            );
        } finally {
            console.log('AI request completed');
            setIsLoading(false);
            retryInProgress.current = false;
        }
    }, [selectedModel, contextContent, isContextAttached, contextFiles, dispatch, temperature, updateStreamedContent]);



    // Update handleSubmit to use Redux actions
    const handleSubmit = async (e: React.FormEvent) => {
        console.log('1022 handleSubmit called!', { input, docRefine }); // Add this first
        e.preventDefault();
        console.log('1024 Submitting message:', docRefine, input, currentDocument, mdContent);
        if (!input?.trim()) return;


        let userMessageContent = input;

        if (docRefine) {
            userMessageContent = `${userMessageContent} #Content:\n ${currentDocument} #Context:\n ${mdContent}`;
        } else {
            userMessageContent = `${userMessageContent} #Context:\n ${mdContent}`;
        }

        const userMessage: Message = { role: 'user', content: userMessageContent };

        console.log('1039 User message to send:', userMessage);

        // Add the user message to Redux store instead of local state
        dispatch(addMessage(userMessage));

        // Send all messages including the new one to maintain conversation context
        await sendMessageToAPI([...messages, userMessage]);

        setInput(''); // Clear the input field after submission
        onResponseChange(''); // Clear parent state if needed
        setShowDigitalRain(false); // Turn OFF digital rain when sending a message
    };

    const handleCopyMessage = (content: string, index: number) => {
        navigator.clipboard.writeText(content)
            .then(() => {
                setCopiedIndex(index);
                setTimeout(() => setCopiedIndex(null), 2000);
            })
            .catch((err) => {
                console.error('Failed to copy text: ', err);
            });
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
    const TemperatureSelector = () => {
        return (
            <div className="flex flex-col items-center text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-gray-400">Temp:</span>
                    <select
                        value={temperature}
                        onChange={(e) => {
                            const newTemp = parseFloat(e.target.value);
                            setTemperature(newTemp);
                            localStorage.setItem('aiDashboard_temperature', newTemp.toString());
                        }}
                        className="bg-popover border border-gray-600 rounded text-xs py-0 px-1"
                        title="Temperature controls randomness. Lower values are more deterministic, higher values more creative."
                    >
                        <option value="0.0">0.0</option>
                        <option value="0.3">0.3</option>
                        <option value="0.5">0.5</option>
                        <option value="0.7">0.7</option>
                        <option value="1.0">1.0</option>
                        <option value="1.2">1.2</option>
                    </select>
                </div>
            </div>
        );

    };



    // Simple Modal component
    // const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    //     if (!isOpen) return null;

    //     return (
    //         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    //             <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
    //                 <button
    //                     onClick={onClose}
    //                     className="absolute right-4 top-4 text-gray-400 hover:text-white"
    //                 >
    //                     <X className="h-6 w-6" />
    //                 </button>
    //                 <div className="p-6">
    //                     {children}
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // };

    // Function to open system prompt modal
    // const handleSystemPromptClick = () => {
    //     setIsSystemPromptOpen(true);
    // };

    const handleGenerateDomainFromLastAssistant = useCallback(async () => {
        try {
            // Prefer the last assistant message; fall back to streamedContent if none
            const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
            const textToUse = lastAssistant?.content?.trim() ? lastAssistant!.content : (streamedContent?.trim() ? streamedContent : '');

            if (!textToUse) {
                setStatusMsg('No assistant response available to generate domain from.');
                setTimeout(() => setStatusMsg(''), 3000);
                return;
            }

            setStatusMsg('Generating structured domain output from last assistant message...');
            const result = await generatedOntologyFromResponse(textToUse);

            if (result) {
                console.log('generatedOntologyFromResponse result:', result);
                setStatusMsg('Domain generation completed.');
            } else {
                setStatusMsg('Domain generator returned no result.');
            }
        } catch (err) {
            console.error('Error while generating domain from last assistant:', err);
            setStatusMsg(`Error generating domain: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setTimeout(() => setStatusMsg(''), 4000);
        }
    }, [messages, streamedContent, generatedOntologyFromResponse, setStatusMsg]);

    // Add this effect to handle window messages
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            console.log('Window message received:', {
                origin: e.origin,
                data: e.data,
                source: e.source,
            });
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className={`flex flex-col  ${isMobile ? 'max-h-[calc(100vh-26rem)]' : 'max-h-[calc(100vh-7rem)]'} min-w-0 rounded-lg overflow-hidden relative`}>
            {/* Guide Sidebar and Main Chat Container - Side by Side */}
            <div className="flex-1 flex flex-col h-0 bg-secondary/40">
                {/* Guide Sidebar */}
                {showGuide && (
                    <div className="flex flex-col items-center justify-between mt-1 mb-2 me-2 px-1 border border-yellow-800 rounded-lg w-80 h-full flex-shrink-0">
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
                {/* Main chat container */}
                <div className="flex flex-1 flex-col h-full bg-secondary/40 overflow-hidden relative">
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
                    {/* Message container with scrollable area */}
                    <div
                        className="flex-1 overflow-y-auto w-full min-w-0 message-container transform-gpu will-change-transform"
                        id="message-container"
                    >
                        {messages.length < 1 && (!input || input.trim() === "") && !isStreaming && !streamedContent ? (
                            // Give DigitalRain the full available height
                            <div className="w-full h-[calc(100vh-22rem)] flex-1 flex flex-col">
                                {showDigitalRain ? (
                                    <DigitalRainIntro
                                        onInteraction={() => setShowDigitalRain(false)}
                                        speed={4}
                                        backgroundColor="rgba(10, 20, 10, 0.03)"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center max-h-[calc(100vh-22rem)] w-full overflow-auto p-4 gap-4 text-gray-400 text-sm flex-1">
                                        {gettingStartedGuide}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Make this a non-scrolling container so only the outer one scrolls */}
                        <div className="p-4 rounded-lg w-full bg-transparent overflow-x-hidden">
                            {messages.map((message, index) => (
                                // <div key={index}
                                //     className={`mb-4 p-3 rounded-lg flex flex-col gap-2 min-w-0 w-fit break-words ${message.role === 'user'
                                //         ? 'bg-card ml-auto text-card-foreground flex-col border border-blue-900'
                                //         : 'bg-secondary mr-auto text-card-foreground flex-col border-4 border-secondary'
                                //         } `}
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
                                                        {/* <button
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
                                                    </button> */}
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
                                                                if (setShowRightPanel) {
                                                                    setShowRightPanel(true);
                                                                }
                                                                // Toggle preview state locally
                                                                if (previewMessageIndex === index) {
                                                                    setPreviewMessageIndex(null);
                                                                } else {
                                                                    setPreviewMessageIndex(index);
                                                                }
                                                            }}
                                                            className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                                        >
                                                            Show Preview
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* message content */}
                                    <div className="p-2 min-w-0 bg-primary-foreground whitespace-pre-wrap break-words overflow-auto">
                                        {message.content}
                                    </div>

                                    {/*  bottom buttons */}
                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mt-2 ml-auto rounded-md p-2">
                                            {message.role === 'assistant' && (
                                                <>
                                                    {/* Add Save to Library button */}
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
                                                            if (setShowRightPanel) {
                                                                setShowRightPanel(true);
                                                            }
                                                            // Toggle preview state locally
                                                            if (previewMessageIndex === index) {
                                                                setPreviewMessageIndex(null);
                                                            } else {
                                                                setPreviewMessageIndex(index);
                                                            }
                                                        }}
                                                        className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                                    >
                                                        Show Preview
                                                        {/* {previewMessageIndex === index ? "Show Plain Text" : "Markdown Preview"} */}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isStreaming && streamedContent && (
                                <div className="mb-4 p-3 rounded-lg flex flex-col gap-2 bg-secondary mr-auto text-card-foreground flex-col border-4 border-secondary min-w-0 w-fit break-words">
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

                                    <div className="p-1 px-4 whitespace-pre-wrap break-words overflow-auto min-w-0 w-full">
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

                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length > 0 && (
                            <div className="sticky bottom-0 w-full flex justify-end px-2 py-1 bg-gradient-to-t from-popover/80 to-transparent">
                                <button
                                    onClick={() => dispatch(setMessages([]))}
                                    title="Clear chat history"
                                    className="inline-flex items-center gap-1 rounded-md border border-red-800/40 bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-200 px-2 py-1 text-[11px]"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Add  message display */}
                {/* statusMsg && (
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
                    ) */}
                {/* <div className="pb-[600px]"></div> */}
            </div>
            {/* Input Area */}
            <div className="relative bottom-0 left-0 right-0 bg-popover pb-safe mt-1 rounded-lg z-10">
                {/* Input area always at the bottom */}
                {/* <div className={`flex  ${isMobile ? 'max-h-[calc(100vh-22rem)]' : 'max-h-[calc(100vh-18rem)]'} min-w-0 rounded-lg overflow-hidden relative`}></div> */}
                {/* <div className="fixed bottom-0 left-10 right-1  bg-popover border-t border-gray-600 z-10"> */}
                <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 px-2' : ''} bg-popover border-t border-gray-600 z-10`}>
                    {pathname === '/ontology-builder' &&
                        <div className="flex items-center justify-between p-2">
                            <div className="flex-1 flex flex-col min-h-0 bg-secondary/40 overflow-visible relative">
                                <details className="sticky top-0 bottom-5 w-full z-30 pointer-events-auto">
                                    <summary className="bg-gray-800 text-white cursor-pointer p-1">Add External Ontology Concepts...</summary>
                                    <div className="w-full rounded-md border border-gray-600 bg-gray-800 p-2">
                                        <div className="cursor-pointer">Import Ontology</div>
                                        <div className="flex-grow bg-gray-700 text-gray-500">
                                            <Textarea
                                                id="ontologyUrl"
                                                className="ontology-input flex-grow bg-gray-600 text-white"
                                                value={ontologyUrl}
                                                onChange={(e) => setOntologyUrl(e.target.value)}
                                                placeholder="Paste ontology URL here"
                                            />
                                            <div className="flex justify-between">
                                                <Button
                                                    onClick={() => {
                                                        handleFetchOntology();
                                                        setActiveTab('preview');
                                                    }}
                                                    className="bg-green-800 text-white text-sm rounded w-full"
                                                >
                                                    Load Ontology
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            {/* button row above the chat */}
                            <div className="flex items-center gap-2 ms-auto">
                                <button
                                    type="button"
                                    className="bg-blue-700 text-gray-300 py-1 px-3 rounded hover:bg-blue-600"
                                    onClick={() => {
                                        setDocRefine(true);
                                        setInput((currentDocument !== "")
                                            ? `
Please include new items below.
[New items]

`
                                            // Let’s begin by reviewing the current domain definition. I’ll provide it in the next message unless you require a specific format.
                                            //                                         `
                                            :
                                            `I want to scope and define the domain: [DOMAIN NAME]

Please help me:
- Identify and formalize the core concepts.
- Capture domain boundaries, assumptions, and known variations.
- Prepare the result for later use in ontology concepts definition, Process modelling and AKM modeling, data integration.
- Stating the Domain name and then a description of the domain.
Don't include explanations, next steps or examples at this stage.
`)
                                    }}
                                >
                                    Define & Scope Domain
                                </button>

                                {/* New button to trigger generatedOntologyFromResponse */}
                                <button
                                    type="button"
                                    className="bg-emerald-700 text-white py-1 px-3 rounded hover:bg-emerald-600"
                                    onClick={handleGenerateDomainFromLastAssistant}
                                    title="Generate a structured domain from the last assistant response"
                                >
                                    Generate Domain
                                </button>
                            </div>
                        </div>
                    }

                    <div className="flex items-center gap-2"></div>

                    {/* START FORM */}
                    <form onSubmit={handleSubmit} className="pt-1 px-2 bg-popover rounded-lg min-w-0 w-full">
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
                                console.log('Key pressed:', e.key, 'shiftKey:', e.shiftKey); // Add this
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    console.log('Enter pressed without shift - should submit'); // Add this
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

                                    if (nextPlaceholder) {
                                        selectTemplatePlaceholder(templatePlaceholders.indexOf(nextPlaceholder));
                                    }
                                }
                            }}
                            placeholder="Ask anything …"
                            className="w-full px-1 bg-popover border border-gray-600 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            minRows={6}
                            maxRows={12}
                            disabled={isLoading}
                        />
                        <div className="flex justify-between">
                            <div className="flex items-center gap-2"></div>
                            <div className="flex items-center text-foreground gap-1">
                                <ModelSelector
                                    selectedModel={selectedModel as ModelId}
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
                        </div>
                    </form>
                </div>
            </div>
        </div >
    )
}

