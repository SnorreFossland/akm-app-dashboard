'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import mermaid from 'mermaid';
import ModelSelector from '@/components/ai-chat/ModelSelector';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
import MarkdownDocumentManager from '@/components/ai-chat/MarkdownDocumentManager';


const AIChatPage = () => {
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>(''); // Markdown preview state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);

    const [selectedModel, setSelectedModel] = useState('mistral-small-latest'); // Default model
    const [resetConversationOnModelChange, setResetConversationOnModelChange] = useState(false);
    const [lastResponse, setLastResponse] = useState<string>('');
    const documents = useSelector((state: RootState) => state.markdown.documents);

    const [resetTrigger, setResetTrigger] = useState(0);

    const openLibraryButtonRef = useRef<HTMLButtonElement>(null);


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
    // Add this useEffect to adjust right panel width when left panel visibility changes
    useEffect(() => {
        if (!showLeftPanel) {
            // When left panel closes, make right panel wider
            setRightPanelWidth(Math.min(800, window.innerWidth / 2));
        }
    }, [showLeftPanel]);
    useEffect(() => {
        if (mdPreview && mdPreview.includes('mermaid') && !isEditing) {
            setTimeout(() => {
                mermaid.run();
            }, 0);
        }
    }, [mdPreview, isEditing]); // Add 'isEditing' to the dependency array

    useEffect(() => {
        // Only update the document name if it's currently empty and we have markdown content
        if (!docName && mdPreview) {
            const firstLine = mdPreview.split('\n')[0] || '';
            // Get the first line and clean it up
            const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_').trim();
            if (cleanName) {
                setDocName(cleanName);
            }
        }
    }, [mdPreview, docName]);

    const handleSaveToRedux = () => {
        if (!docName.trim()) return;

        console.log('Saving to Redux:', {
            id: Date.now().toString(),
            name: docName,
            content: mdPreview
        });

        dispatch(saveMarkdownDocument({
            id: Date.now().toString(),
            name: docName,
            content: mdPreview,
            createdAt: new Date().toISOString()
        }));

        // Show success notification
        alert('Document saved to library');

        // Add this to check if documents are updated after dispatch
        console.log('Documents after save:', documents);
    };

    const handleSelectFromLibrary = (content: string, name: string) => {
        setMdPreview(content);
        setDocName(name);
        // setIsLibraryOpen(false);
    };

    const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
        const startX = e.clientX;
        const startLeftWidth = leftPanelWidth;
        const startRightWidth = rightPanelWidth;

        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startX;

            if (panel === 'left') {
                // setShowLeftPanel(!showLeftPanel);
                setLeftPanelWidth(Math.max(80, startLeftWidth + deltaX)); // Minimum width of 200px
            } else if (panel === 'right') {
                // setShowRightPanel(!showRightPanel);
                setRightPanelWidth(Math.max(80, startRightWidth - deltaX)); // Reverse logic for right panel
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
                        minWidth: '80px'
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
            <div className="flex flex-col p-2 bg-card overflow-hidden h-full w-full"
                style={{ minWidth: '80px' }}>
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
                        <div className="flex items-center gap-2">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={(newModel) => {
                                    setSelectedModel(newModel);
                                    // Only reset if the checkbox is checked
                                    if (resetConversationOnModelChange) {
                                        // Increment reset trigger to cause ChatComponent to reset conversation
                                        setResetTrigger(prev => prev + 1);
                                    }
                                }}
                            />
                            <div className="flex items-center gap-1 text-sm">
                                <input
                                    type="checkbox"
                                    id="resetConversation"
                                    checked={resetConversationOnModelChange}
                                    onChange={(e) => setResetConversationOnModelChange(e.target.checked)}
                                    className="h-4 w-4 accent-blue-500"
                                />
                                <label htmlFor="resetConversation" className="text-gray-300">
                                    Reset
                                </label>
                            </div>
                        </div>
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
                    resetTrigger={resetTrigger}
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
                            width: `${rightPanelWidth}px`,
                            minWidth: '80px'
                        }}
                    >
                        <div className="flex items-center justify-between m-2">
                            <button
                                onClick={() => setShowRightPanel(!showRightPanel)}
                                className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 whitespace-nowrap rounded"
                                title='Hide Markdown'
                            >
                                {showRightPanel && '→ Hide Markdown'}
                            </button>
                            <h2 className="text-xl font-bold text-blue-400 whitespace-nowrap overflow-hidden text-ellipsis text-center flex-1">
                                Markdown Preview
                            </h2>
                            <div className="w-[100px]">
                                <div className="markdown-preview-header">
                                    <button
                                        ref={openLibraryButtonRef}
                                        className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 whitespace-nowrap rounded"
                                    >
                                        <span>Open Library</span>
                                    </button>
                                </div>
                            </div> {/* Empty div for balancing layout */}
                        </div>
                        {/*  Markdown Document Manager */}
                        <MarkdownDocumentManager
                            docName={docName}
                            setDocName={setDocName}
                            markdownContent={mdPreview} // Change markdownContent to mdPreview
                            onDocumentSelect={handleSelectFromLibrary} // Change handleDocumentSelect to handleSelectFromLibrary
                            openLibraryButtonRef={openLibraryButtonRef}
                        />

                        <div className="flex items-center justify-end space-x-2">
                            <div className="flex space-x-2 items-center">
                                <input
                                    type="text"
                                    value={(docName || mdPreview.split('\n')[0] || '').replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_')}
                                    onChange={(e) =>
                                        setDocName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, '_'))
                                    }
                                    placeholder="Document Name"
                                    className="text-xs bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded"
                                />
                                <button
                                    onClick={handleSaveToRedux}
                                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                                    disabled={!((docName || mdPreview.split('\n')[0]).replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_')).trim()}
                                >
                                    <span>Save Current</span>
                                </button>
                            </div>
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
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                            >
                                {isEditing ? 'Preview' : 'Edit'}
                            </button>
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
                )
            }
        </div >
    );
};

export default AIChatPage;