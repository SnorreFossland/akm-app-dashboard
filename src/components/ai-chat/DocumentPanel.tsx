'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { RootState } from '@/store';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveMarkdownDocument } from '@/features/documents/markdownSlice';
import { setDomainData } from '@/features/model-universe/modelSlice';


interface DocumentPanelProps {
    mdContent: string;
    setMdContent: (content: string) => void;
    onEdit?: () => void;
    onPaste?: () => void;
    onLibrary?: () => void;
    onSave?: (content: string) => void;
    onSaveToLibrary?: (content: string) => void;
    setIsLibraryOpen?: (isOpen: boolean) => void;
    isLibraryOpen?: boolean;
    documentId?: string;
    panelType?: 'left' | 'right' | 'middle';
    // Add these new props
    onSelect?: (content: string, name: string) => void;
    currentDocument?: string;
    onSetCurrentDocument?: (content: string, name: string) => void;
}

export default function DocumentPanel({
    mdContent,
    setMdContent,
    onSelect = () => { },
    onEdit = () => { },
    onPaste = () => { },
    onLibrary = () => { },
    onSave = () => { },
    onSaveToLibrary = () => { },
    documentId,
    setIsLibraryOpen = () => { },
    isLibraryOpen = false,
    panelType = 'middle' // Default to 'middle' panel type
}: DocumentPanelProps) {
    // Add debugging
    // console.log('DocumentPanel render - mdContent:', mdContent?.substring(0, 100) || 'empty');
    // console.log('DocumentPanel render - mdContent length:', mdContent?.length || 0);

    const dispatch = useDispatch();
    const documents = useSelector((state: RootState) => state.markdown.documents);
    const pathname = usePathname();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(mdContent || '');
    const [showDocumentList, setShowDocumentList] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";
    const message = { content: mdContent || '' }; // Default message content
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state

    // useEffect(() => {
    //     if (!mdContent) {
    //         setIsEditing(true);
    //     }
    // }, []);
    // Update editContent when mdContent changes from parent
    useEffect(() => {
        setEditContent(mdContent || '');
        console.log('60 DocumentPanel useEffect - mdContent updated:', mdContent?.substring(0, 100) || 'empty');
    }, [mdContent]);

    // Function to detect placeholders in the format [placeholder]
    useEffect(() => {
        if (!editContent) {
            setTemplatePlaceholders([]);
            return;
        }

        const placeholderRegex = /\[([^\[\]]+)\]/g;
        const placeholders: { text: string, start: number, end: number }[] = [];
        let match;

        while ((match = placeholderRegex.exec(editContent)) !== null) {
            placeholders.push({
                text: match[1],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        setTemplatePlaceholders(placeholders);
    }, [editContent]);

    // Handle document selection from the list
    const handleDocumentSelect = (doc: any) => {
        setMdContent(doc.content);
        setEditContent(doc.content);
        setShowDocumentList(false);
        onSelect(doc.content, doc.name);
    };

    // Add this function with your other handler functions
    const handleSaveToFile = (content: string) => {
        // Create a blob with the content
        const blob = new Blob([content], { type: 'text/markdown' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Extract title from first line for filename
        const firstLine = 'AIChat: ' + content.split('\n')[0].replace(/^[#\-*>`_]+\s*/, '');
        const cleanTitle = firstLine.replace(/[#*/\\:?<>|"]/g, '').trim().substring(0, 50); // Clean title for filename
        const fileName = `${cleanTitle || 'document'}.md`;

        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show confirmation
        setStatusMsg(`Saved "${fileName}" to downloads`);
        setTimeout(() => setStatusMsg(''), 30000);
    };

    const handleCancel = () => {
        // Don't clear mdContent when canceling, just reset editContent to original
        // setEditContent(mdContent || '');
        setEditContent('');
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        onEdit();
    };

    const handleSaveToLibrary = () => {
        // Save to library in Redux store
        const contentToSave = isEditing ? editContent : mdContent;

        const firstLine = contentToSave.includes('Domain Name')
            ? contentToSave.split('Domain Name:**')[1].split('\n')[1]?.trim().replace(/[#*/\\:?<>|"]/g, '') || ''
            : (contentToSave.split('\n')[0] || 'Document');
        const secondLine = contentToSave.includes('Domain Description')
            ? contentToSave.split('Domain Description:**')[1].split('\n')[1]?.trim().replace(/[#*/\\:?<>|"]/g, '') || ''
            : 'AIChat: Document';

        console.log('133 DocumentPanel handleSaveToLibrary - first:', firstLine, 'second:', secondLine, 'pathname:', pathname);

        if (pathname === '/domain-builder') {
            const domain = {
                name: firstLine,
                description: secondLine,
                presentation: contentToSave,
                prompt: '',
                additionalContext: '',
            }
            console.log('141 DomainBuilderPage dispatching domain data:', domain);
            dispatch(setDomainData({ ...domain }));
        } else {
            dispatch(saveMarkdownDocument({
                id: Date.now().toString(),
                name: firstLine,
                type: 'markdown',
                content: contentToSave,
                createdAt: new Date().toISOString()
            }));
            onSaveToLibrary(contentToSave);
        }
    };
    const handleSave = () => {
        dispatch(saveMarkdownDocument({
            id: documentId || Date.now().toString(),
            name: documentId ? 'Updated Document' : 'Document ' + Date.now(),
            type: 'markdown',
            content: editContent,
            createdAt: new Date().toISOString()
        }));
        onSave(editContent);
        setIsEditing(false);
    };

    // Define placeholders based on panel type
    const getPlaceholder = () => {
        if (panelType === 'left') {
            return 'Type, paste content, or load from library. This will be used as context for AI chat.';
        }
        return '' // 'Click Markdown Preview to view or edit your document.';
    };

    const getEmptyMessage = () => {
        if (panelType === 'left') {
            return (
                <span>
                    No current context text. Click
                    <Edit className="inline-block h-4 w-4 mx-1" />
                    to start writing or paste text.
                    Click
                    <Library className="inline-block h-4 w-4 mx-1" />
                    to load text from library document.
                </span>
            );
        }
        return 'No document selected!';
    };

    // Function to select and jump to a placeholder
    const selectTemplatePlaceholder = (idx: number) => {
        if (!textareaRef.current) return;

        const placeholder = templatePlaceholders[idx];
        if (!placeholder) return;

        // Focus the textarea
        textareaRef.current.focus();

        // Set selection range to highlight the placeholder
        textareaRef.current.setSelectionRange(
            placeholder.start,
            placeholder.end
        );

        // Scroll the placeholder into view if needed
        const textarea = textareaRef.current;

        // Get character position information
        const charInfo = getCaretCoordinates(textarea, placeholder.start);

        // Calculate scroll position
        if (charInfo) {
            const scrollTop = textarea.scrollTop;
            const offsetTop = charInfo.top;
            const textareaHeight = textarea.clientHeight;

            // Adjust scroll if needed to ensure the placeholder is visible
            if (offsetTop < scrollTop || offsetTop > scrollTop + textareaHeight - 30) {
                textarea.scrollTop = Math.max(0, offsetTop - textareaHeight / 2);
            }
        }
    };

    // Helper function to get caret coordinates in a textarea
    function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
        // Create a dummy element to measure text dimensions
        const div = document.createElement('div');
        // Copy styles that affect dimensions
        const styles = window.getComputedStyle(element);
        const props = [
            'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
            'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
            'width', 'lineHeight', 'textAlign', 'wordSpacing', 'whiteSpace'
        ];

        props.forEach(prop => {
            const value = styles[prop as keyof typeof styles];
            div.style[prop as any] = value !== null ? value.toString() : '';
        });

        // Set content up to the caret position
        div.textContent = element.value.substring(0, position);

        // Create a span where the caret would be
        const span = document.createElement('span');
        span.textContent = element.value.charAt(position) || '.';
        div.appendChild(span);

        // Position absolutely out of view
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);

        // Measure position
        const rect = span.getBoundingClientRect();
        const result = {
            top: rect.top - div.getBoundingClientRect().top,
            left: rect.left - div.getBoundingClientRect().left,
            height: rect.height
        };

        document.body.removeChild(div);
        return result;
    }

    return (
        <div className="p-2 flex h-full">
            {/* Document List Sidebar */}
            {showDocumentList && (
                <div className="w-[20%] bg-gray-800 border-r border-gray-600 flex flex-col mr-2 rounded-lg">
                    <div className="flex items-center justify-between p-3 border-b border-gray-600">
                        <h3 className="text-sm font-medium text-gray-300">Documents</h3>
                        <button
                            onClick={() => setShowDocumentList(false)}
                            className="text-gray-400 hover:text-white"
                            title="Hide document list"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {documents.length === 0 ? (
                            <div className="text-gray-400 text-sm p-4 text-center">
                                No documents in library
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {documents.map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => handleDocumentSelect(doc)}
                                        className="w-full text-left p-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors truncate"
                                        title={doc.name}
                                    >
                                        {doc.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                        {!showDocumentList && (
                            <button
                                onClick={() => setShowDocumentList(true)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                                title="Show document list"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                        <div className="text-sm text-gray-400">
                            {(panelType === 'left' ? 'Current text' : (panelType === 'middle' ? 'Current' : 'Markdown Preview'))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {(panelType === 'right') ? (
                            <>
                                <button
                                    title="Save to Library"
                                    onClick={handleSaveToLibrary}
                                    className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex items-center gap-1`}
                                >
                                    <BookmarkPlus className="h-4 w-4" />
                                </button>

                                <button
                                    title="Save to File"
                                    onClick={() => handleSaveToFile(message.content)}
                                    className={`text-xs ms-2 ${statusMsg === '' ? 'text-yellow-500 hover:text-yellow-300' : 'text-gray-400'} flex items-center gap-1`}
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                                {isEditing ? (
                                    <button
                                        onClick={() => {
                                            console.log('303 Applying changes:', editContent.substring(0, 100)); // Debug log
                                            console.log('304 Before setMdContent - current mdContent:', mdContent?.substring(0, 100) || 'empty');
                                            // Update parent component's state
                                            setMdContent(editContent);
                                            setIsEditing(false);
                                            // Also call onSave to notify parent components
                                            onSave(editContent);
                                            console.log('After setMdContent - editContent applied:', editContent.substring(0, 100) || 'empty');
                                        }}
                                        className="p-1.5 text-green-500 hover:text-green-200 hover:bg-gray-800 rounded-md"
                                        title="Apply changes"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            onEdit();
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                                        title="Edit document"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setMdContent(''); // Clear content
                                        setEditContent(''); // Clear edit content
                                        // setIsEditing(false); // Exit editing mode
                                        // onEdit(); // Call parent edit handler
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md"
                                    title="Clear content"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsLibraryOpen(true)}
                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                                    title="Open library modal"
                                >
                                    <Library className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleSaveToLibrary}
                                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-md"
                                    title="Save to library"
                                >
                                    <BookmarkPlus className="h-4 w-4" />
                                </button>
                                {isEditing ? (
                                    <button
                                        onClick={() => {
                                            console.log('303 Applying changes:', editContent.substring(0, 100)); // Debug log
                                            console.log('304 Before setMdContent - current mdContent:', mdContent?.substring(0, 100) || 'empty');
                                            // Update parent component's state
                                            setMdContent(editContent);
                                            setIsEditing(false);
                                            // Also call onSave to notify parent components
                                            onSave(editContent);

                                            console.log('After setMdContent - editContent applied:', editContent.substring(0, 100) || 'empty');
                                        }}
                                        className="p-1.5 text-green-500 hover:text-green-200 hover:bg-gray-800 rounded-md"
                                        title="Apply changes"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            onEdit();
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                                        title="Edit document"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setMdContent(''); // Clear content
                                        setEditContent(''); // Clear edit content
                                        setIsEditing(false); // Exit editing mode
                                        onEdit(); // Call parent edit handler
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md"
                                    title="Clear content"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {isEditing ? (
                    <div className="relative flex-1">
                        {/* Add placeholder jump buttons */}
                        {templatePlaceholders.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                                <span className="text-sm text-gray-400">Edit placeholders: </span>
                                {templatePlaceholders.map((placeholder, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => selectTemplatePlaceholder(idx)}
                                        className={buttonAccent}
                                    >
                                        {placeholder.text.length > 50
                                            ? `${placeholder.text.substring(0, 49)}...`
                                            : placeholder.text}
                                    </button>
                                ))}
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            autoFocus
                            placeholder={getPlaceholder()}
                            value={editContent || ''}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                                // Add tab key navigation for placeholders
                                if (e.key === 'Tab' && templatePlaceholders.length > 0) {
                                    e.preventDefault(); // Prevent default tab behavior

                                    // Get current cursor position
                                    const cursorPos = e.currentTarget.selectionStart;

                                    // Find the next placeholder after cursor position
                                    let nextPlaceholder = templatePlaceholders.find(p => p.start > cursorPos);

                                    // If no next placeholder, loop back to the first one
                                    if (!nextPlaceholder && templatePlaceholders.length > 0) {
                                        nextPlaceholder = templatePlaceholders[0];
                                    }

                                    // Select the placeholder if found
                                    if (nextPlaceholder) {
                                        selectTemplatePlaceholder(templatePlaceholders.indexOf(nextPlaceholder));
                                    }
                                }
                            }}
                            className="w-full h-[80vh] bg-gray-800 text-gray-200 p-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                        />
                        <button
                            className="absolute bottom-3 right-3 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1.5 rounded-md text-xs flex items-center gap-1 opacity-70 hover:opacity-100"
                            onClick={() => {
                                navigator.clipboard.readText().then(
                                    text => setEditContent(prev => prev + text),
                                    err => console.error('Failed to read clipboard:', err)
                                );
                            }}
                        >
                            <Clipboard className="h-3.5 w-3.5" />
                            <span>Paste</span>
                        </button>
                    </div>
                ) : (
                    <div className="prose prose-invert custom-markdown markdown-preview p-1 rounded-md overflow-auto max-h-[80vh] max-w-full whitespace-pre-wrap break-words flex-1">
                        {mdContent ? (
                            <MarkdownPreview mdPreview={mdContent} />
                        ) : (
                            <div className="text-sm text-gray-400 p-4">
                                {getEmptyMessage()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}