'use client';

import { useState, useEffect } from 'react';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import { CodeProps } from 'react-markdown/lib/ast-to-react';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

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
    const [selectedModel, setSelectedModel] = useState('gpt-4');
    const [lastResponse, setLastResponse] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>(''); // State for Markdown preview
    const [isEditing, setIsEditing] = useState(false); // State to toggle between edit and preview modes
    const [showLeftPanel, setShowLeftPanel] = useState(true); // State to toggle left panel visibility
    const [showRightPanel, setShowRightPanel] = useState(true); // State to toggle right panel visibility
    const [leftPanelWidth, setLeftPanelWidth] = useState(400); // Width of the left panel
    const [rightPanelWidth, setRightPanelWidth] = useState(400); // Width of the right panel

    const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
        const startX = e.clientX;
        const startLeftWidth = leftPanelWidth;
        const startRightWidth = rightPanelWidth;

        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startX;

            if (panel === 'left') {
                setLeftPanelWidth(Math.max(200, startLeftWidth + deltaX)); // Minimum width of 200px
            } else if (panel === 'right') {
                setRightPanelWidth(Math.max(200, startRightWidth - deltaX)); // Minimum width of 200px
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
        console.log('Template content inserted:', content);
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
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 w-full">
            {/* Left Panel: Templates */}
            {showLeftPanel && (
                <div
                    className="flex-shrink-0 p-4"
                    style={{ width: `${leftPanelWidth}px`, minWidth: '200px' }}
                >
                    <div className="flex justify-between items-center mb-4 ms-2">
                        <h2 className="text-xl font-bold text-blue-400">Templates</h2>
                    </div>
                    <TemplatesPanel onApplyTemplate={handleApplyTemplate} selectedModel={selectedModel} />
                </div>
            )}

            {/* Draggable Bar for Left Panel */}
            {showLeftPanel && (
                <div
                    className="w-2 bg-gray-700 cursor-col-resize relative"
                    onMouseDown={(e) => handleMouseDown(e, 'left')}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-1 mx-auto"></div>{/* Lighter part */}
                </div>
            )}

            {/* Middle Panel: AI Chat */}
            <div
                className={`flex flex-col p-4 overflow-hidden w-full ${showLeftPanel && showRightPanel
                        ? `w-[calc(100%-${leftPanelWidth + rightPanelWidth}px)]`
                        : showLeftPanel
                            ? `w-[calc(100%-${leftPanelWidth}px)]`
                            : showRightPanel
                                ? `w-[calc(100%-${rightPanelWidth}px)]`
                                : 'w-full'
                    }`}
            >
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        title={showLeftPanel ? 'Hide Templates' : 'Show Templates'}
                    >
                        {showLeftPanel ? '←' : '→'}
                        <span className="ml-1">{showLeftPanel ? 'Hide' : 'Show'} Templates</span>
                    </button>

                    <h1 className="text-2xl font-bold text-blue-400">AI Chat</h1>

                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        title={showRightPanel ? 'Hide Markdown' : 'Show Markdown'}
                    >
                        {showRightPanel ? '→' : '←'}
                        <span className="ml-1">{showRightPanel ? 'Hide' : 'Show'} Markdown</span>
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
                    className="w-2 bg-gray-700 cursor-col-resize relative"
                    onMouseDown={(e) => handleMouseDown(e, 'right')}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-1 mx-auto"></div>{/* Lighter part */}
                </div>
            )}

            {/* Right Panel: Markdown Preview */}
            {showRightPanel && (
                <div
                    className="flex-shrink-0 p-4"
                    style={{ width: `${rightPanelWidth}px`, minWidth: '200px' }}
                >
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-blue-400">Markdown Preview</h2>
                    </div>
                    {isEditing ? (
                        <textarea
                            value={mdPreview}
                            onChange={(e) => setMdPreview(e.target.value)}
                            className="w-full h-full bg-gray-900 text-gray-100 p-2 rounded-md resize-none"
                            style={{ height: "calc(100vh - 100px)" }}
                        />
                    ) : (
                        <div
                            className="prose prose-invert max-w-none custom-markdown markdown-preview bg-gray-800 p-4 rounded-md overflow-auto"
                            style={{
                                height: "calc(100vh - 80px)",
                                "--tw-prose-td-borders": "rgb(55, 65, 81)"
                            } as React.CSSProperties}
                        >
                            <ReactMarkdown
                                rehypePlugins={[rehypeHighlight]}
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: ({ inline, className, children, ...props }: CodeProps) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const mermaidRegex = /```mermaid([\s\S]*?)```/;
                                        const mermaidMatch = mermaidRegex.exec(String(children));
                                        if (!inline && match && match[1] === 'mermaid') {
                                            useEffect(() => {
                                                mermaid.initialize({
                                                    theme: 'dark',
                                                    securityLevel: 'loose'
                                                });
                                                mermaid.run();
                                            }, []);

                                            return (
                                                <div className="mermaid my-4">
                                                    {String(children).replace(/\n$/, '')}
                                                </div>
                                            );
                                        }

                                        return (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {mdPreview || '...'}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}