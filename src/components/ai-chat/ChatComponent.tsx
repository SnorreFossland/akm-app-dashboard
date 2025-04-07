'use client';

import { useState, useRef, useEffect } from 'react';

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

export default function ChatComponent({
    selectedModel,
    chatInput,
    onResponseChange,
    onViewInMarkdown
}: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState<string | undefined>(chatInput);

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

    // Synchronize `input` with `chatInput` when `chatInput` changes
    useEffect(() => {
        if (chatInput !== undefined) {
            setInput(chatInput);
        }
    }, [chatInput]);

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
        if (!input?.trim()) return;
        console.log('70 User input:', input, selectedModel);
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput(''); // Clear the input field after submission
        onResponseChange(''); // Clear the parent chatInput state
        setIsLoading(true);

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
                content: `Sorry, I encountered an error with AI model:
${selectedModel}
Please try another model or try again.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-700 rounded-md p-4 bg-gray-800 w-full">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${message.role === 'user'
                            ? 'bg-blue-900 ml-auto max-w-[80%] text-blue-100 flex-col'
                            : 'bg-gray-700 mr-auto max-w-[80%] text-gray-100 flex-col'
                            }`}
                    >
                        <div className="flex items-center justify-between gap-2 w-full">
                            {/* Icon for User or AI */}
                            <div className="flex-shrink-0 ">
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
                            {/* Role label - for clarity */}
                            <div className="text-xs text-gray-400">
                                {message.role === 'user' ? 'You' : 'Assistant'}
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopyMessage(message.content, index)}
                                    className="text-sm text-gray-400 hover:text-gray-200"
                                >
                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                </button>

                                {/* View in Markdown Button */}
                                {message.role === 'assistant' && (
                                    <button
                                        onClick={() => handleViewInMarkdown(message.content)}
                                        className="text-sm text-blue-400 hover:text-blue-200 flex items-center gap-1"
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            className="inline-block"
                                        >
                                            <path d="M17 7l-9.9 9.9" strokeWidth="2" strokeLinecap="round"/>
                                            <path d="M8 7h9v9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 w-full text-gray-100 whitespace-pre-wrap break-words">
                            {message.content.split('```').map((block, i) => {
                                // Even indexes are normal text, odd indexes are code blocks
                                if (i % 2 === 0) {
                                    return (
                                        <div key={i} className="mb-2">
                                            {block.split('\n').map((line, j) => (
                                                <div key={j}>{line}</div>
                                            ))}
                                        </div>
                                    );
                                } else {
                                    // This is a code block
                                    const [language, ...codeLines] = block.split('\n');
                                    return (
                                        <pre key={i} className="bg-gray-900 p-3 rounded my-2 overflow-x-auto">
                                            <code className={`language-${language.trim() || 'text'}`}>
                                                {codeLines.join('\n')}
                                            </code>
                                        </pre>
                                    );
                                }
                            })}
                        </div>
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
                    value={input || ""}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message or type 'Help' or use a template (Ctrl+Shift+T)"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault();
                            setInput((prev) => (prev ? prev + '\n' : ''));
                        } else if (e.key === 'Enter' && !e.shiftKey) {
                            const now = Date.now();
                            const lastEnterTime = (e.target as HTMLTextAreaElement).dataset.lastEnterTime
                                ? parseInt((e.target as HTMLTextAreaElement).dataset.lastEnterTime!)
                                : 0;
                                
                            if (now - lastEnterTime < 1000) { // Double Enter within 500ms
                                e.preventDefault();
                                handleSubmit(e);
                                (e.target as HTMLTextAreaElement).dataset.lastEnterTime = "0";
                            } else {
                                e.preventDefault();
                                (e.target as HTMLTextAreaElement).dataset.lastEnterTime = now.toString();
                            }
                        }
                    }}
                    autoFocus
                    onFocus={() => setCopiedIndex(null)}
                    onBlur={() => setCopiedIndex(null)}
                    onKeyUp={(e) => {
                        if (e.key === 'Escape') {
                            setInput('');
                        }
                    }}
                    onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text/plain');
                        setInput((prev) => (prev ? prev + pastedText : pastedText));
                        e.preventDefault();
                    }}
                    onCopy={(e) => {
                        const selectedText = window.getSelection()?.toString();
                        if (selectedText) {
                            navigator.clipboard.writeText(selectedText)
                                .then(() => {
                                    setCopiedIndex(messages.length);
                                    setTimeout(() => setCopiedIndex(null), 2000);
                                })
                                .catch(err => {
                                    console.error('Failed to copy text: ', err);
                                });
                            e.preventDefault();
                        }
                    }}
                    className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={input?.trim() ? Math.min(5, input.split('\n').length + 1) : 2}
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
