'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DraggableDivider from '@/components/DraggableDivider';
import SimpleDivider from '@/components/SimpleDivider';
import styles from '@/components/SplitPanel.module.css';
import TextareaAutosize from 'react-textarea-autosize';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatComponentProps {
    selectedModel: string;
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    chatInput?: string;
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
    onResponseChange,
    onViewInMarkdown,
}: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState<string | undefined>(chatInput);
    const [modelRetryCount, setModelRetryCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState(''); // <-- error state
    const [topPanelHeight, setTopPanelHeight] = useState(200); // <-- height of the top panel
    const [topHeight, setTopHeight] = useState<number>(() =>
        typeof window !== 'undefined' ? window.innerHeight - 430 : 850
    );
    const minSize = 30; // Minimum size for the top panel
    const maxSize = 80; // Maximum size for the top panel

    // Use a ref to prevent multiple concurrent retries
    const retryInProgress = useRef(false);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        // Only trigger if selectedModel is defined, we haven't exceeded our retry limit,
        // and no retry is already in progress.
        if (selectedModel && modelRetryCount < MAX_MODEL_RETRIES && !retryInProgress.current) {
            // Find the last non-retry user message.
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
    }, [selectedModel, sendMessageToAPI, modelRetryCount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput(''); // Clear the input field after submission
        onResponseChange(''); // Clear parent state if needed
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
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-card-foreground overflow-hidden">
            {errorMsg && (
                <div className="p-2 mb-4 bg-gray-600 text-white rounded">
                    {errorMsg}
                </div>
            )}
            <div className="flex flex-col bg-background h-full">
                <div
                    className="bg-transparent overflow-auto"
                    style={{ height: `${topHeight}px` }}
                >
                    {/* <div className="p-4"> */}
                    <div className="flex-1 overflow-auto mb-4 p-4 rounded-lg w-full ">
                        {messages.map((message, index) => (
                            <div key={index} className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${message.role === 'user'
                                ? 'bg-card ml-auto max-w-[80%] text-card-foreground flex-col border-blue-800'
                                : 'bg-background mr-auto max-w-[100%] text-card-foreground flex-col border-4 border-secondary'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3 ps-1 w-full">
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
                                    <div className="text-xs text-gray-400 ">
                                        {message.role === 'user' ? 'You' : `Assistant (${selectedModel})`}
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto rounded-md p-2">
                                        <button
                                            onClick={() => handleCopyMessage(message.content, index)}
                                            className="text-sm text-gray-400 hover:text-gray-200"
                                        >
                                            {copiedIndex === index ? 'Copied!' : 'Copy'}
                                        </button>
                                        {message.role === 'assistant' && (
                                            <button
                                                onClick={() => {
                                                    handleViewInMarkdown(message.content);
                                                }}
                                                className="text-sm ms-4 text-blue-400 hover:text-blue-200 flex items-center gap-1"
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
                                <div className="flex-1 w-full p-1 whitespace-pre-wrap break-words overflow-auto">
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div>
                                {isLoading ? <p>Thinking...</p> : null}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <SimpleDivider
                    currentSize={topHeight}
                    onResize={setTopHeight}
                />
                <div className="flex-1 bg-transparent rounded-md overflow-auto">
                    {/* <div className="p-4"> */}
                    <div className="relative flex-1 rounded-md overflow-auto h-full">
                        {/* <div className="relative bottom-0 top-10 p-4 bg-blue-900 h-full"> */}
                        <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-transparent h-full">
                            <TextareaAutosize
                                value={input || ''}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 p-2 border border-gray-600 rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 "
                                minRows={12}
                                maxRows={30}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400"
                                disabled={isLoading || !input?.trim()}
                            >
                                Send
                            </button>
                        </form>
                        {/* </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}
