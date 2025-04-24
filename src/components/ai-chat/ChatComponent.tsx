'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DraggableDivider from '@/components/DraggableDivider';
import SimpleDivider from '@/components/SimpleDivider';
import styles from '@/components/SplitPanel.module.css';
import TextareaAutosize from 'react-textarea-autosize';
import DigitalRain from '@/components/DigitalRain';
import AnimatedAICircle from '../ui/AnimatedAICircle';
import { Plus, Paperclip, X, FileText, Info } from 'lucide-react';  // add Info
// Import mammoth.js for DOCX conversion
import * as mammoth from 'mammoth';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import ModelSelector from './ModelSelector';

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatComponentProps {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    error?: string; // Optional error prop
    chatInput?: string;
    input: string;
    setInput: (input: string) => void;
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
    selectedModel,
    setSelectedModel,
    chatInput,
    input,
    setInput,
    onResponseChange,
    onViewInMarkdown,
    setShowLeftPanel,
}: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputState, setInputState] = useState<string | undefined>(chatInput);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state

    const [topHeight, setTopHeight] = useState<number>(600); // 

    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const retryInProgress = useRef(false);

    const isInitialRender = useRef(true);
    const previousModelRef = useRef<string | null>(null);
    const mdFileInputRef = useRef<HTMLInputElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);



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
    // Set the worker source for pdfjs

    // open md picker
    const handleAddMD = () => {
        mdFileInputRef.current?.click();
    };

    // load .md file into input
    const handleMDFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setInput(
                `Please revise the content below for clarity, style, and grammar.
Take into consideration the following changes or additions : [Please describe the changes want in detail here].

Do not use its contents as contextual input for other questions--I want it improved not analyzed:
# Content:

 ${text}
 
 # End of Content
 `);
            setStatusMsg(`Loaded "${file.name}" for editing and refinement.`);
        } catch (err) {
            console.error(err);
            setStatusMsg(`Failed to load ${file.name}`);
        }
        e.target.value = '';
    };

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

    // Scroll to bottom whenever messages change or loading completes
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                // Use a longer timeout to ensure DOM has fully updated
                setTimeout(() => {
                    // Try multiple approaches to ensure scrolling works
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

        scrollToBottom();

        // Also scroll after a longer delay as a fallback
        const fallbackTimer = setTimeout(scrollToBottom, 500);

        return () => clearTimeout(fallbackTimer);
    }, [messages, isLoading]);

    useEffect(() => {
        const lastAssistant = messages.findLast((m) => m.role === 'assistant');
        if (lastAssistant) {
            onResponseChange(lastAssistant.content);
        }
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

    // Context file state
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [contextContent, setContextContent] = useState<string>('');
    const [isContextAttached, setIsContextAttached] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    // Enhanced text extraction function with DOCX support
    const extractTextFromFile = async (file: File): Promise<string> => {
        const fileName = file.name;
        const fileType = fileName.split('.').pop()?.toLowerCase() || '';

        // For text-based files, use the native text() method
        if (['txt', 'md', 'js', 'ts', 'json', 'css', 'html', 'csv'].includes(fileType)) {
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
                setErrorMsg(`Converting DOCX file: ${fileName}...`);
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

IMPORTANT NOTE FOR AI: This is a binary file and its contents CANNOT be directly accessed or analyzed. 
When users upload binary files like PDF, you MUST explicitly inform them that:
"I'm sorry, but I'm unable to directly access or analyze the content of ${fileName} as it is a binary file and content extraction is not supported in this environment."

Then offer to help them if they provide the text in another way:
"However, I can help if you copy and paste the relevant text from the document into our conversation, or if you have specific questions about the topic."

UNDER NO CIRCUMSTANCES should you pretend to have read or analyzed the contents of this binary file.

File type: ${fileType.toUpperCase()} 
File size: ${(file.size / 1024).toFixed(1)} KB
Last modified: ${new Date(file.lastModified).toLocaleString()}]`;
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
                if (!['txt', 'md', 'js', 'ts', 'json', 'css', 'html', 'csv'].includes(fileType)) {
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
            setTimeout(() => setStatusMsg(''), binaryFiles.length > 0 ? 10000 : 6000); // Show longer for binary files
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
            // We'll use a different approach - including content directly in messages
            let messagesToSend = [...newMessages];

            if (contextContent && isContextAttached) {
                // Add a system message at the beginning with clear instructions
                const systemMessage: Message = {
                    role: 'system',
                    content: `You are an AI assistant that has been provided with the following documents for reference. When answering the user's questions, ALWAYS analyze and refer to the content of these documents.`
                };

                // Add context as a separate system message to ensure it's seen
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

                console.log(`Sending context to the model (${contextContent.length} chars)`);
                console.log('First 200 chars of context:', contextContent.substring(0, 200));
            }

            // Build the API request body
            const requestBody: any = {
                messages: messagesToSend,
                model: selectedModel
            };

            // Log what we're sending (for debugging)
            console.log('Sending to API:', {
                model: selectedModel,
                messagesCount: messagesToSend.length,
                hasContext: Boolean(contextContent && isContextAttached),
                messagePreview: JSON.stringify(messagesToSend.slice(0, 2))
            });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            // Check if the response is valid JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response but got ${contentType} `);
            }

            const data = await response.json();
            if (!response.ok) {
                // Set error message if response fails
                setErrorMsg(data.error || 'An error occurred');
                console.error('API error response:', data);
            } else {
                // Clear any previous errors if successful
                setErrorMsg('');
                setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setErrorMsg(`Failed to communicate with AI: ${error instanceof Error ? error.message : String(error)} `);
        } finally {
            setIsLoading(false);
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
    }, [selectedModel, sendMessageToAPI, modelRetryCount, messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        let userMessageContent = input;
        if (isContextAttached && contextFiles.length > 0) {
            const fileNames = contextFiles.map(file => file.name).join(', ');
            // Make the message more explicit
            userMessageContent = `${input}`;
            // Note: We're not adding the reference here, as we'll do it in sendMessageToAPI
        }

        const userMessage: Message = { role: 'user', content: userMessageContent };
        setMessages((prev) => [...prev, userMessage]);
        setInput(''); // Clear the input field after submission
        onResponseChange(''); // Clear parent state if needed
        setShowDigitalRain(false); // Turn OFF digital rain when sending a message
        await sendMessageToAPI([...messages, userMessage]);
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

    const handleViewInMarkdown = (content: string) => {
        if (onViewInMarkdown) {
            onViewInMarkdown(content);
            setShowLeftPanel(false);
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

    return (
        // Changed overflow-auto to overflow-hidden on the main container
        <div ref={containerRef} className="flex flex-col min-h-0 h-[90%] rounded-lg sm:h-[90%] sm:min-w-[460px] overflow-hidden relative">
            {/* Rest of your component remains the same */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-[150px]" id="message-container">
                {/* style={{ height: `${ topHeight } px` }}> this is for draggable bar*/}
                {messages.length < 1 ? (
                    <div className="flex flex-col items-center justify-center w-full py-6 overflow-auto">
                        {showDigitalRain ? (
                            <div className=" ">
                                <div className="absolute inset-0 z-20">
                                    <DigitalRain
                                        onInteraction={() => setShowDigitalRain(false)}
                                        speed={4}
                                        backgroundColor="rgba(10, 20, 10, 0.03)"
                                    />
                                </div>
                                <div className="absolute inset-0 z-20 flex items-center justify-center">
                                    <div className="relative flex flex-col justify-center items-center bg-transparent px-6 py-3 rounded-lg min-h-0">
                                        <AnimatedAICircle className="absolute inset-0 z-0" />
                                    </div>
                                </div>
                                <div className="z-20 m-5 text-green-400 text-xl font-mono text-center">
                                    Click to start typing...
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 text-primary overflow-auto min-h-0">
                                <div className="flex flex-col items-center justify-center w-full py-6 min-h-0">
                                    <div className="text-green-400 text-xl font-mono text-center mb-4">
                                        <p>Getting started by asking your question below!</p>
                                    </div>
                                    <div className="w-full max-w-md">
                                        <p className="mb-2 text-center">You can also use Prompt templates in the left pane.</p>
                                        <p className="mb-2 text-center">Follow these steps:</p>
                                        <ol className="text-sm list-decimal list-inside overflow-auto text-left">
                                            <li>Open the left pane Click on the &quot;Left pane&quot; button upper left .</li>
                                            <li>Describe your topic in the top left area in the pane.</li>
                                            <li>Select a prompt template to make a report/doc on your topic.</li>
                                            <li>Edit the prompt and click on the Right arrow to insert it into the chat.</li>
                                            <li>Click on the up arrow to ask the AI.</li>
                                            <li>Click on Preview to see the result in right panel as markdown preview.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
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
                                    {message.role === 'user' ? 'You' : `Assistant(${selectedModel})`}
                                </div>

                                <button
                                    onClick={() => handleCopyMessage(message.content, index)}
                                    className="text-xs text-gray-400 hover:text-gray-200"
                                >
                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                </button>
                                {message.role === 'assistant' && (
                                    <button
                                        onClick={() => handleViewInMarkdown(message.content)}
                                        className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                    >
                                        Markdown Preview
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            className="inline-block"
                                        >
                                            <path d="M17 7l-9.9 9.9" strokeWidth="2" strokeLinecap="round" />
                                            <path
                                                d="M8 7h9v9"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* message content */}
                            <div
                                className="flex w-full p-1 px-4 whitespace-pre-wrap break-words break-all overflow-auto"
                                style={{ overflowWrap: 'anywhere' }}
                            >
                                {message.content}
                            </div>

                            {/*  bottom buttons */}
                            {message.role === 'assistant' && (
                                <div className="flex items-center gap-2 mt-2 ml-auto rounded-md p-2">
                                    <button
                                        onClick={() => handleCopyMessage(message.content, index)}
                                        className="text-xs text-gray-400 hover:text-gray-200"
                                    >
                                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                                    </button>
                                    {message.role === 'assistant' && (
                                        <button
                                            onClick={() => handleViewInMarkdown(message.content)}
                                            className="text-xs ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                        >
                                            Markdown Preview
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                className="inline-block"
                                            >
                                                <path d="M17 7l-9.9 9.9" strokeWidth="2" strokeLinecap="round" />
                                                <path
                                                    d="M8 7h9v9"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
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
            {statusMsg && (
                <div className="flex items-center bg-blue-400/20 border-blue-700 text-blue-500 px-4 py-2 mb-2 rounded-md text-sm">
                    <Info className="w-4 h-4 mr-2" />     {/* icon in front */}
                    <span>{statusMsg}</span>
                </div>
            )}

            {/* Input area always at the bottom */}
            <div className="relative bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 border-t border-gray-800 z-20 pb-safe">

                <button
                    type="button"
                    onClick={handleAddMD}
                    className="p-2 text-gray-500 hover:text-gray-300"
                    disabled={isLoading}
                    title="Let AI Load Markdown"
                >
                    <FileText className="w-5 h-5" />
                </button>
                <input
                    ref={mdFileInputRef}
                    type="file"
                    accept=".md"
                    className="hidden"
                    onChange={handleMDFileSelect}
                />

                {/* START FORM */}
                <form onSubmit={handleSubmit} className="px-2 bg-transparent rounded-lg">
                    <TextareaAutosize
                        ref={textareaRef}
                        value={input || ''}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const now = Date.now();
                                // Use a custom property on the event target to track the last Enter key time
                                const textarea = e.currentTarget as HTMLTextAreaElement & { lastEnterTime?: number };
                                if (textarea.lastEnterTime && now - textarea.lastEnterTime < 2000) {
                                    // If two returns occur within 2 seconds, submit the form
                                    handleSubmit(e);
                                    textarea.lastEnterTime = 0;
                                } else {
                                    textarea.lastEnterTime = now;
                                }
                            }
                        }}
                        placeholder="Ask anything …"
                        className="w-full px-1 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                title="Add context from files"
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
                                                    const isTextFile = ['txt', 'md', 'js', 'ts', 'html', 'csv'].includes(fileType);
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
                                        return !['txt', 'md', 'js', 'ts', 'html', 'csv'].includes(fileType);
                                    }) && (
                                            <div className="mt-1 text-yellow-300 text-[10px]">
                                                ⚠️ IMPORTANT: Binary files (like PDF) cannot be read by the AI.
                                                <button
                                                    className="ml-1 underline hover:text-white"
                                                    onClick={() => {
                                                        const binaryFiles = contextFiles
                                                            .filter(f => {
                                                                const fileType = f.name.split('.').pop()?.toLowerCase() || '';
                                                                return !['txt', 'md', 'js', 'ts', 'html', 'csv'].includes(fileType);
                                                                // return !['txt', 'md', 'js', 'ts', 'json', 'css', 'html', 'csv'].includes(fileType);
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
                                }}
                            />
                        </div>

                        {/* now include the send‐button here */}
                        <div className="flex justify-between px-2 ">
                            <div className="flex items-center gap-2 justify-end">
                                {/* …context buttons… */}
                            </div>
                            <button
                                type="submit"
                                className="p-2 text-blue-200 hover:text-blue-800"
                                disabled={isLoading || !input?.trim()}
                                title="Send"
                            >
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
    )
}
