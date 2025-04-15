'use client';

import { useState, useEffect } from 'react';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import mermaid from 'mermaid';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { useDispatch } from 'react-redux';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';


const AIChatPage = () => {
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>(''); // Markdown preview state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [selectedModel, setSelectedModel] = useState('dummy'); // Default model
    const [lastResponse, setLastResponse] = useState<string>(''); // Properly initialize the state
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const dispatch = useDispatch();

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

    const handleSaveToRedux = () => {
        if (!docName.trim()) return;

        dispatch(saveMarkdownDocument({
            id: Date.now().toString(),
            name: docName,
            content: mdPreview,
            createdAt: new Date().toISOString()
        }));

        // Show success notification
        alert('Document saved to library');
    };

    const handleSelectFromLibrary = (content: string, name: string) => {
        setMdPreview(content);
        setDocName(name);
        setIsLibraryOpen(false);
    };

    const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
        const startX = e.clientX;
        const startLeftWidth = leftPanelWidth;
        const startRightWidth = rightPanelWidth;

        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startX;

            if (panel === 'left') {
                // setShowLeftPanel(!showLeftPanel);
                setLeftPanelWidth(Math.max(10, startLeftWidth + deltaX)); // Minimum width of 200px
            } else if (panel === 'right') {
                // setShowRightPanel(!showRightPanel);
                setRightPanelWidth(Math.max(10, startRightWidth - deltaX)); // Reverse logic for right panel
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
                        <h2 className="text-xl font-bold text-blue-400 whitespace-nowrap overflow-hidden text-ellipsis">Prepare Prompt</h2>
                        <button
                            onClick={() => setShowLeftPanel(!showLeftPanel)}
                            className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            title={showLeftPanel ? 'Hide Templates' : 'Show Templates'}
                        >
                            {showLeftPanel ? '← Hide Templates' : '→'}
                        </button>
                    </div>
                    <TemplatesPanel onApplyTemplate={(content) => {
                        console.log('Template content inserted:', content);
                        setChatInput(content);
                    }} selectedModel={selectedModel} />

                </div>
            )}
            {/* Draggable Bar for Left Panel */}
            <div
                className="w-3 bg-gray-700 cursor-col-resize relative"
                onMouseDown={(e) => {
                    if (!showLeftPanel) {
                        setShowLeftPanel(true);
                    }
                    handleMouseDown(e, 'left');
                }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-2 mx-auto"></div>{/* Lighter part */}
            </div>

            {/* Middle Panel: AI Chat */}
            <div className="flex flex-col p-2 bg-card overflow-hidden h-full w-full">
            {/* // <div
            //     className={`flex flex-col p-2 bg-card overflow-hidden h-full ${showLeftPanel && showRightPanel>
            //             ? `w-[calc(100%-${leftPanelWidth + rightPanelWidth}px)]`
            //             : showLeftPanel
            //                 ? `w-[calc(100%-${leftPanelWidth}px)]`
            //                 : showRightPanel
            //                     ? `w-1/2` // Changed to 50% when only right panel is visible
            //                     : 'w-full'
            //         }`}
            // > */}
                <div className="flex justify-between items-center mb-4 bg-primary-foreground p-2 rounded-md gap-1">
                    {!showLeftPanel ?
                        <button
                            onClick={() => setShowLeftPanel(!showLeftPanel)}
                            className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            title='Show Templates'
                        >
                            <span className="ml-1">{!showLeftPanel && '→ Show Templates'}</span>
                        </button>
                        : <div className="flex"></div>
                    }

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
                    {!showRightPanel ?
                        <button
                            onClick={() => setShowRightPanel(!showRightPanel)}
                            className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            title='Show Markdown'
                        >
                            <span className="mr-1">Show Markdown ←</span>
                        </button>
                        : <div className="flex"></div>
                    }

                </div>
                <ChatComponent
                    selectedModel={selectedModel}
                    onResponseChange={handleResponseChange}
                    onViewInMarkdown={handleViewInMarkdown}
                    setShowLeftPanel={setShowLeftPanel}
                    chatInput={chatInput}
                />
            </div>

            {/* Draggable Bar for Right Panel */}
            <div
                className="w-3 bg-gray-700 cursor-col-resize relative"
                onMouseDown={(e) => {
                    if (!showRightPanel) {
                        setShowRightPanel(true);
                    }
                    handleMouseDown(e, 'right');
                }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 h-12 bg-gray-500 w-2 mx-auto"></div>{/* Lighter part */}
            </div>


            {/* Right Panel: Markdown Preview */}
            {
                showRightPanel && (
                    <div
                        className="flex-shrink-0 p-2"
                        style={{
                            width: showLeftPanel ? `${rightPanelWidth}px` : '50%',
                            minWidth: '200px'
                        }}
                    >
                        <div className="flex justify-between items-center m-2">
                            <button
                                onClick={() => setShowRightPanel(!showRightPanel)}
                                className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 whitespace-nowrap rounded"
                                title='Show Markdown'
                            >
                                {showRightPanel && '→ Hide Markdown'}
                            </button>
                            <h2 className="text-xl font-bold text-blue-400 whitespace-nowrap overflow-hidden text-ellipsis">Markdown Preview</h2>
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

                        {/* New top bar for saving to Redux */}
                        <div className="flex items-center justify-between bg-gray-700 p-2 rounded mb-2">
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    placeholder="Document name"
                                    className="text-sm bg-gray-800 text-white px-2 py-1 rounded mr-2 border border-gray-600"
                                    value={docName}
                                    onChange={(e) => setDocName(e.target.value)}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setIsLibraryOpen(true)}
                                    className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded flex items-center"
                                >
                                    <span>Open from Library</span>
                                </button>
                                <button
                                    onClick={handleSaveToRedux}
                                    className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded flex items-center"
                                    disabled={!docName.trim()}
                                >
                                    <span>Save to Library</span>
                                </button>
                            </div>
                        </div>
                        {/* Library Modal */}
                        {isLibraryOpen && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                <div className="bg-gray-800 rounded-lg p-4 w-[600px] max-h-[80vh] overflow-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-blue-400">Markdown Library</h3>
                                        <button
                                            onClick={() => setIsLibraryOpen(false)}
                                            className="text-sm bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <MarkdownLibrary onSelect={handleSelectFromLibrary} />
                                </div>
                            </div>
                        )}
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
                )
            }
        </div >
    );
};

export default AIChatPage;