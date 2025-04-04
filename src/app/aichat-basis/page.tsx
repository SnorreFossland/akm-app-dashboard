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
        setMarkdownContent(content); // Store the Markdown content in state
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
                            {message.content}
                            {message.role === 'assistant' && (
                                <>
                                    <button
                                        onClick={() => handleCopyMessage(message.content, index)}
                                        className="absolute top-2 right-2 p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded opacity-70 hover:opacity-100"
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
                                        className="absolute top-2 right-10 p-1 text-xs bg-blue-700 hover:bg-blue-600 rounded opacity-70 hover:opacity-100"
                                        aria-label="View in Markdown"
                                        title="View in Markdown"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L2 7v5c0 5.25 3.75 10 10 10s10-4.75 10-10V7l-10-5z"></path>
                                            <path d="M12 12l4 4-4 4-4-4 4-4z"></path>
                                            <path d="M12 2v10"></path>
                                            <path d="M2 7l10 5 10-5"></path>
                                            <path d="M2 12l10 5 10-5"></path>
                                            <path d="M2 17l10 5 10-5"></path>
                                            <path d="M2 7v5c0 5.25 3.75 10 10 10s10-4.75 10-10V7"></path>
                                        </svg>
                                    </button>
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
                        <div className="flex space-x-4 mb-4">
                            <button
                                onClick={() => setActiveTab('templates')}
                                className={`px-4 py-2 rounded-md ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}
                            >
                                Templates
                            </button>
                            <button
                                onClick={() => setActiveTab('markdown')}
                                className={`px-4 py-2 rounded-md ${activeTab === 'markdown' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}
                            >
                                Markdown Preview
                            </button>
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