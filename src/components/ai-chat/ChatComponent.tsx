'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatComponentProps {
    selectedModel: string;
    onResponseChange?: (response: string) => void;
    onViewInMarkdown?: (response: string) => void; // Add this prop for the button
}

export default function ChatComponent({
    selectedModel,
    onResponseChange,
    onViewInMarkdown
}: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Notify parent component about the last response
    useEffect(() => {
        const lastMessage = messages.findLast(m => m.role === 'assistant');
        if (lastMessage && onResponseChange) {
            onResponseChange(lastMessage.content);
        }
    }, [messages, onResponseChange]);

    const handleCopyMessage = (content: string, index: number) => {
        navigator.clipboard.writeText(content)
            .then(() => {
                setCopiedIndex(index);
                setTimeout(() => setCopiedIndex(null), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    // Function to handle "View in Markdown" button click
    const handleViewInMarkdown = (content: string) => {
        if (onViewInMarkdown) {
            onViewInMarkdown(content);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('60 handleSubmit called', input);
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        console.log('66 Sending message:', messages, userMessage);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    model: selectedModel
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-700 rounded-md p-4 bg-gray-800">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-4 p-3 rounded-lg ${message.role === 'user'
                            ? 'bg-blue-900 ml-auto max-w-[80%] text-right text-blue-100'
                            : 'bg-gray-700 mr-auto max-w-[80%] text-gray-100'
                            } ${message.role === 'assistant' ? 'relative' : ''}`}
                    >
                        {message.content}
                        {(
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={() => handleCopyMessage(message.content, index)}
                                    className="p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded opacity-70 hover:opacity-100"
                                    aria-label="Copy response"
                                >
                                    {copiedIndex === index ? (
                                        <span className="text-green-300">Copied!</span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1-2 2v1"></path>
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleViewInMarkdown(message.content)} // Pass the assistant message content
                                    className="p-1 text-xs bg-blue-700 hover:bg-blue-600 rounded opacity-70 hover:opacity-100"
                                    aria-label="View in Markdown"
                                    title="View in Markdown"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <path d="M8 13h2l1 2 1-2h2"></path>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="bg-gray-700 p-3 rounded-lg mr-auto max-w-[80%]">
                        <span className="animate-pulse">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={input.trim() ? Math.min(5, input.split('\n').length + 1) : 1} // Adjust rows dynamically
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400"
                    disabled={isLoading}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

// Add this for external access to setPrompt
export interface ChatComponentRef {
    setPrompt: (promptText: string) => void;
}

interface TemplatesPanelProps {
    onApplyTemplate?: () => void;
    onViewInMarkdown?: () => void;
}

export function TemplatesPanel({ onApplyTemplate, onViewInMarkdown }: TemplatesPanelProps) {
    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Templates</h2>
            <div className="space-y-2">
                {/* Render templates */}
            </div>

            {/* Markdown Tab */}
            {onViewInMarkdown && (
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Markdown Preview</h3>
                    <button
                        onClick={onViewInMarkdown}
                        className="bg-blue-600 text-gray-100 px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        View in Markdown
                    </button>
                </div>
            )}
        </div>
    );
}