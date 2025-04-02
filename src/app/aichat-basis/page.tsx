'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Define available models
const AI_MODELS = [
    { id: 'deepseek-coder', name: 'Deepseek Coder' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    { id: 'mistral-large', name: 'Mistral Large' },
    { id: 'mistral-medium', name: 'Mistral Medium' },
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-ultra', name: 'Gemini Ultra' },
];

// Predefined prompt templates
const PROMPT_TEMPLATES = [
    {
        title: "Code Explanation",
        content: "Explain the following code and how it works:\n\n```\n[Paste code here]\n```"
    },
    {
        title: "Bug Fixing",
        content: "I have the following code with a bug. Can you help identify and fix it?\n\n```\n[Paste code here]\n```\n\nThe error I'm getting is: [Error message]"
    },
    {
        title: "Refactoring",
        content: "Please refactor this code to improve readability and performance:\n\n```\n[Paste code here]\n```"
    },
    {
        title: "Feature Proposal",
        content: "I need ideas for implementing [feature name] in my application. The current architecture is: [brief description]."
    },
    {
        title: "Custom",
        content: ""
    }
];

export default function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [showPanel, setShowPanel] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');
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

    const applyTemplate = (index: number) => {
        setSelectedTemplate(index);
        if (index === PROMPT_TEMPLATES.length - 1) {
            // This is the "Custom" template
            setInput(customTemplate);
        } else {
            setInput(PROMPT_TEMPLATES[index].content);
        }
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
                        <div className="flex items-center">
                            <label htmlFor="model-select" className="mr-2 text-sm">Model:</label>
                            <select
                                id="model-select"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {AI_MODELS.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setShowPanel(!showPanel)}
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm flex items-center"
                        >
                            {showPanel ? 'Hide' : 'Show'} Templates
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
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    )}
                                </button>
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
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Right Panel - Prompt Builder */}
            {showPanel && (
                <div className="w-1/3 border-l border-gray-700 bg-gray-800 overflow-y-auto flex flex-col h-screen">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold mb-2 text-blue-400">Prompt Templates</h2>
                        <div className="flex flex-col space-y-2">
                            {PROMPT_TEMPLATES.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() => applyTemplate(index)}
                                    className={`p-2 rounded-md text-left text-sm ${selectedTemplate === index ? 'bg-blue-600 text-gray-100' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                >
                                    {template.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedTemplate !== null && (
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-md font-semibold mb-2">
                                {selectedTemplate === PROMPT_TEMPLATES.length - 1 ? 'Custom Template' : PROMPT_TEMPLATES[selectedTemplate].title}
                            </h3>

                            {selectedTemplate === PROMPT_TEMPLATES.length - 1 ? (
                                <textarea
                                    rows={4}
                                    value={customTemplate}
                                    onChange={(e) => setCustomTemplate(e.target.value)}
                                    placeholder="Type your custom prompt here..."
                                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="bg-gray-900 p-3 rounded-md text-sm whitespace-pre-wrap border border-gray-700">
                                    {PROMPT_TEMPLATES[selectedTemplate].content}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-4 flex-1">
                        <h2 className="text-md font-semibold mb-2 text-blue-400">Tips for Good Prompts</h2>
                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                            <li>Be specific about what you want</li>
                            <li>Provide context and background information</li>
                            <li>For code issues, include error messages</li>
                            <li>Specify programming language when relevant</li>
                            <li>Request step-by-step explanations</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}