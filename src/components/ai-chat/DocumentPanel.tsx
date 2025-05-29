'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { Edit, Clipboard, Library, Save, X, BookmarkPlus, Check } from 'lucide-react';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';

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
    documentId?: string; // Optional document ID for updates
    panelType?: 'left' | 'right'; // Optional panel type for layout
}

export default function DocumentPanel({
    mdContent,
    setMdContent,
    onEdit = () => { },
    onPaste = () => { },
    onLibrary = () => { },
    onSave = () => { },
    onSaveToLibrary = () => { },
    documentId,
    setIsLibraryOpen = () => { },
    isLibraryOpen = false,
    panelType = 'left' // Default to 'left' panel type
}: DocumentPanelProps) {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(mdContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";

    useEffect(() => {
        if (!mdContent) {
            setIsEditing(true);
        }
    }, []);
    // Update editContent when mdContent changes from parent
    useEffect(() => {
        setEditContent(mdContent);
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

    const handleCancel = () => {
        setEditContent('');
        setMdContent('');
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        onEdit();
    };

    const handleSaveToLibrary = () => {
        // Save to library in Redux store
        const contentToSave = isEditing ? editContent : mdContent;

        const firstLine = 'AIChat: ' + (contentToSave.split('\n')[0] || 'AIChat: Document');
        dispatch(saveMarkdownDocument({
            id: Date.now().toString(),
            name: firstLine,
            content: contentToSave,
            createdAt: new Date().toISOString()
        }));

        // Also call the prop callback for parent components
        onSaveToLibrary(contentToSave);
    };

    const handleSave = () => {
        dispatch(saveMarkdownDocument({
            id: documentId || Date.now().toString(),
            name: documentId ? 'Updated Document' : 'Document ' + Date.now(),
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
            return 'No response document. Click Edit to start writing or Library to load content.';
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
        <div className="p-2">
            <>
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="text-sm text-gray-400">{(panelType === 'left' ? 'Current text' : 'Markdown Preview')}</div>
                    <div className="flex gap-2">
                        {(panelType === 'right') ? (
                            <button
                                onClick={handleSaveToLibrary}
                                className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-md"
                                title="Save to library"
                            >
                                <BookmarkPlus className="h-4 w-4" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsLibraryOpen(true)}
                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                                    title="Open library modal"
                                >
                                    <Library className="h-4 w-4" />
                                </button>
                                {isEditing ? (
                                <button
                                    onClick={() => { setMdContent(editContent); setIsEditing(false); }}
                                    className="p-1.5 text-green-500 hover:text-green-200 hover:bg-gray-800 rounded-md"
                                    title="Apply changes"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                                    title="Edit document"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                )}
                                <button
                                    onClick={handleCancel}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md"
                                    title="Cancel editing"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </>
            {
                isEditing ? (
                    <div className="relative">
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
                            value={editContent}
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
                    <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto max-h-[80vh] max-w-full whitespace-pre-wrap break-words">
                        {/* <MarkdownPreview mdPreview={mdPreview} /> */}
                        <MarkdownPreview mdPreview={mdContent} />
                    </div>
                )
            }
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                {(!mdContent && !editContent) && <div className="text-sm">{getEmptyMessage()}</div>}
            </div>
        </div >
    );
}