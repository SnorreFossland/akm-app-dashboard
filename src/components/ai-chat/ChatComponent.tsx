'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux'; // Add this import
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle } from 'lucide-react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
// import DraggableDivider from '@/components/DraggableDivider';
// import SimpleDivider from '@/components/SimpleDivider';
// import styles from '@/components/SplitPanel.module.css';
import { PROMPT_TEMPLATES, PromptTemplate } from './promptTemplates';
import TextareaAutosize from 'react-textarea-autosize';
import DigitalRain from '@/components/DigitalRain';
import AnimatedAICircle from '../ui/AnimatedAICircle';
// Import mammoth.js for DOCX conversion
import * as mammoth from 'mammoth';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import ModelSelector from './ModelSelector';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
import { convertDocxToMarkdown } from '@/utils/DOCX-to-Markdown';
import DigitalRainIntro from './DigitalRainIntro';
import GettingStartedGuide from './GettingStartedGuide';
import { REFINE_TEMPLATES } from './refineTemplates'
import { error } from 'console';
// import { API_BASE_URL } from '@/config/apiConfig';

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatComponentProps {
    input: string;
    setInput: (input: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (content: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    chatInput?: string;
    onAddMD: () => void;
    mdContent: string;
    setMdContent: (content: string) => void;
    setCurrentMessages: (messages: any[]) => void;
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
    setShowLeftPanel,
    chatInput,
    onAddMD,
    mdContent,
    setMdContent,
    setCurrentMessages,
}: ChatComponentProps) {
    const dispatch = useDispatch();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputState, setInputState] = useState<string | undefined>(chatInput);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    const [temperature, setTemperature] = useState<number>(0.7); // Default value 0.7

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
    const [showGuideModal, setShowGuideModal] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    // Add right after your state definitions
    const [selectedRefineTemplate, setSelectedRefineTemplate] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Personal');
    const [selectedReportTemplate, setSelectedReportTemplate] = useState<string>('');
    const [previewMessageIndex, setPreviewMessageIndex] = useState<number | null>(null);

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

    const filteredTemplates = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.usage === selectedCategory);
    // Define templates for document refinement
    const refineTemplates = REFINE_TEMPLATES;

    // Define resetInactivityTimer BEFORE any useEffect that depends on it
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            setShowDigitalRain(true);
        }, 100000); // 10 seconds
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

    // useEffect(() => {
    //     if (resetTrigger > 0) {
    //         // Reset conversation state
    //         setMessages([]);
    //         // Reset any other related state
    //         setIsLoading(false);
    //         setErrorMsg(''); // Fix: use setErrorMsg instead of setError
    //         // You might want to clear the input as well
    //         setInput('');
    //     }
    // }, [resetTrigger]);

    // 2. Add a useEffect to set the initial height based on container size
    useEffect(() => {
        // This runs once after mount to set initial size
        if (containerRef.current) {
            const containerHeight = containerRef.current.offsetHeight;
            // Set initial top panel to fill most of the container (minus space for input)
            const initialTopHeight = Math.floor(containerHeight * 0.5);
            setTopHeight(initialTopHeight);
        }
    }, []); // Empty dependency array = runs once on mount

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
                // Only scroll if we actually have messages
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({
                        behavior: 'auto',
                        block: 'end',
                    });

                    // Also try direct parent scrolling
                    const parentElement = messagesEndRef.current?.parentElement;
                    if (parentElement) {
                        parentElement.scrollTop = parentElement.scrollHeight;
                    }

                    // Try scrolling the main container as well
                    const messageContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
                    if (messageContainer) {
                        (messageContainer as HTMLElement).scrollTop = (messageContainer as HTMLElement).scrollHeight;
                    }
                }, 200);
            }
        };

        // Only scroll if we have messages
        if (messages.length > 0) {
            scrollToBottom();
            const fallbackTimer = setTimeout(scrollToBottom, 500);
            return () => clearTimeout(fallbackTimer);
        }
        setCurrentMessages(messages);
    }, [messages, isLoading]);

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

        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
        };
    }, [resetInactivityTimer, showDigitalRain]);

    // Add this useEffect near your other useEffect hooks
    useEffect(() => {
        // Function to handle clicks outside dropdown
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

    useEffect(() => {
        // Load saved model preference from localStorage on component mount
        const savedModel = localStorage.getItem('aiDashboard_selectedModel');
        if (savedModel && savedModel !== selectedModel) {
            setSelectedModel(savedModel);
        }
    }, []);

    useEffect(() => {
        // Load saved temperature preference from localStorage
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
        setDocRefine(true);
    };

    const refinePrompt = (
        `Please revise the content below for clarity, style, and grammar.
Take into consideration the following changes or additions: [Please describe the changes you want in detail here].
Your task is to improve and refine the text, not to analyze it.
Do not use its contents as contextual input for other questions--I want it improved not analyzed:
`
    )

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

            setStatusMsg(`Loaded "${file.name}" for editing and refinement.`);
            setMdContent(content); // This will be shown in the preview
        } catch (err) {
            console.error(err);
            setStatusMsg(`Failed to load ${file.name}`);
        }

        e.target.value = '';
    };

    // Enhanced text extraction function with DOCX support
    const extractTextFromFile = async (file: File): Promise<string> => {
        const fileName = file.name;
        const fileType = fileName.split('.').pop()?.toLowerCase() || '';

        // For text-based files, use the native text() method
        if (['txt', 'md', 'js', 'ts', 'json', 'css', 'html', 'csv', 'docx'].includes(fileType)) {
            try {
                return await file.text();
            } catch (error) {
                console.error(`Error reading text from ${fileName}:`, error);
                return `[Failed to read text content from ${fileName}]`;
            }
        }

        // Handle DOCX files using mammoth.js
        if (fileType === 'docx') {
            try {
                setStatusMsg(`Converting DOCX file: ${fileName}...`);
                // Read file as ArrayBuffer
                const arrayBuffer = await file.arrayBuffer();
                // Use mammoth to extract text
                const result = await mammoth.extractRawText({ arrayBuffer });
                console.log(`Extracted ${result.value.length} characters from DOCX`);
                if (result.value.length > 0) {
                    return result.value;
                } else {
                    return `[DOCX file ${fileName} appears to be empty or could not be parsed]`;
                }
            } catch (error) {
                console.error(`Error extracting text from DOCX ${fileName}:`, error);
                return `[Failed to extract text from DOCX file: ${fileName}. Error: ${error instanceof Error ? error.message : String(error)}]`;
            }
        }

        // Handle PDF files using pdfjs-dist
        // if (fileType === 'pdf') {
        //     try {
        //         setErrorMsg(`Extracting PDF file: ${fileName}...`);
        //         const arrayBuffer = await file.arrayBuffer();
        //         const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        //         let extractedText = '';

        //         for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        //             const page = await pdf.getPage(pageNumber);
        //             const textContent = await page.getTextContent();
        //             const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
        //             extractedText += pageText + '\n\n';
        //         }

        //         if (extractedText.trim().length > 0) {
        //             return extractedText;
        //         } else {
        //             return `[PDF file ${fileName} appears to be empty or could not be parsed]`;
        //         }
        //     } catch (error) {
        //         console.error(`Error extracting text from PDF ${fileName}:`, error);
        //         return `[Failed to extract text from PDF file: ${fileName}. Error: ${error instanceof Error ? error.message : String(error)}]`;
        //     }
        // }
        // For other binary files, provide a more explicit message about limitations
        return `[File: ${fileName}
Type: ${fileType.toUpperCase()} (Binary file)
Size: ${(file.size / 1024).toFixed(1)} KB
"I'm sorry, but AI unable to directly access or analyze the content of ${fileName} as it is a binary file and content extraction is not supported in this environment."
"However, you can copy and paste the relevant text from the document into our conversation, or if you have specific questions about the topic."
`;
    };

    const handleSaveToLibrary = (content: string) => {
        // Extract title from first line of content
        const firstLine = content.split('\n')[0].replace(/^[#\-*>`_]+\s*/, '');
        const cleanTitle = firstLine.replace(/[#*]/g, '').trim().substring(0, 50); // Limit title length

        const documentTitle = cleanTitle || 'Untitled Document';

        // Save to Redux store
        dispatch(saveMarkdownDocument({
            id: Date.now().toString(),
            name: documentTitle,
            content: content,
            createdAt: new Date().toISOString()
        }));

        // Show confirmation to user
        setStatusMsg(`Saved "${documentTitle}" to library`);
        setTimeout(() => setStatusMsg(''), 30000);
    };

    // Add this function with your other handler functions
    const handleSaveToFile = (content: string) => {
        // Create a blob with the content
        const blob = new Blob([content], { type: 'text/markdown' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Extract title from first line for filename
        const firstLine = 'AIChat: ' + content.split('\n')[0].replace(/^[#\-*>`_]+\s*/, '');
        const cleanTitle = firstLine.replace(/[#*/\\:?<>|"]/g, '').trim().substring(0, 50); // Clean title for filename
        const fileName = `${cleanTitle || 'document'}.md`;

        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show confirmation
        setStatusMsg(`Saved "${fileName}" to downloads`);
        setTimeout(() => setStatusMsg(''), 30000);
    };

    // Handle file selection for context
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const selectedFiles = Array.from(files);
        setContextFiles(selectedFiles);
        setIsProcessingFile(true);
        setStatusMsg(`Processing ${selectedFiles.length} file(s)...`);

        try {
            // Process files one by one with status updates
            const fileContents = [];
            const binaryFiles = [];

            for (const file of selectedFiles) {
                setStatusMsg(`Reading ${file.name}...`);
                const fileType = file.name.split('.').pop()?.toLowerCase() || '';

                // Track binary files to show warning later
                if (!['txt', 'md', 'js', 'ts', 'json', 'css', 'html', 'csv', 'docx'].includes(fileType)) {
                    binaryFiles.push(file.name);
                }

                const text = await extractTextFromFile(file);
                console.log(`File processed: ${file.name}, size: ${text.length} chars`);

                fileContents.push(`
====================
DOCUMENT: ${file.name}
====================

${text}

====================
END OF DOCUMENT: ${file.name}
====================`);
            }

            const combinedContent = fileContents.join('\n\n');
            setContextContent(combinedContent);
            setIsContextAttached(true);
            console.log(`Total context size: ${combinedContent.length} chars`);

            // Show user feedback about attached files
            let message = `${selectedFiles.length} file(s) attached successfully. Total size: ${Math.round(combinedContent.length / 1024)}KB`;

            // Add warning about binary files if any were attached
            if (binaryFiles.length > 0) {
                message += `\n\n⚠️ WARNING: ${binaryFiles.length > 1 ? 'These files' : 'This file'} (${binaryFiles.join(', ')}) ${binaryFiles.length > 1 ? 'are' : 'is'} in binary format. The AI will see the filenames but CANNOT access their content.`;
                message += `\nTo get help with these files, you'll need to copy and paste the relevant text into the chat, or ask specific questions about the topic.`;
            }

            setStatusMsg(message);
            setTimeout(() => setStatusMsg(''), binaryFiles.length > 0 ? 100000 : 60000); // Show longer for binary files
        } catch (error) {
            console.error('Error processing files:', error);
            setStatusMsg(
                error instanceof Error
                    ? `Error processing files: ${error.message}`
                    : `Error processing files: ${String(error)}`
            );
        } finally {
            setIsProcessingFile(false);
        }
    };

    // Open file picker
    const handleAddContext = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Remove context
    const handleRemoveContext = () => {
        setContextFiles([]);
        setContextContent('');
        setIsContextAttached(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Function to send messages to the API
    const sendMessageToAPI = useCallback(async (newMessages: Message[]) => {
        setIsLoading(true);
        try {
            let messagesToSend = [...newMessages]; // this should be the last message + user message including context/content  

            if (contextContent && isContextAttached) { // if file is attached and context is extracted
                const systemMessage: Message = {
                    role: 'system',
                    content: `You are an AI assistant that has been provided with the following documents for reference. When answering the user's questions, ALWAYS analyze and refer to the content of these documents.`
                };
                const contextMessage: Message = {
                    role: 'system',
                    content: `# Context:\n Here are the documents you must reference:\n\n${contextContent}`
                };
                // Prepend both messages to ensure they're processed first
                messagesToSend = [systemMessage, contextMessage, ...messagesToSend];

                // Enhance the last user message to explicitly reference the files
                if (messagesToSend.length > 2) {
                    const lastUserIndex = messagesToSend.length - 1;
                    const lastMessage = messagesToSend[lastUserIndex];

                    if (lastMessage && lastMessage.role === 'user') {
                        const fileNames = contextFiles.map(file => file.name).join(', ');
                        messagesToSend[lastUserIndex] = {
                            ...lastMessage,
                            content: `${lastMessage.content}\n\nPlease analyze the attached documents (${fileNames}) and include specific information from them in your response.`
                        };
                    }
                }

            }

            console.log(`Sending context to the model (${contextContent.length} chars)`);
            console.log('First 200 chars of context:', contextContent.substring(0, 200));
            // Build the API request body
            const requestBody: any = {
                messages: messagesToSend,  // User message + context/content 
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

            // Add timeout handling with AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            let data;
            const contentType = response.headers.get('content-type');

            // Handle different response types
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Handle text response
                const textResponse = await response.text();
                try {
                    // Try to parse as JSON anyway in case Content-Type is incorrect
                    data = JSON.parse(textResponse);
                } catch (e) {
                    // If not valid JSON, create a data object with the text
                    data = { message: textResponse };
                }
            }

            if (!response.ok) {
                // Set error message if response fails
                setStatusMsg(data.error || 'An error occurred');
                console.error('API error response:', data);
            } else {
                // Clear any previous errors if successful
                setStatusMsg('');
                setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
            }
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
            setIsLoading(false);
            retryInProgress.current = false; // Reset retry flag when complete
        }
    }, [selectedModel, contextContent, isContextAttached, contextFiles]);

    // When selectedModel changes, retry sending the last non-retry user message
    useEffect(() => {
        // Skip on first render
        if (isInitialRender.current) {
            isInitialRender.current = false;
            previousModelRef.current = selectedModel;
            return;
        }

        // Only trigger if model changed and we have messages
        if (
            selectedModel &&
            previousModelRef.current !== selectedModel &&
            modelRetryCount < MAX_MODEL_RETRIES &&
            !retryInProgress.current &&
            messages.length > 0
        ) {
            // Find the last non-retry user message
            const lastUserMessage = messages.findLast(
                (m) => m.role === 'user' && !m.content.startsWith('Retry with model:')
            );

            if (lastUserMessage) {
                retryInProgress.current = true;
                const modelChangeMessage: Message = {
                    role: 'user',
                    content: `Retry with model: ${selectedModel} `,
                };
                setMessages((prev) => [...prev, modelChangeMessage]);
                setModelRetryCount((prev) => prev + 1);
                sendMessageToAPI([lastUserMessage, modelChangeMessage]).finally(() => {
                    retryInProgress.current = false;
                });
            }
        }

        // Update for next comparison
        previousModelRef.current = selectedModel;
    }, [selectedModel, sendMessageToAPI, modelRetryCount, messages, statusMsg]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        let userMessageContent = input;

        if (docRefine) {
            userMessageContent = `${userMessageContent} #Content:\n ${mdContent}`;
        } else {
            userMessageContent = `${userMessageContent} #Context:\n ${mdContent}`;
        }

        const userMessage: Message = { role: 'user', content: userMessageContent };

        if (mdContent) {
            setMessages((prev) => [...prev.slice(-1)]); // Keep only the last message
        } else if (contextContent && isContextAttached) {
            setMessages((prev) => [...prev.slice(-1)]); // Keep only the last message
        } else {
            setMessages((prev) => [...prev]);
        }
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
    const handleViewInMarkdown = (content: string, index: number) => {
        if (previewMessageIndex === index) {
            // Toggle off preview mode if clicking the same message
            setPreviewMessageIndex(null);
        } else {
            // Set this message to preview mode
            setPreviewMessageIndex(index);
        }
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
    // Add this retry function
    const handleRetry = useCallback(() => {
        // Create a "Continue" message
        const continueMessage: Message = { role: 'user', content: 'Continue' };

        // Keep existing messages and add the continue message
        const messagesForRetry = [...messages, continueMessage];

        setStatusMsg('Retrying request... please wait.');
        console.log('Retrying request with continue message');
        setIsLoading(true);
        retryInProgress.current = true;

        // Send the existing messages plus the continue message
        sendMessageToAPI(continueMessage)
            .catch(error => {
                console.error('Retry failed:', error);
                setStatusMsg(`Retry failed: ${error instanceof Error ? error.message : String(error)}`);
            });
    }, [messages, sendMessageToAPI]);

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

    return (
        <>
            <button
                onClick={() => setShowGuideModal(true)}
                className="absolute top-4 right-2 z-10 bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded-full p-2"
                title="Open getting started guide"
            >
                <HelpCircle className="h-5 w-5" />
            </button>
            <div ref={containerRef} className="flex flex-col min-h-0 h-[90%] rounded-lg sm:h-[90%] sm:min-w-[460px] overflow-hidden relative">
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
                    {/* (
                        messages.length === 0 && (
                            <div className="flex flex-col border border-gray-600 rounded-lg p-4 gap-2 text-gray-400 text-sm h-full items-center justify-start w-full bg-secondary/40 overflow-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">No messages yet. Start a conversation!</span>
                                </div>
                            </div>
                        )
                    )} */}

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
                                                        onClick={() => handleViewInMarkdown(message.content, index)}
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
                                    className="flex w-full p-1 px-4 whitespace-pre-wrap break-words break-all overflow-auto"
                                    style={{ overflowWrap: 'anywhere' }}
                                >
                                    {previewMessageIndex === index ? (
                                        <div className="prose prose-invert custom-markdown markdown-preview w-full">
                                            <MarkdownPreview mdPreview={message.content} />
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
                                                    onClick={() => handleViewInMarkdown(message.content, index)}
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
                <div className="relative bottom-0 left-0 right-0 bg-popover pb-safe">
                    <div className="flex items-center justify-between p-2">
                        {/* button row above the chat */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { handleAddMD(); }}
                                className="p-2 text-gray-500 hover:text-gray-300 flex items-center gap-2"
                                disabled={isLoading}
                                title="Add a local file to be refined."
                            >
                                <FileText className="w-5 h-5" /> {!docRefine ? (mdContent ? '' : 'Refine document') : ''}
                            </button>
                            <input
                                ref={mdFileInputRef}
                                type="file"
                                accept=".md, .txt, .markdown, .docx"
                                style={{ display: 'none' }}
                                className="hidden"
                                onChange={handleMDFileSelect}
                            />
                            {mdContent && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={docRefine && !!mdContent}
                                        disabled={!mdContent || isLoading}
                                        onChange={() => {
                                            if (!mdContent) {
                                                setDocRefine(false);
                                                setInput('');
                                            } else {
                                                const newRefineState = !docRefine;
                                                setDocRefine(newRefineState);
                                                // setInput(newRefineState ? refinePrompt : '');
                                            }
                                        }}
                                        className="sr-only" // Hide default checkbox but keep it accessible
                                    />
                                    <div className={`h-5 w-5 border ${docRefine && mdContent ? 'bg-blue-500 border-blue-600' : 'border-gray-600'} rounded flex items-center justify-center`}>
                                        {docRefine && mdContent && (
                                            <div className="h-2 w-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-gray-500">{mdContent ? "Refine document" : "No document in the left panel"}</span>
                                </label>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Template selection */}
                            {mdContent && docRefine &&
                                <div className="flex items-center gap-2">
                                    <select
                                        title="Select a style for the document"
                                        className="bg-popover text-sm border border-gray-600 rounded px-2 py-1"
                                        onChange={(e) => {
                                            const selectedTemplate = refineTemplates[e.target.value as keyof typeof refineTemplates];
                                            if (selectedTemplate) {
                                                setInput(selectedTemplate);
                                                setDocRefine(true);
                                            }
                                        }}
                                        disabled={isLoading || !mdContent}
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
                                            className="bg-popover text-xs border border-gray-600 rounded px-2 py-1 flex items-center gap-1 hover:bg-gray-700"
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
                                            <span>Templates</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div
                                            id="template-dropdown"
                                            className="absolute z-50 mt-1 hidden bg-popover border border-gray-600 rounded shadow-lg w-64 right-0"
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
                                                {filteredTemplates.map((template) => (
                                                    <button
                                                        key={template.title}
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
                        placeholder="Ask anything …"
                        className="w-full px-1 bg-popover border border-gray-600 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minRows={6}
                        maxRows={12}
                        disabled={isLoading}
                    />
                    <div className="flex justify-between">
                        <div className="flex items-center gap-2 justify-end">
                            {/* Context file input */}
                            <button
                                type="button"
                                onClick={handleAddContext}
                                className="text-gray-500 hover:text-gray-300"
                                disabled={isLoading || isProcessingFile}
                                title="Add context from file"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".txt,.md,.json,.csv,.js,.ts,.html,.css,.docx"
                                ref={fileInputRef}
                            />
                            {/* Context files indicator with enhanced info */}
                            {isContextAttached && contextFiles.length > 0 && (
                                <div className="flex flex-col px-3 py-2 bg-blue-900/20 text-xs border-t border-blue-800">
                                    <div className="flex items-center gap-2">
                                        {/* <Paperclip className="w-3 h-3" /> */}
                                        <span>
                                            {contextFiles.length} file{contextFiles.length !== 1 ? 's' : ''} attached as context:
                                            <span className="font-mono ml-1">
                                                {contextFiles.map((file, idx) => {
                                                    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
                                                    const isTextFile = ['txt', 'md', 'js', 'ts', 'html', 'csv', 'docx'].includes(fileType);
                                                    return (
                                                        <span key={file.name} className={isTextFile ? "" : "text-yellow-400"}>
                                                            {file.name}{!isTextFile && " (⚠️ limited)"}{idx < contextFiles.length - 1 ? ", " : ""}
                                                        </span>
                                                    );
                                                })}
                                                ({Math.round(contextContent.length / 1024)}KB)
                                            </span>
                                        </span>
                                        <button
                                            onClick={handleRemoveContext}
                                            className="ml-auto text-gray-400 hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {/* Add guidance about binary files if any are attached */}
                                    {contextFiles.some(file => {
                                        const fileType = file.name.split('.').pop()?.toLowerCase() || '';
                                        return !['txt', 'md', 'js', 'ts', 'html', 'csv', 'docx'].includes(fileType);
                                    }) && (
                                            <div className="mt-1 text-yellow-300 text-[10px]">
                                                ⚠️ IMPORTANT: Binary files (like PDF) cannot be read by the AI.
                                                <button
                                                    className="ml-1 underline hover:text-white"
                                                    onClick={() => {
                                                        const binaryFiles = contextFiles
                                                            .filter(f => {
                                                                const fileType = f.name.split('.').pop()?.toLowerCase() || '';
                                                                return !['txt', 'md', 'js', 'ts', 'html', 'csv', 'docx'].includes(fileType);
                                                            })
                                                            .map(f => f.name)
                                                            .join(", ");
                                                        setInput(`${input}\n\nI've attached ${binaryFiles}, but I understand you can't access its content directly. Here's a summary of what it contains: [Add or paste your summary here]`);
                                                        setTimeout(() => {
                                                            if (textareaRef.current) {
                                                                textareaRef.current.focus();
                                                            }
                                                        }, 100);
                                                    }}
                                                >
                                                    Open the document and copy all text and Add the text to explain file
                                                </button>
                                            </div>
                                        )}
                                </div>
                            )}

                        </div>
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
                    </div>
                </form>
                {/* Add the modal at the end of the component */}
                <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
                    <GettingStartedGuide />
                </Modal>
            </div >
        </>
    )
}
