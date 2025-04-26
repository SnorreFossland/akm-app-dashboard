'use client';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import TemplatesPanel from '@/components/ai-chat/TemplatesPanel';
import mermaid from 'mermaid';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';

export interface ChatComponentProps {
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    error?: string; // Optional error prop
    chatInput?: string;
    input: string;
    setInput: (input: string) => void;
    setMdContent: (message: string) => void;
    mdContent: string;
    onAddMD?: () => void;
}

const AIChatPage = () => {
    const dispatch = useDispatch();
    const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'document'>('templates');
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>(''); // Markdown preview state
    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(550);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [input, setInput] = useState<string>("");
    const [editableContent, setEditableContent] = useState('');
    const [domainContent, setDomainContent] = useState('');
    const [selectedModel, setSelectedModel] = useState('mistral-small-latest'); // Default model
    const [lastResponse, setLastResponse] = useState<string>('');
    const documents = useSelector((state: RootState) => state.markdown.documents);
    const [documentPanelOpen, setDocumentPanelOpen] = useState(false);

    // replace your single openLibraryButtonRef with two refs:
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const mdFileInputRef = useRef<HTMLInputElement>(null)
    const [mdContent, setMdContent] = useState<string>('')
    const [forceRefresh, setForceRefresh] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddMD = () => {
        mdFileInputRef.current?.click()
    }

    const handleExportLibrary = () => {
        if (documents.length === 0) return;

        // Create a JSON file from the documents
        const dataStr = JSON.stringify(documents, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

        // Create and trigger a download link
        const exportFileName = `markdown-library-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    };

    const handleImportLibrary = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedDocuments = JSON.parse(event.target?.result as string);

                // Validate the imported data structure
                if (Array.isArray(importedDocuments) && importedDocuments.every(doc =>
                    typeof doc === 'object' && doc !== null &&
                    'id' in doc && 'name' in doc && 'content' in doc)) {

                    // Import each document to Redux
                    importedDocuments.forEach(doc => {
                        dispatch(saveMarkdownDocument({
                            id: doc.id || Date.now().toString(),
                            name: doc.name,
                            content: doc.content,
                            createdAt: doc.createdAt || new Date().toISOString()
                        }));
                    });

                    alert(`Successfully imported ${importedDocuments.length} documents`);
                } else {
                    alert('Invalid file format. Import failed.');
                }
            } catch (error) {
                console.error('Error importing library:', error);
                alert('Failed to import library. Invalid JSON format.');
            }
        };

        reader.readAsText(file);
        e.target.value = ''; // Reset the file input
      };
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
                edgeLabelBorder: '#1e3a8a',
            }
        });
        setShowRightPanel(false);
    }, []);

    // Check device type on component mount'
    useEffect(() => {
        const checkDeviceType = () => {
            // Check if it's a larger screen device
            const isDesktop = window.innerWidth >= 768; // Typical tablet/desktop breakpoint
            setShowLeftPanel(isDesktop);
        };
        checkDeviceType();
        // Also update on resize for orientation changes
        window.addEventListener('resize', checkDeviceType);
        return () => window.removeEventListener('resize', checkDeviceType);
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
        setMdContent(content);
        setDocName(name);
        setIsEditing(false);
        setActiveLeftTab('document'); // Switch to document tab
        setIsLibraryOpen(false); // Close the library modal after selection

        console.log("Selected document from library:", { content, name });
    };



    const MIN_PANEL_WIDTH = 80;
    const MAX_PANEL_WIDTH = () => window.innerWidth - 320; // leave at least 320px for the middle

    const handleMouseDown = (e: React.MouseEvent, panel: 'left' | 'right') => {
        const startX = e.clientX;
        const startLeftWidth = leftPanelWidth;
        const startRightWidth = rightPanelWidth;
        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - startX;

            if (panel === 'left') {
                const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX));
                setLeftPanelWidth(newWidth);
            } else if (panel === 'right') {
                const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH(), startRightWidth - deltaX));
                setRightPanelWidth(newWidth);
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

    const handleResponseChange = (response: string) => { setLastResponse(response) };
    
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

    // #region Main Layout
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-background text-gray-100">
            <div className="flex flex-row flex-nowrap h-[100dvh] min-w-[450px] w-full max-w-full bg-background text-gray-100 overflow-hidden">
                {/* Left Panel: Templates */}
                {showLeftPanel && (
                    <div
                        className="flex-shrink-0 p-1 bg-primary-foreground sm:px-2 min-w-[460px] sm:min-w-[360px] max-w-[95vw] overflow-auto"
                        style={{ width: `${leftPanelWidth}px` }}
                    >
                        <div className="flex justify-between items-center m-1 sm:m-2">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-400">
                                Input: {activeLeftTab === 'templates' ? 'Domain Topic' : 'Document'}
                            </h2>
                            <div className="markdown-preview-header">
                                <button
                                    onClick={() => setIsLibraryOpen(prev => !prev)}
                                    className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 whitespace-nowrap rounded"
                                >
                                    Library
                                </button>
                            </div>
                            <button
                                onClick={() => setShowLeftPanel(!showLeftPanel)}
                                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2 rounded"
                            >
                                <span className="text-lg">{showLeftPanel ? '←' : '→'}</span>
                            </button>
                        </div>

                        {/* tabs */}
                        <ul className="flex border-b border-gray-600 mb-2 text-sm">
                            <li
                                className={`px-3 py-1 cursor-pointer ${activeLeftTab === 'templates'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('templates')}
                            >
                                Templates
                            </li>
                            <li
                                className={`px-3 py-1 cursor-pointer ml-4 ${activeLeftTab === 'document'
                                    ? 'border-b-2 border-blue-400 font-semibold'
                                    : 'text-gray-400'
                                    }`}
                                onClick={() => setActiveLeftTab('document')}
                            >
                                Document
                            </li>
                        </ul>

                        {/* tab content */}
                        {activeLeftTab === 'templates' ? (
                            <>
                                {/* hidden shared picker */}
                                < input
                                    ref={mdFileInputRef}
                                    type="file"
                                    accept=".md"
                                    className="hidden"

                                />
                                <TemplatesPanel
                                    onApplyTemplate={handleApplyTemplate}
                                    editableContent={editableContent}
                                    setEditableContent={setEditableContent}
                                    domainContent={domainContent}
                                    setDomainContent={setDomainContent}
                                    selectedModel={selectedModel}
                                    onAddMD={handleAddMD}
                                    mdContent={mdContent}
                                />
                            </>
                        ) : ( // if mdContent is not empty, show DocumentPanel
                            (mdContent && mdContent.length > 0)
                                ?
                                <DocumentPanel mdContent={mdContent} />
                                : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <div className="text-sm">No document selected</div>
                                        <div className="text-sm">...</div>
                                        <div className="text-sm">Select a document from the library above.</div>
                                    </div>
                                )
                        )}
                    </div>
                )}

                {/* Draggable Bar for Left Panel */}
                {showLeftPanel && (
                    <div className="w-2 sm:w-3 bg-gray-700 cursor-col-resize relative min-w-[8px]"
                        onMouseDown={(e) => {
                            if (!showLeftPanel) setShowLeftPanel(true);
                            handleMouseDown(e, 'left');
                        }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1.5 sm:w-2 mx-auto max-w-full "></div>
                    </div>
                )}


                {/* Middle Panel: AI Chat */}
                <div className="flex-1 p-1 min-w-[450px] sm:min-w-[0] sm:px-2">
                    {/* <div className="flex-1 min-w-0 px-1 sm:px-2 overflow-hidden"></div> */}
                    <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 mb-2 sm:mb-4 sm:p-2 ">
                        {!showLeftPanel ? (
                            <button
                                onClick={() => setShowLeftPanel(!showLeftPanel)}
                                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                                title='Show Templates'
                            >
                                <span>→</span>
                                <span className="ml-1 hidden bg-muted hover:bg-gray-600 text-white sm:inline">{!showLeftPanel && 'Left pane'}</span>
                            </button>
                        ) : (
                            <div className="flex"></div>
                        )}

                        <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">AIChat</h1>
                        {!showRightPanel ? (
                            <button
                                onClick={() => setShowRightPanel(!showRightPanel)}
                                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
                                title='Show Markdown'
                            >
                                <span>←</span>
                                <span className="ml-1 hidden sm:inline">{!showRightPanel && 'Right pane'}</span>
                            </button>
                        ) : (
                            <div className="flex"></div>
                        )}
                    </div>
                    <div className="mx-auto max-w-[1200px] h-full overflow-auto">
                        <ChatComponent
                            input={input}
                            setInput={setInput}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            onResponseChange={handleResponseChange}
                            onViewInMarkdown={handleViewInMarkdown}
                            setShowLeftPanel={setShowLeftPanel}
                            chatInput={chatInput}
                            onAddMD={handleAddMD}
                            mdContent={mdContent}
                            setMdContent={setMdContent}
                        />
                    </div>
                </div>

                {/* Draggable Bar for Right Panel */}
                {showRightPanel && (
                    <div
                        className="w-2 sm:w-3 bg-gray-700 cursor-col-resize relative"
                        onMouseDown={(e) => {
                            if (!showRightPanel) setShowRightPanel(true);
                            handleMouseDown(e, 'right');
                        }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1.5 sm:w-2 mx-auto"></div>
                    </div>
                )}

                {/* Right Panel: Markdown Preview */}
                {showRightPanel && (
                    <div className="flex-shrink-0 bg-primary-foreground p-1 sm:px-2 min-w-[450px] sm:min-w-[450px] max-w-[95vw] max-h-1/2 overflow-hidden"
                        style={{
                            width: `${rightPanelWidth}px`,
                        }}
                    >
                        <div className="flex items-center justify-between m-1 sm:m-2">
                            <button
                                onClick={() => setShowRightPanel(!showRightPanel)}
                                className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2  whitespace-nowrap rounded"
                                title='Hide Markdown'
                            >
                                <span className="text-lg">{showRightPanel && '→'}</span>
                            </button>
                            <h2 className="text-lg sm:text-xl font-bold text-blue-400 whitespace-nowrap overflow-hidden text-ellipsis text-center flex-1">
                                Output: Markdown Preview
                            </h2>
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                            <div className="flex space-x-2 items-center border border-gray-500 rounded p-1">
                                <div className="text-xs">Name: </div>
                                {/* Document Name Input */}
                                <input
                                    type="text"
                                    value={(docName || mdPreview.split('\n')[0] || '').replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_')}
                                    onChange={(e) =>
                                        setDocName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, '_'))
                                    }
                                    placeholder="Document Name"
                                    className="text-xs bg-background border border-gray-600 text-white px-2 py-1 rounded"
                                />
                                <button
                                    onClick={handleSaveToRedux}
                                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                                    disabled={!((docName || mdPreview.split('\n')[0]).replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_')).trim()}
                                >
                                    <span>Save</span>
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
                                className="w-full h-full p-4 bg-background text-foreground rounded max-h-[80vh] overflow-y-auto"
                            />
                        ) : (
                            /* Added "max-w-full" to the markdown container */
                            <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto max-h-[80vh] max-w-full whitespace-pre-wrap break-words">
                                <MarkdownPreview mdPreview={mdPreview} />
                            </div>
                        )}
                    </div>
                )}
            </div >
            <div className="flex w-full max-h-[5px] justify-center items-center mt-1">
                <hr className="border-gray-700 w-full" />
            </div>
            <>
                {/* Library Modal */}
                {isLibraryOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50">
                        <div className="bg-background rounded-lg p-4 w-[600px] max-h-[80vh] overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-blue-400">Markdown Library</h3>
                                <div className="flex space-x-2">

                                    <button
                                        onClick={handleExportLibrary}
                                        className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                                        disabled={documents.length === 0}
                                    >
                                        Export Library
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelection}
                                        accept=".json"
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={handleImportLibrary}
                                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                                    >
                                        <span>Import Library</span>
                                    </button>
                                    <button
                                        onClick={() => setIsLibraryOpen(false)}
                                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            {/* Pass export functionality to library component */}
                            <MarkdownLibrary
                                onSelect={handleSelectFromLibrary}
                                hideExportLibraryButton={true}
                            />
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};
// #endregion

export default AIChatPage;