'use client';

import { useState } from 'react';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import ModelSelector from '@/components/ai-chat/ModelSelector';

export function useTemplateManager() {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');

    const applyTemplate = (index: number, templates: { content: string }[], setInput: (content: string) => void) => {
        setSelectedTemplate(index);
        const content = index === templates.length - 1 ? customTemplate : templates[index].content;
        setInput(content);
    };

    return { selectedTemplate, setSelectedTemplate, customTemplate, setCustomTemplate, applyTemplate };
}

export default function AIChatPage() {
    const [selectedModel, setSelectedModel] = useState('deepseek-coder');
    const [showPanel, setShowPanel] = useState(true);
    const [lastResponse, setLastResponse] = useState('');
    const [activeTab, setActiveTab] = useState<'templates' | 'markdown'>('templates');
    const [chatInput, setChatInput] = useState('');
    const [panelWidth, setPanelWidth] = useState(33); // Percentage width of the right panel

    const handleApplyTemplate = (content: string) => {
        console.log('31 Template content inserted:', content);
        setChatInput(content); // Update the chat input field
    };

    const handleResponseChange = (response: string) => {
        setLastResponse(response);
    };

    const handleViewInMarkdown = (response: string) => {
        setLastResponse(response);
        setActiveTab('markdown');
    };

    const handleDocumentMouseMove = (e: MouseEvent) => {
        const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
        setPanelWidth(Math.min(Math.max(newWidth, 20), 50)); // Restrict width between 20% and 50%
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Main Chat Area */}
            <div
                className="flex flex-col p-4 overflow-hidden"
                style={{ width: `${100 - panelWidth}%` }}
            >
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

                <ChatComponent
                    selectedModel={selectedModel}
                    onResponseChange={handleResponseChange}
                    onViewInMarkdown={handleViewInMarkdown}
                    chatInput={chatInput} // Pass the updated chat input
                />
            </div>

            {/* Drag Handle */}
            {showPanel && (
                <div 
                    className="relative w-2 bg-gray-700 cursor-col-resize hover:bg-gray-600"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        document.addEventListener('mousemove', handleDocumentMouseMove);
                        document.addEventListener('mouseup', () => {
                            document.removeEventListener('mousemove', handleDocumentMouseMove);
                        });
                    }}
                >
                    {/* Lighter part in the middle */}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-8 bg-gray-400 rounded"></div>
                </div>
            )}

            {/* Right Panel with Tabs */}
            {showPanel && (
                <div
                    className="bg-gray-800"
                    style={{ width: `${panelWidth}%` }}
                >
                    <div className="mt-4 pt-4 p-4">
                        <div className="flex mb-4 border-b border-gray-600">
                            <button
                                onClick={() => setActiveTab('templates')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'templates'
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                Templates
                            </button>
                            <button
                                onClick={() => setActiveTab('markdown')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'markdown'
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                Markdown Preview
                            </button>
                        </div>

                        {activeTab === 'templates' && (
                            <div className="bg-gray-900 p-4 rounded-md">
                                <TemplatesPanel onApplyTemplate={handleApplyTemplate} />
                            </div>
                        )}

                        {activeTab === 'markdown' && (
                            <div className="bg-gray-900 p-4 rounded-md max-h-96 overflow-auto">
                                <pre className="whitespace-pre-wrap">{lastResponse}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}