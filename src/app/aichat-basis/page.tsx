'use client';

import { useState, useRef, useEffect } from 'react';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [showPanel, setShowPanel] = useState(true);
    const [markdownContent, setMarkdownContent] = useState<string>(''); // Add this state
    const [activeTab, setActiveTab] = useState<'templates' | 'markdown'>('templates'); // Add tab state
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const handleTemplateApply = (content: string) => {
        setInput(content); // Set the template content into the input field
    };

    const handleViewInMarkdown = (content: string) => {
        // Filter out comment-like text (e.g., starting with "Certainly!")
        const filteredContent = content
            .split('\n') // Split content into lines
            .filter((line, index, array) => {
                const prevLine = index > 0 ? array[index - 1].trim() : '';
                const nextLine = index < array.length - 1 ? array[index + 1].trim() : '';
                
                // Exclude lines starting with "Certainly!"
                if (line.trim().startsWith('Certainly!')) return false;
                
                // Exclude divider lines
                if (line.trim() === '---') return false;
                
                // For blank lines, only keep them if they're not adjacent to dividers
                if (line.trim() === '') {
                    return prevLine !== '---' && nextLine !== '---';
                }
                
                // Exclude lines starting with "This outline provides"
                return !line.trim().startsWith('This outline provides');
            })
            .join('\n'); // Join the filtered lines back

        setMarkdownContent(filteredContent); // Store the filtered Markdown content in state
        setActiveTab('markdown'); // Switch to the Markdown tab
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
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
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Main Chat Area */}
            <div className={`flex flex-col ${showPanel ? 'w-2/3' : 'flex-1'} p-4 overflow-hidden`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-blue-400">AI Chat</h1>

                    <div className="flex items-center space-x-4">
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                        />

                        <button
                            onClick={() => setShowPanel(!showPanel)}
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm flex items-center"
                        >
                            {showPanel ? 'Hide' : 'Show'} Panel
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 border border-gray-700 rounded-md p-4 bg-gray-800">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`mb-4 p-3 rounded-lg ${message.role === 'user'
                                ? 'bg-blue-900 ml-auto max-w-[80%] text-right text-blue-100'
                                : 'bg-gray-700 mr-auto max-w-[80%] text-gray-100'
                                } ${message.role === 'assistant' ? 'relative' : ''}`}
                        >
                            {message.role === 'assistant' && (
                                <>
                                    <div className="absolute top-0 right-0 flex space-x-1 p-1">
                                        <button
                                            onClick={() => handleCopyMessage(message.content, index)}
                                            className="p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded opacity-70 hover:opacity-100"
                                            aria-label="Copy response"
                                            title="Copy response"
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
                                            onClick={() => handleViewInMarkdown(message.content)}
                                            className="p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded opacity-70 hover:opacity-100"
                                            aria-label="View in Markdown"
                                            title="View in Markdown"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 17C5 5 10 7 17 7" />
                                                <path d="M16 3l4 4-4 4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="pt-6">{message.content}</div>
                                </>
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


            {/* Right Panel - Tabs */}
            {showPanel && (
                <div className="w-1/3 bg-gray-800 border-l border-gray-700 overflow-y-auto">
                    <div className="p-4">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-700 mb-4">
                            <div
                                onClick={() => setActiveTab('templates')}
                                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    activeTab === 'templates'
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 6h16M4 12h8m-8 6h16"
                                        />
                                    </svg>
                                    Templates
                                </div>
                            </div>
                            <div
                                onClick={() => setActiveTab('markdown')}
                                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    activeTab === 'markdown'
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12h6m-6 4h6m-6-8h6m-7 12h8a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Markdown Preview
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'templates' && (
                            <div>
                                <h2 className="text-lg font-bold mb-4">Templates</h2>
                                <TemplatesPanel onApplyTemplate={handleTemplateApply} />
                            </div>
                        )}

                        {activeTab === 'markdown' && (
                            <div>
                                <h2 className="text-lg font-bold mb-4">Markdown Preview</h2>
                                <div className="bg-gray-800 p-4 rounded-md text-gray-100">
                                    {markdownContent ? (
                                        <pre className="whitespace-pre-wrap break-all">{markdownContent}</pre>
                                    ) : (
                                        <p>No Markdown content to preview.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}