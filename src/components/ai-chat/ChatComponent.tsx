'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DraggableDivider from '@/components/DraggableDivider';
import SimpleDivider from '@/components/SimpleDivider';
import styles from '@/components/SplitPanel.module.css';
import TextareaAutosize from 'react-textarea-autosize';
import DigitalRain from '@/components/DigitalRain';
import AnimatedAICircle from '../ui/AnimatedAICircle';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatComponentProps {
    selectedModel: string;
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    resetTrigger: number; // Added resetTrigger prop
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
    chatInput,
    input,
    setInput,
    onResponseChange,
    onViewInMarkdown,
    setShowLeftPanel,
    resetTrigger, // Add this prop to the destructured list
}: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputState, setInputState] = useState<string | undefined>(chatInput);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState(''); // <-- error state

    const [topHeight, setTopHeight] = useState<number>(800); // 

    const [showDigitalRain, setShowDigitalRain] = useState(false);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const retryInProgress = useRef(false);

    const isInitialRender = useRef(true);
    const previousModelRef = useRef<string | null>(null);

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

    // Add this effect to adjust topHeight based on input size
    useEffect(() => {
        if (!textareaRef.current || !containerRef.current) return;

        // Get current heights
        const containerHeight = containerRef.current.offsetHeight;
        const textareaHeight = textareaRef.current.scrollHeight;

        // Define minimum space to keep for messages (adjust as needed)
        const minMessagesSpace = 700;

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

    useEffect(() => {
        if (resetTrigger > 0) {
            // Reset conversation state
            setMessages([]);
            // Reset any other related state
            setIsLoading(false);
            setErrorMsg(''); // Fix: use setErrorMsg instead of setError
            // You might want to clear the input as well
            setInput('');
        }
    }, [resetTrigger]);

    // 2. Add a useEffect to set the initial height based on container size
    useEffect(() => {
        // This runs once after mount to set initial size
        if (containerRef.current) {
            const containerHeight = containerRef.current.offsetHeight;
            // Set initial top panel to fill most of the container (minus space for input)
            const initialTopHeight = Math.floor(containerHeight * 0.7);
            setTopHeight(initialTopHeight);
        }
    }, []); // Empty dependency array = runs once on mount

    useEffect(() => {
        const handleResize = () => {
            const container = containerRef.current;
            const containerHeight = container ? container.offsetHeight : window.innerHeight;
            const minInputHeight = 160;
            const maxTopHeight = containerHeight - minInputHeight;
            console.log('108 Container Height:', containerHeight, 'Top Height:', topHeight, 'Max Top Height:', maxTopHeight);
            if (topHeight > maxTopHeight) {
                setTopHeight(maxTopHeight);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [topHeight]);

    // Auto-scroll to the end of last message when messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end', // <-- Use 'end' to scroll to the bottom
            });
        }
    }, [messages]);

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

    // Function to send messages to the API
    const sendMessageToAPI = useCallback(async (newMessages: Message[]) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, model: selectedModel }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Set error message if response fails
                setErrorMsg(data.error || 'An error occurred');
            } else {
                // Clear any previous errors if successful
                setErrorMsg('');
                setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
            }
        } catch (error) {
            console.error('Error:', error);
            setErrorMsg('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedModel]);

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
                    content: `Retry with model: ${selectedModel}`,
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

        const userMessage: Message = { role: 'user', content: input };
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

    return (
        <div ref={containerRef} className="mb-4 p-4 rounded-lg w-full h-full bg-background">
            <div className="flex flex-col bg-background rounded-m overflow-y-auto h-full"
                style={{ height: `${topHeight}px` }}>
                {messages.length < 1 ? (
                    <div className="bg-transparent overflow-auto relative h-full">
                        {/* Digital Rain overlay */}
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
                                    <div className="relative flex flex-col justify-center items-center bg-transparent px-6 py-3 rounded-lg">
                                        <AnimatedAICircle className="absolute inset-0 z-0" />
                                    </div>
                                </div>
                                <div className="z-20 m-5 text-green-400 text-xl font-mono text-center">
                                    Click to start typing...
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center bg-transparent px-6 py-3 rounded-lg">
                                <div className="flex items-top">
                                    <div className="relative w-[30%] bg-transparent px-6 py-3 rounded-lg">
                                        <div className="text-gray-500 text-lg font-mono">
                                            <p className="mb-2">Getting started! In the left pane follow these steps:</p>
                                            <ol className="list-decimal list-inside">
                                                <li>Click on the left pane to open the prompt template.</li>
                                                <li>Describe your topic in the top left area in the pane.</li>
                                                <li>Select a prompt template to make a report on your topic.</li>
                                                <li>Make changes to the report and click on the Right arrow to insert it into the chat.</li>
                                                <li>Click on the up arrow to ask the AI.</li>
                                                <li>Click on Preview to see the markdown preview.</li>
                                            </ol>
                                        </div>
                                    </div>
                                    <div className="flex-1 items-center justify-center w-[40%]">
                                        <div className="mt-100 z-10 text-green-400 text-xl font-mono text-center">
                                                <p>Getting started!</p> <br />
                                            Select a prompt template or start typing below ...
                                        </div>
                                        <div className="flex flex-col justify-center items-center bg-transparent px-6 py-3 rounded-lg">
                                            <AnimatedAICircle className="inset-0 z-0" />
                                        </div>
                                    </div>
                                    <div className="text-gray-400 text-lg font-mono text-right w-[30%]">
                                        Getting started! Describe your topic in the top left area.
                                        Click to start typing...
                                    </div>
                                </div>
                            </div>
                        )
                        }
                    </div>
                ) : <>{messages.length} messages</>}
                <div className="flex-1 mb-4 p-4 rounded-lg w-full bg-background">
                    {messages.map((message, index) => (
                        <div key={index}
                            ref={index === messages.length - 1 ? messagesEndRef : undefined}
                            className={`mb-4 p-3 rounded-lg flex flex-col gap-2 ${message.role === 'user'
                                ? 'bg-card ml-auto max-w-[80%] text-card-foreground flex-col border border-blue-800'
                                : 'bg-background mr-auto w-full text-card-foreground flex-col border-4 border-secondary'
                                }`}
                        >
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
                                <div className="text-xs text-gray-400 me-auto">
                                    {message.role === 'user' ? 'You' : `Assistant (${selectedModel})`}
                                </div>
                            </div>
                            <div className="flex-1 w-full p-1 whitespace-pre-wrap break-words overflow-auto">
                                {message.content}
                            </div>
                            <div className="flex items-center gap-2 mt-2 ml-auto rounded-md p-2">
                                <button
                                    onClick={() => handleCopyMessage(message.content, index)}
                                    className="text-xs text-gray-400 hover:text-gray-200"
                                >
                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                </button>
                                {message.role === 'assistant' && (
                                    <button
                                        onClick={() => {
                                            handleViewInMarkdown(message.content);
                                        }}
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


                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    {isLoading && (
                        <div>
                            {isLoading ? <p>Thinking...</p> : null}
                        </div>
                    )}
                </div>
            </div>
            {/* <SimpleDivider
                currentSize={topHeight}
                onResize={(newHeight) => setTopHeight(Math.max(40, newHeight))}
            /> */}
            <div className="mb-4 p- rounded-lg w-full bg-background">
                <form onSubmit={handleSubmit} className="flex gap-2 p-2 bg-transparent h-auto">
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
                        placeholder="Ask anything ..."
                        className="flex-1 p-2 border border-gray-600 rounded-md text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minRows={7}  // Reduced from 7 to give more space initially
                        maxRows={12}
                        disabled={isLoading}
                    />
                    {/* Send button */}
                    <button 
                        type="submit"
                        className="bg-blue-600 text-gray-100 p-2 rounded-full hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400"
                        disabled={isLoading || !input?.trim()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        {/* <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                            <circle cx="9" cy="10" r="1" fill="currentColor" />
                            <circle cx="15" cy="10" r="1" fill="currentColor" />
                            <path d="M8 16h8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg> */}
                    </button>
                </form>
            </div>
        </div>
    )
}
