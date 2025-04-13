'use client';

import { useState, useEffect } from 'react';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import mermaid from 'mermaid';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';


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
    const [rightPanelWidth, setRightPanelWidth] = useState(1000);
    const [selectedModel, setSelectedModel] = useState('dummy'); // Default model
    // const [selectedModel, setSelectedModel] = useState('deepseek-chat'); // Default model
    const [lastResponse, setLastResponse] = useState<string>(''); // Properly initialize the state
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode

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

    useEffect(() => {
        if (mdPreview && mdPreview.includes('mermaid') && !isEditing) {
            setTimeout(() => {
                mermaid.run();
            }, 0);
        }
    }, [mdPreview, isEditing]); // Add 'isEditing' to the dependency array

    const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
        const startX = e.clientX;
        const startLeftWidth = leftPanelWidth;
        const startRightWidth = rightPanelWidth;

        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startX;

            if (panel === 'left') {
                setLeftPanelWidth(Math.max(200, startLeftWidth + deltaX)); // Minimum width of 200px
            } else if (panel === 'right') {
                setRightPanelWidth(Math.max(200, startRightWidth - deltaX)); // Reverse logic for right panel
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleApplyTemplate = (content: string) => {
        console.log('93 Template content inserted:', content);
        setChatInput(content); // Update the chat input field
    };

    const handleResponseChange = (response: string) => {
        setLastResponse(response);
    };

    const handleViewInMarkdown = (response: string) => {
        const cleanResponse = (response: string) => {
            let cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
            cleaned = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
            return cleaned;
        };

        const cleanedResponse = cleanResponse(response);
        setMdPreview(cleanedResponse);
        setShowRightPanel(true); // Ensure the right panel is shown
        setShowLeftPanel(false); // Hide the left panel when viewing markdown
    };

    return (
        <div className="flex h-screen bg-background text-gray-100 w-full max-w-full overflow-hidden">
            {/* Left Panel: Templates */}
            {showLeftPanel && (
                <div
                    className="flex-shrink-0 px-2"
                    style={{
                        width: showRightPanel ? `${leftPanelWidth}px` : `${leftPanelWidth + 200}px`,
                        minWidth: '200px'
                    }}
                >
                    <div className="flex justify-between items-center m-2 ms-2">
                        <h2 className="text-xl font-bold text-blue-400">Prepare Prompt</h2>
                    </div>
                    <TemplatesPanel onApplyTemplate={(content) => {
                        console.log('Template content inserted:', content);
                        setChatInput(content);
                    }} selectedModel={selectedModel} />
                </div>
            )}
            {/* Draggable Bar for Left Panel */}
            {showLeftPanel && (
                <div
                    className="w-3 bg-gray-700 cursor-col-resize relative"
                    onMouseDown={(e) => handleMouseDown(e, 'left')}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-1 mx-auto"></div>{/* Lighter part */}
                </div>
            )}
            {/* Middle Panel: AI Chat */}
            <div
                className={`flex flex-col p-2 bg-card overflow-hidden h-full w-2/3 ${showLeftPanel && showRightPanel
                    ? `w-[calc(100%-${leftPanelWidth + rightPanelWidth}px)]`
                    : showLeftPanel
                        ? `w-[calc(100%-${leftPanelWidth}px)]`
                        : showRightPanel
                            ? `w-[calc(100%-${rightPanelWidth}px)]`
                            : 'w-full'
                    }`}
            >
                <div className="flex justify-between items-center mb-4 bg-primary-foreground p-2 rounded-md gap-1">
                    <button
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        title={showLeftPanel ? 'Hide Templates' : 'Show Templates'}
                    >
                        {showLeftPanel ? '←' : '→'}
                        <span className="ml-1">{showLeftPanel ? 'Hide' : 'Show'} Templates</span>
                    </button>

                    <h1 className="text-2xl font-bold text-blue-400 px-2">AIChat</h1>
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
                    onResponseChange={handleResponseChange}
                    onViewInMarkdown={handleViewInMarkdown}
                    chatInput={chatInput}
                />
            </div>

            {/* Draggable Bar for Right Panel */}
            {showRightPanel && (
                <div
                    className="w-3 bg-gray-700 cursor-col-resize relative"
                    onMouseDown={(e) => handleMouseDown(e, 'right')}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-1 mx-auto"></div>{/* Lighter part */}
                </div>
            )}

            {/* Right Panel: Markdown Preview */}
            {showRightPanel && (
                <div
                    className="flex-shrink-0 p-2"
                    style={{ width: `${rightPanelWidth}px`, minWidth: '200px' }}
                >
                    <div className="flex justify-between items-center m-2">
                        <h2 className="text-xl font-bold text-blue-400">Markdown Preview</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(mdPreview);
                                    // You could show a temporary "Copied!" tooltip here
                                    const button = document.activeElement as HTMLButtonElement;
                                    const originalText = button.textContent;
                                    button.textContent = "Copied!";
                                    setTimeout(() => {
                                        button.textContent = originalText;
                                    }, 2000);
                                }}
                                className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            >
                                {isEditing ? 'Preview' : 'Edit'}
                            </button>
                        </div>
                    </div>
                    {/* Either render a textarea or a preview */}
                    {isEditing ? (
                        <textarea
                            value={mdPreview}
                            onChange={(e) => setMdPreview(e.target.value)}
                            className="w-full h-full p-4 bg-gray-800 text-gray-100 rounded max-h-[80vh] overflow-y-auto"
                        />
                    ) : (
                        <div className="prose prose-invert max-w-none custom-markdown markdown-preview bg-gray-800 p-4 rounded-md overflow-auto max-h-[80vh]">
                            <MarkdownPreview mdPreview={mdPreview} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIChatPage;