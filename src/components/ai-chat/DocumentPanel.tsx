'use client';
import React, { useState, useEffect } from 'react';
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
}: DocumentPanelProps) {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(mdContent);

    useEffect(() => {
        if (!mdContent) {
            setIsEditing(true);
        }
    }, []);

    // Update editContent when mdContent changes from parent
    useEffect(() => {
        setEditContent(mdContent);
    }, [mdContent]);

    // const handleSave = () => {
    //     // Save to Redux store using the proper action creator
    //     dispatch(saveMarkdownDocument({
    //         id: documentId || Date.now().toString(),
    //         name: documentId ? 'Updated Document' : 'Document ' + Date.now(),
    //         content: editContent,
    //         createdAt: new Date().toISOString()
    //     }));

    //     // Also call the prop callback for parent components
    //     onSave(editContent);
    //     setIsEditing(false);
    // };

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

    // const handleSaveToRedux = () => {
    //     if (!docName.trim()) return;
    //     console.log('Saving to Redux:', {
    //         id: Date.now().toString(),
    //         name: docName,
    //         content: mdPreview
    //     });
    //     dispatch(saveMarkdownDocument({
    //         id: Date.now().toString(),
    //         name: docName,
    //         content: mdPreview,
    //         createdAt: new Date().toISOString()
    //     }));
    //     // Show success notification
    //     alert('Document saved to library');
    //     // Add this to check if documents are updated after dispatch
    //     console.log('Documents after save:', documents);
    // };

    return (
        <div className="p-2">
            {/* {mdContent && ( */}
            <>
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="text-sm text-gray-400">Current context</div>
                    <div className="flex items-center gap-2">
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
                            <>
                                <button
                                    onClick={() => { setMdContent(editContent); setIsEditing(false); }}
                                    className="p-1.5 text-green-500 hover:text-green-200 hover:bg-gray-800 rounded-md"
                                    title="Apply changes"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                            </>
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
                    </div>
                </div>
            </>
            {/* )} */}
            {isEditing ? (
                <textarea
                    autoFocus
                    placeholder='Type here..., or paste your content..., or open library'
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-[80vh] bg-gray-800 text-gray-200 p-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                />
            ) : (
                <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto max-h-[80vh] max-w-full whitespace-pre-wrap break-words">
                    <MarkdownPreview mdPreview={mdContent} />
                </div>
            )}
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                {(!mdContent && !editContent) && <div className="text-sm">No document selected!</div>}
            </div>
        </div>
    );
}