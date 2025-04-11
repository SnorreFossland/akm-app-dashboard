'use client';

import { useState, useEffect } from 'react';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import mermaid from 'mermaid';
import ModelSelector from '@/components/ai-chat/ModelSelector';
// Note: If MarkdownPreview is not used directly in this file, you may remove it
// import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

function useTemplateManager() {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customTemplate, setCustomTemplate] = useState('');

    const applyTemplate = (index: number, templates: { content: string }[], setInput: (content: string) => void) => {
        setSelectedTemplate(index);
        const content = index === templates.length - 1 ? customTemplate : templates[index].content;
        setInput(content);
    };

    return { selectedTemplate, setSelectedTemplate, customTemplate, setCustomTemplate, applyTemplate };
}

const AIChatPage = () => {
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>(''); // Markdown preview state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(600);
    const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model
    // Removed lastResponse and setIsEditing if not used

    // Initialize mermaid when component mounts
    useEffect(() => {
        mermaid.initialize({
            theme: 'dark',
            securityLevel: 'loose'
        });
        mermaid.contentLoaded();
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            flowchart: { curve: 'linear' },
            sequence: { showSequenceNumbers: true },
            themeVariables: {
                primaryColor: '#1e3a8a',
                edgeLabelBackground: '#334155',
                edgeLabelBorder: '#1e3a8a'
            }
        });
        setShowRightPanel(false);
    }, []);

    // Run mermaid whenever markdown preview changes
    useEffect(() => {
        if (mdPreview && mdPreview.includes('mermaid')) {
            setTimeout(() => {
                mermaid.run();
            }, 0);
        }
    }, [mdPreview]);

    // Example mouse handlers and other effects…
    // (Keep these if you actually use them)

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 w-full">
            {/* Left Panel: Templates */}
            {showLeftPanel && (
                <div
                    className="flex-shrink-0 p-2"
                    style={{
                        width: showRightPanel ? `${leftPanelWidth}px` : `${leftPanelWidth + 200}px`,
                        minWidth: '200px'
                    }}
                >
                    <div className="flex justify-between items-center mb-4 ms-2">
                        <h2 className="text-xl font-bold text-blue-400">Templates</h2>
                    </div>
                    <TemplatesPanel onApplyTemplate={(content) => {
                        console.log('Template content inserted:', content);
                        setChatInput(content);
                    }} selectedModel={selectedModel} />
                </div>
            )}

            {/* Draggable Bar for Left Panel */}
            {showLeftPanel && mdPreview && (
                <div
                    className="w-2 bg-gray-700 cursor-col-resize relative"
                    onMouseDown={(e) => {
                        // Your onMouseDown implementation…
                    }}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-1 mx-auto"></div>
                </div>
            )}

            {/* Middle Panel: AI Chat */}
            <div
                className={`flex flex-col p-2 bg-card overflow-hidden w-full ${showLeftPanel && showRightPanel
                    ? `w-[calc(100%-${leftPanelWidth + rightPanelWidth}px)]`
                    : showLeftPanel
                        ? `w-[calc(100%-${leftPanelWidth}px)]`
                        : showRightPanel
                            ? `w-[calc(100%-${rightPanelWidth}px)]`
                            : 'w-full'
                    }`}
            >
                <div className="flex justify-between items-center mb-4 bg-primary-foreground p-2 rounded-md">
                    <button
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        title={showLeftPanel ? 'Hide Templates' : 'Show Templates'}
                    >
                        {showLeftPanel ? '←' : '→'}
                        <span className="ml-1">{showLeftPanel ? 'Hide' : 'Show'} Templates</span>
                    </button>

                    <h1 className="text-2xl font-bold text-blue-400">AI Chat</h1>
                    <div className="flex items-center space-x-4">
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={(newModel) => {
                                if (window.confirm(`Are you sure you want to change the model to ${newModel}?`)) {
                                    setSelectedModel(newModel);
                                }
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        title={showRightPanel ? 'Hide' : 'Show Markdown'}
                    >
                        <span className="mr-1">{showRightPanel ? 'Hide' : 'Show'} Markdown</span>
                        {showRightPanel ? '→' : '←'}
                    </button>
                </div>

                <ChatComponent
                    selectedModel={selectedModel}
                    onResponseChange={(response) => {
                        // You might use this response somewhere or remove it if not needed.
                    }}
                    onViewInMarkdown={(response) => {
                        // Show markdown preview or process it as needed.
                    }}
                    chatInput={chatInput}
                />
            </div>

            {/* Draggable Bar for Right Panel */}
            {showRightPanel && (
                <div
                    className="w-2 bg-gray-700 cursor-col-resize relative"
                    onMouseDown={(e) => {
                        // Your onMouseDown implementation…
                    }}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-1 mx-auto"></div>
                </div>
            )}

            {/* Right Panel: Markdown Preview */}
            {showRightPanel && (
                <div
                    className="flex-shrink-0 p-2"
                    style={{ width: `${rightPanelWidth}px`, minWidth: '200px' }}
                >
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-blue-400">Markdown Preview</h2>
                        <button
                            onClick={() => {
                                // Toggle edit mode if needed (if not used, remove setIsEditing)
                            }}
                            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        >
                            Preview
                        </button>
                    </div>
                    {/* Either render a textarea or a preview */}
                </div>
            )}
        </div>
    );
};

export default AIChatPage;