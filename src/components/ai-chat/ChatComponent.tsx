'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Add this import
import { usePathname } from 'next/navigation';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed, ChevronLeft, ChevronRight } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';
// import DraggableDivider from '@/components/DraggableDivider';
// import SimpleDivider from '@/components/SimpleDivider';
// import styles from '@/components/SplitPanel.module.css';

import { RootState } from '@/store';
import {
    addMessage,
    setMessages,
    Message
} from '@/features/chat/chatSlice';
import { PROMPT_TEMPLATES, PromptTemplate } from './promptTemplates';
import { systemPrompt as promptBuilderPrompt } from '@/app/prompt-builder/prompts';
import TextareaAutosize from 'react-textarea-autosize';
import DigitalRain from '@/components/DigitalRain';
import AnimatedAICircle from '../ui/AnimatedAICircle';
// Import mammoth.js for DOCX conversion
// import * as mammoth from 'mammoth';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import ModelSelector from './ModelSelector';
import TemperatureSelector from './TemperatureSelector';
import { saveMarkdownDocument } from '@/features/model-universe/modelSlice'; // Updated import
import { convertDocxToMarkdown } from '@/utils/DOCX-to-Markdown';
import DigitalRainIntro from './DigitalRainIntro';
// import GettingStartedGuide from './GettingStartedGuide';
// import { refineTemplates } from '@/features/documents/refine-templates';
import { REFINE_TEMPLATES } from './refineTemplates';
import { error } from 'console';
import { Messages } from 'openai/resources/beta/threads/messages.mjs';
// import { API_BASE_URL } from '@/config/apiConfig';
import { callGateway } from '@/lib/ai/generate';
import { mapModelId } from '@/lib/ai/modelMap';

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// interface Message {
//     role: 'user' | 'assistant' | 'system';
//     content: string;
// }
export interface ChatComponentProps {
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    showLeftPanel: boolean;
    setShowLeftPanel: (show: boolean) => void;
    showRightPanel?: boolean; // Add this line to the destructuring
    setShowRightPanel?: (show: boolean) => void; // Add this line to the destructuring
    error?: string;
    chatInput?: string;
    input: string;
    setInput: (input: string) => void;
    setMdContent: (message: string) => void;
    mdContent: string;
    onAddMD?: () => void;
    currentDocument?: string;
    setCurrentDocument?: (doc: string) => void; // Add this line to the destructuring
    mdPreview: string;
    setMdPreview: (preview: string) => void;
    setCurrentMessages: (messages: any[]) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    isMobile?: boolean; // Add this line to the destructuring
    setIsMobile?: (isMobile: boolean) => void; // Add this line to the destructuring
    gettingStartedGuide: React.ReactNode;
    guide?: React.ReactNode;
    includeDomainContext?: boolean;
    setIncludeDomainContext?: (include: boolean) => void;
    onSavePreviewToLibrary?: () => void; // Add callback for saving preview
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
    showRightPanel,
    setShowRightPanel,
    chatInput,
    onAddMD,
    mdContent,
    setMdContent,
    currentDocument,
    setCurrentDocument,
    mdPreview,
    setMdPreview,
    setCurrentMessages,
    gettingStartedGuide,
    guide,
    isMobile = false,
    setIsMobile,
    includeDomainContext = false,
    setIncludeDomainContext,
    onSavePreviewToLibrary
}: ChatComponentProps) {
    const dispatch = useDispatch();

    const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);
    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);

    // Get messages from Redux instead of local state
    const messages = useSelector((state: RootState) => state.chat?.currentMessages ?? []); // safer
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputState, setInputState] = useState<string | undefined>(chatInput);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    const [temperature, setTemperature] = useState<number>(0.5); // Default value 0.5
    const [maxTokens, setMaxTokens] = useState<number | ''>('');

    const [topHeight, setTopHeight] = useState<number>(600); // 

    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const retryInProgress = useRef(false);
    // Context file state
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

    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Debug: Log pathname to check
    useEffect(() => {
        console.log('Current pathname:', pathname);
        console.log('Should show controls:', pathname.startsWith('/ai-chat'));
    }, [pathname]);

    // Add right after your state definitions
    const [selectedRefineTemplate, setSelectedRefineTemplate] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Personal');
    const [selectedReportTemplate, setSelectedReportTemplate] = useState<string>('');
    const [previewMessageIndex, setPreviewMessageIndex] = useState<number | null>(null);
    const [streamedContent, setStreamedContent] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const templateButtonRef = useRef<HTMLButtonElement | null>(null);
    const templateDropdownRef = useRef<HTMLDivElement | null>(null);
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

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

    // New state for system prompt modal
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState<string>(`You are a Domain Expert in the domain supplied by the user. 
Your task is to help the user define a specific domain of interest clearly, comprehensively, and in a structured way. 
Enhance the given Domain Name if necessary.
Domain Name:
Domain Description:

Domain Presentation:
Please include the following:
1. Domain Purpose and Scope.
2. Key Concepts and Terminologies.
3. Actors and Roles.
4. Activities and Processes.
5. Objects and Resources.
6. Events and Triggers.
7. Rules and Constraints.
8. Data and Information Flows.
9. External Interfaces or Contexts.
10. Known Sub-domains or Boundaries.
`);

    const refinePrompt = (
        `Please revise the content below for clarity, style, and grammar.
Take into consideration the following changes or additions: [Please describe the changes you want in detail here].
Your task is to improve and refine the text, not to analyze it.
Do not use its contents as contextual input for other questions--I want it improved not analyzed:
    `
    )

    // // Generate categories list dynamically from templates
    // const CATEGORIES = ["All", ...Array.from(
    //     new Set(PROMPT_TEMPLATES.map(template => template.category))
    // ).sort()];

    // const filteredTemplates = selectedCategory === 'All'
    //     ? PROMPT_TEMPLATES
    //     : PROMPT_TEMPLATES.filter(template => template.category === selectedCategory);

    // Generate categories list dynamically from templates
    const CATEGORIES = [...Array.from(
        new Set(PROMPT_TEMPLATES.map(template => template.usage))
    ).sort(), "All"];

    const filteredTemplatesOrig = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.usage.includes(selectedCategory));

    // If Context Include Domain remove all text in templates with text in square brackets
    const filteredTemplates = filteredTemplatesOrig.map(template => {
        return {
            ...template,
            content: template.content.replace(/\[[^\]]*\]/g, '')
        };
    });

    // Define templates for document refinement
    const refineTemplates = REFINE_TEMPLATES;



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
        // Load persisted settings
        try {
            const savedTemp = localStorage.getItem('aiDashboard_temperature');
            if (savedTemp) setTemperature(parseFloat(savedTemp));
            const savedMax = localStorage.getItem('aiDashboard_max_tokens');
            if (savedMax) {
                const parsed = parseInt(savedMax, 10);
                if (!Number.isNaN(parsed)) setMaxTokens(parsed);
            }
        } catch { }

        // This runs once after mount to set initial size
        if (containerRef.current) {
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
        // Remove the setCurrentMessages call - messages are managed by Redux
    }, [messages, isLoading]); // removed isStreaming and streamedContent and setCurrentMessages

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
        // Remove the setCurrentMessages call - messages are managed by Redux
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

    useEffect(() => {
        if (!showTemplateDropdown) return;

        const handleClickOutside = (event: MouseEvent) => {
            const dropdown = templateDropdownRef.current;
            const button = templateButtonRef.current;

            if (!dropdown || !button) return;

            if (!dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
                setShowTemplateDropdown(false);
            }
        };

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowTemplateDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEsc);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [showTemplateDropdown]);

    // Load saved model preference from localStorage on component mount
    useEffect(() => {
        const savedModel = localStorage.getItem('aiDashboard_selectedModel');
        if (savedModel && savedModel !== selectedModel && setSelectedModel) {
            setSelectedModel(savedModel);
        }
    }, [selectedModel, setSelectedModel]);

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


    const sendMessageToAPI = useCallback(async (newMessages: Message[]) => {
        setIsLoading(true);
        setIsStreaming(false); // non-streaming for Vercel AI proxy
        setStreamedContent('');
        console.log('sendMessageToAPI (gateway) called with messages:', newMessages);

        // Log context info for debugging
        console.log('602 Context information available:', {
            mdContentLength: mdContent?.length || 0,
            currentDocumentLength: currentDocument?.length || 0,
            mdContentSample: mdContent?.substring(0, 50),
            currentDocumentSample: currentDocument?.substring(0, 50),
        });

        if (selectedModel === 'dummy') {
            const dummyResponse =
                "This is a loooooooooooooooooooooooooooooooooo ooooooooooooooooooooooooooooooong loooooooooooooooooooooooooooooooo ooooooooooooooooooooooooooooooooong dummy response.";

            dispatch(addMessage({ role: 'assistant', content: dummyResponse }));
            setIsLoading(false);
            return;
        }

        try {
            // 1) Build a single prompt from system + conversation
            const messagesToSend: Message[] = [];
            messagesToSend.push({ role: 'system', content: systemPrompt });

            if (newMessages && newMessages.length > 0) {
                messagesToSend.push(...newMessages);
            } else {
                setStatusMsg('Error: No prompt detected. Please enter a question or message.');
                setIsLoading(false);
                return;
            }

            const promptText = messagesToSend
                .map(m => `[${m.role.toUpperCase()}]\n${m.content}`)
                .join('\n\n');

            // Create final prompt with context from both mdContent and currentDocument
            // Using a more explicit format that clearly identifies domain/context
            let finalPromptText = promptText;

            // Add context section with more explicit formatting
            if (mdContent?.trim() || currentDocument?.trim() || (includeDomainContext && domain?.presentation)) {
                // Add a distinctive marker that stands out to the AI
                finalPromptText += '\n\n=== DOMAIN AND CONTEXT INFORMATION ===\n';

                // Add domain presentation if checkbox is checked
                if (includeDomainContext && domain?.presentation) {
                    finalPromptText += `\n## DOMAIN PRESENTATION:\n${domain.presentation}\n\n`;
                }

                // Add current document if it exists with clear domain marker
                if (currentDocument?.trim()) {
                    if (docRefine) {
                        finalPromptText += `\nRefine and extend the following document:\n## EXISTING DOCUMENT:\n${currentDocument}\n\n`;
                    } else {
                        finalPromptText += `\n## EXISTING CONTEXT:\n${currentDocument}\n\n`;
                    }
                }

                // Add additional context if it exists
                if (mdContent?.trim()) {
                    finalPromptText += `\n## ADDITIONAL CONTEXT:\n${mdContent}\n\n`;
                }

                // Close context section with clear marker
                finalPromptText += '=== END OF DOMAIN AND CONTEXT ===\n\n';

                // Add explicit instruction to use the context
                finalPromptText += 'Please use the domain and context information provided above to inform your response.\n\n';
            }

            // Log the final prompt structure (truncated for readability)
            console.log('Final prompt structure:', {
                totalLength: finalPromptText.length,
                hasContext: finalPromptText.includes('DOMAIN AND CONTEXT'),
                messageSections: messagesToSend.length,
                preview: finalPromptText.substring(0, 200) + '...',
                contextIncluded: finalPromptText.includes(currentDocument?.substring(0, 20) || '') ||
                    finalPromptText.includes(mdContent?.substring(0, 20) || '')
            });

            console.log('Calling gateway helper with model:', selectedModel);

            const basePayload: any = {
                prompt: finalPromptText,
                model: mapModelId(selectedModel),
                // Add explicit flags to indicate context is provided
                hasContext: !!(mdContent?.trim() || currentDocument?.trim()),
                contextType: currentDocument?.trim() ? 'domain' : (mdContent?.trim() ? 'general' : 'none'),
            };

            // Check API availability before making the full request
            let healthCheckError: unknown = null;
            if (typeof window !== 'undefined' && typeof fetch === 'function') {
                const healthOptions: RequestInit = { method: 'HEAD' };
                let controller: AbortController | null = null;
                let timeoutId: ReturnType<typeof setTimeout> | null = null;

                if (typeof AbortController !== 'undefined') {
                    controller = new AbortController();
                    healthOptions.signal = controller.signal;
                    timeoutId = setTimeout(() => controller?.abort(), 2000);
                }

                try {
                    const testResponse = await fetch('/api/health-check', healthOptions);
                    if (!testResponse.ok) {
                        healthCheckError = new Error(`API health check failed with status: ${testResponse.status}`);
                    }
                } catch (err) {
                    healthCheckError = err;
                } finally {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                }
            }

            if (healthCheckError) {
                console.warn('API health check warning; continuing request:', healthCheckError);
                setStatusMsg('API health check warning; attempting request anyway.');
            }

            try {
                const storedMax = typeof window !== 'undefined' ? localStorage.getItem('aiDashboard_max_tokens') : null;
                const parsed = storedMax ? parseInt(storedMax, 10) : NaN;
                if (!Number.isNaN(parsed) && parsed > 0) {
                    basePayload.max_completion_tokens = parsed;
                }
            } catch { }

            try {
                const assistantText = await callGateway(basePayload);
                const finalText = assistantText && assistantText.trim().length > 0 ? assistantText : '[No content returned]';
                dispatch(addMessage({ role: 'assistant', content: finalText }));
            } catch (gatewayError) {
                console.error('Gateway API call failed:', gatewayError);

                // Provide more user-friendly error message
                const errorMessage =
                    `Unable to connect to AI service. This could be because:\n\n` +
                    `1. The API endpoint is unavailable\n` +
                    `2. Your request may have timed out\n` +
                    `3. The model "${selectedModel}" might be temporarily unavailable\n\n` +
                    `Technical details: ${gatewayError instanceof Error ? gatewayError.message : String(gatewayError)}`;

                dispatch(addMessage({
                    role: 'assistant',
                    content: errorMessage
                }));
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error sending message via gateway:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setStatusMsg(`Failed to communicate with AI ${selectedModel}: ${errorMessage}`);

            // Add error to chat as assistant message for better visibility
            dispatch(addMessage({
                role: 'assistant',
                content: `⚠️ Error: Failed to communicate with AI service. Please try again later or check your connection.\n\nDetails: ${errorMessage}`
            }));

            setIsLoading(false);
        } finally {
            retryInProgress.current = false;
        }
    }, [selectedModel, dispatch, systemPrompt, mdContent, currentDocument, docRefine, includeDomainContext, domain]);

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

    // Add handler to save message to library
    const handleSaveToLibrary = useCallback((content: string) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const newDocument = {
            id: `ai-response-${Date.now()}`,
            name: `AI Response ${timestamp}`,
            type: 'ai-response',
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        dispatch(saveMarkdownDocument(newDocument));
        setStatusMsg(`Saved to library as "${newDocument.name}"`);
        setTimeout(() => setStatusMsg(''), 3000);
    }, [dispatch]);

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

    // Function to open system prompt modal
    const handleSystemPromptClick = () => {
        setIsSystemPromptOpen(true);
    };

    // Debug logging for props on mount
    useEffect(() => {
        console.log('ChatComponent mounted with props:', {
            includeDomainContext,
            hasSetIncludeDomainContext: !!setIncludeDomainContext,
            domainPresentation: domain?.presentation?.substring(0, 50)
        });
    }, [includeDomainContext, setIncludeDomainContext, domain]);

    return (
        <div className={`flex flex-col  ${isMobile ? 'max-h-[calc(100vh-26rem)]' : 'max-h-[calc(100vh-7rem)]'} min-w-0 rounded-lg overflow-hidden relative border-l-4 border-r-4 border-orange-800/80`}>
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
                        className="flex-1 overflow-y-auto w-full min-w-0 message-container transform-gpu will-change-transform mb-4"
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
                                // >
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
                                                            onClick={() => handleSaveToLibrary(message.content)}
                                                            className="ms-2 text-xs text-green-400 hover:text-green-200 flex items-center gap-1"
                                                            title="Save to Library"
                                                        >
                                                            <BookmarkPlus className="h-4 w-4" />
                                                            Save
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
                                                    <button
                                                        onClick={() => handleSaveToLibrary(message.content)}
                                                        className="ms-2 text-xs text-green-400 hover:text-green-200 flex items-center gap-1"
                                                        title="Save to Library"
                                                    >
                                                        <BookmarkPlus className="h-4 w-4" />
                                                        Save
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

            {/* Input Area - Adjusted with more bottom margin/padding */}
            <div className="relative bottom-0 left-0 right-0 bg-popover pb-safe mt-1 rounded-lg z-10 mb-5">
                {/* Input area always at the bottom */}
                <div className={`${isMobile ? 'fixed bottom-5 left-0 right-0 px-2' : ''} bg-popover border-t border-gray-600 z-10`}>
                    {pathname.startsWith('/ai-chat') && (
                        <div className="flex items-center justify-between p-2 min-w-0">
                            {/* button row above the chat */}
                            <div className="flex items-center gap-2">
                                {/* <button
                                    type="button"
                                    onClick={handleAddMD}
                                    className={`p-2 flex items-center gap-2 hover:text-gray-300 ${mdContent ? 'text-green-500' : 'text-gray-500'}`}
                                    disabled={isLoading}
                                    title="Add a local file to be refined."
                                >
                                    <FileText className="w-5 h-5" /> {statusMsg.includes('Loaded') ? (mdContent ? 'File Loaded' : 'Load a file') : 'Load a file'}
                                </button> */}
                                <input
                                    ref={mdFileInputRef}
                                    type="file"
                                    accept=".md, .txt, .markdown, .docx"
                                    style={{ display: 'none' }}
                                    className="hidden"
                                    onChange={handleMDFileSelect}
                                />

                                {/* Include Domain Context checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    Context: 
                                    <input
                                        type="checkbox"
                                        checked={includeDomainContext}
                                        disabled={isLoading || !setIncludeDomainContext}
                                        onChange={(e) => {
                                            console.log('Checkbox onChange event:', {
                                                checked: e.target.checked,
                                                currentValue: includeDomainContext,
                                                hasSetFunction: !!setIncludeDomainContext
                                            });
                                            if (setIncludeDomainContext) {
                                                const newValue = e.target.checked;
                                                console.log('Calling setIncludeDomainContext with:', newValue);
                                                setIncludeDomainContext(newValue);
                                            } else {
                                                console.error('setIncludeDomainContext is not defined! Props:', {
                                                    includeDomainContext,
                                                    hasSetFunction: !!setIncludeDomainContext
                                                });
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                    <div className={`h-5 w-5 border ${includeDomainContext ? 'bg-green-500 border-green-600' : 'border-gray-600'} rounded flex items-center justify-center`}>
                                        {includeDomainContext && (
                                            <div className="h-2 w-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className={`text-gray-500 ${!setIncludeDomainContext ? 'opacity-50' : ''}`}>
                                        Include Domain {!setIncludeDomainContext && '(not wired)'}
                                    </span>
                                </label>

                                {/* Refine document checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={docRefine}
                                        disabled={!currentDocument || isLoading}
                                        onChange={() => {
                                            const newRefineState = !docRefine;
                                            setDocRefine(newRefineState);
                                        }}
                                        className="sr-only"
                                    />
                                    <div className={`h-5 w-5 border ${docRefine && currentDocument ? 'bg-blue-500 border-blue-600' : 'border-gray-600'} rounded flex items-center justify-center`}>
                                        {docRefine && currentDocument && (
                                            <div className="h-2 w-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-gray-500">{currentDocument ? "Refine current doc." : "No document"}</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Template selection */}
                                {currentDocument && docRefine && (
                                    <div className="flex items-center gap-2">
                                        <select
                                            title="Select a style for the document"
                                            className="bg-popover text-sm border border-gray-600 rounded px-2 py-1"
                                            onChange={(e) => {
                                                const selectedTemplate = refineTemplates[e.target.value as keyof typeof refineTemplates];
                                                if (selectedTemplate) {
                                                    setInput(selectedTemplate);
                                                }
                                            }}
                                            disabled={isLoading || !currentDocument}
                                        >
                                            <option value="">Select style...</option>
                                            {Object.keys(refineTemplates).map((key) => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {/* Template dropdown for prompt templates */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            ref={templateButtonRef}
                                            className="bg-popover text-xs border border-gray-600 rounded px-2 py-1 flex items-center gap-1 hover:bg-gray-700"
                                            onClick={(event) => {
                                                const dropdown = templateDropdownRef.current;
                                                const button = templateButtonRef.current;
                                                if (!dropdown || !button) return;

                                                setShowTemplateDropdown((prev) => {
                                                    const next = !prev;
                                                    if (next) {
                                                        const buttonRect = button.getBoundingClientRect();
                                                        const viewportHeight = window.innerHeight;
                                                        const spaceBelow = viewportHeight - buttonRect.bottom;
                                                        const spaceAbove = buttonRect.top;

                                                        if (spaceBelow < 300 && spaceAbove > 150) {
                                                            dropdown.style.bottom = 'calc(100% + 5px)';
                                                            dropdown.style.top = 'auto';
                                                            dropdown.style.maxHeight = `${spaceAbove - 20}px`;
                                                        } else {
                                                            dropdown.style.top = 'calc(100% + 5px)';
                                                            dropdown.style.bottom = 'auto';
                                                            dropdown.style.maxHeight = `${Math.max(150, spaceBelow - 20)}px`;
                                                        }

                                                        requestAnimationFrame(() => {
                                                            const dropdownRect = dropdown.getBoundingClientRect();
                                                            if (dropdownRect.top < 0) {
                                                                dropdown.style.top = '5px';
                                                                dropdown.style.bottom = 'auto';
                                                            }
                                                        });
                                                    }
                                                    return next;
                                                });
                                            }}
                                            title="Select a template"
                                        >
                                            <span>Prompt Templates</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div
                                            ref={templateDropdownRef}
                                            id="template-dropdown"
                                            className={`absolute right-0 z-50 mt-1 w-64 rounded border border-gray-600 bg-popover shadow-lg ${showTemplateDropdown ? '' : 'hidden'}`}
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
                                                            setShowTemplateDropdown(false);
                                                        }}
                                                    >
                                                        {template.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* {pathname === '/prompt-builder' &&
                        <div className="flex items-center justify-between p-2">

                            <div
                                className="flex items-center gap-2 px-3 cursor-pointer hover:bg-gray-700 rounded"
                                onClick={handleSystemPromptClick}
                                title="Click to view system prompt"
                            >
                                <span className="flex items-center gap-1 text-gray-400 text-xs">
                                    <span role="img" aria-label="robot" className="w-4 h-4">🤖</span>
                                </span>
                            </div>

                            <div className="flex items-center  gap-2">
                                <button
                                    type="button"
                                    className="bg-blue-700 text-gray-300 py-1 p-3 rounded hover:bg-blue-600"
                                    onClick={() => {
                                        setInput('Create a prompt with the following items: [Goal], [Context], [Role]')
                                    }}
                                >
                                    Create a enhanced prompt
                                </button>
                            </div>
                        </div>
                    } */}
                    {/* {pathname === '/domain-builder' &&
                        <div className="flex items-center justify-between p-2">

                            <button
                                type="button"
                                className="bg-blue-700 text-gray-300 py-1 p-3 ms-auto rounded hover:bg-blue-600"
                                onClick={() => {
                                    setDocRefine(true);
                                    setInput((currentDocument !== "")
                                        ? `
Please include [New items] in the existing domain definition below.
Don't ask clarifying questions or for additional context, just the updated definition.

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
                        </div>
                    } */}

                    <div className="flex items-center gap-2"></div>

                    {/* START FORM */}
                    <form onSubmit={handleSubmit} className="pt-1 px-2 pb-4 bg-popover rounded-lg min-w-0 w-full">
                        {/* Add placeholder jump buttons */}
                        {templatePlaceholders.length > 0 && (
                            <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                                <span className="text-sm text-gray-400">Click the button to jump to the placeholder ... </span>
                                {templatePlaceholders.map((placeholder, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
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
                                    const textarea = e.currentTarget as HTMLTextAreaElement & { lastEnterTime?: number };
                                    if (textarea.lastEnterTime && now - textarea.lastEnterTime < 2000) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                        textarea.lastEnterTime = 0;
                                    } else {
                                        textarea.lastEnterTime = now;
                                    }
                                }

                                if (e.key === 'Tab' && templatePlaceholders.length > 0) {
                                    e.preventDefault();
                                    const cursorPos = e.currentTarget.selectionStart;
                                    let nextPlaceholder = templatePlaceholders.find(p => p.start > cursorPos);
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
                                    selectedModel={selectedModel as "deepseek-chat" | "mistral" | "gpt-5" | "gpt-5-mini" | "dummy"}
                                    onModelChange={(newModel) => {
                                        setSelectedModel(newModel);
                                        localStorage.setItem('aiDashboard_selectedModel', newModel);
                                    }}
                                />
                                <TemperatureSelector />
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-gray-400">Max tokens:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={maxTokens}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value, 10);
                                            if (Number.isNaN(v)) {
                                                setMaxTokens('');
                                                localStorage.removeItem('aiDashboard_max_tokens');
                                            } else {
                                                setMaxTokens(v);
                                                localStorage.setItem('aiDashboard_max_tokens', String(v));
                                            }
                                        }}
                                        className="w-20 bg-popover border border-gray-600 rounded text-xs py-0 px-1"
                                        placeholder="auto"
                                        title="Max completion tokens for gateway models"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between px-2">
                                <button
                                    type="submit"
                                    className="flex items-center bg-gray-800 rounded-full px-2 mb-3 text-blue-300 hover:text-blue-800"
                                    disabled={isLoading || !input?.trim()}
                                    title="Send your question"
                                >
                                    Send
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
