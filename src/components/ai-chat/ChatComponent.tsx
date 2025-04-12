'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

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
        <div className="flex flex-col flex-1 overflow-hidden">
            {errorMsg && (
                <div className="p-2 mb-4 bg-red-600 text-white rounded">
                    {errorMsg}
                </div>
            )}
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-700 rounded-md p-4 bg-gray-900 w-full">
                {messages.map((message, index) => (
                    <div key={index} className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${message.role === 'user'
                        ? 'bg-blue-900 ml-auto max-w-[80%] text-blue-100 flex-col border-blue-800'
                        : 'bg-gray-800 mr-auto max-w-[100%] text-gray-100 flex-col border-b-8 border-gray-200'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2 w-full">
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
                            <div className="text-xs text-gray-400">
                                {message.role === 'user' ? 'You' : `Assistant (${selectedModel})`}
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => handleCopyMessage(message.content, index)}
                                    className="text-sm text-gray-400 hover:text-gray-200"
                                >
                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                </button>
                                {message.role === 'assistant' && (
                                    <button
                                        onClick={() => handleViewInMarkdown(message.content)}
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
                        <div className="flex-1 w-full text-gray-100 whitespace-pre-wrap break-words">
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div>
                        {isLoading ? <p>Thinking...</p> : /* render messages */ null}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                    value={input || ''}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={input?.trim() ? Math.min(5, input.split('\n').length + 5) : 2}
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
        </div>
    );
}
