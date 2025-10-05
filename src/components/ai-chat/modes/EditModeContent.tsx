'use client';

import { useEffect, useState } from 'react';
import { DocumentMetadataHeader } from '@/components/ai-chat/DocumentMetadataHeader';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { Button } from '@/components/ui/button';
import TextareaAutosize from 'react-textarea-autosize';

interface EditModeContentProps {
    documentName: string;
    setDocumentName: (name: string) => void;
    documentType: string;
    setDocumentType: (type: string) => void;
    currentDocument: string;
    handleSetCurrentDocument: (content: string) => void;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
    previewContent: string;
    setPreviewContent: (content: string) => void;
    onSaveToLibrary: () => void;
}

export const EditModeMiddlePanel = ({
    documentName,
    setDocumentName,
    documentType,
    setDocumentType,
    currentDocument,
    handleSetCurrentDocument,
}: Omit<EditModeContentProps, 'onSaveToLibrary' | 'isLibraryOpen' | 'libraryTarget' | 'openLibraryFor' | 'closeLibrary' | 'previewContent' | 'setPreviewContent'>) => {
    const [localContent, setLocalContent] = useState(currentDocument);

    useEffect(() => {
        setLocalContent(currentDocument);
    }, [currentDocument]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setLocalContent(newContent);
        handleSetCurrentDocument(newContent);
    };

    return (
        <div className="flex flex-col bg-background rounded-lg h-full overflow-hidden">
            <DocumentMetadataHeader
                documentName={documentName}
                setDocumentName={setDocumentName}
                documentType={documentType}
                setDocumentType={setDocumentType}
                currentDocument={localContent}
            />
            <div className="flex-grow overflow-hidden p-4">
                <TextareaAutosize
                    value={localContent}
                    onChange={handleContentChange}
                    className="w-full h-full bg-gray-900 text-gray-100 p-4 rounded border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                    placeholder="Start typing your document..."
                    minRows={10}
                />
            </div>
        </div>
    );
};

EditModeMiddlePanel.displayName = 'EditModeMiddlePanel';

export const EditModeRightPanel = ({
    currentDocument,
    onSaveToLibrary,
}: {
    currentDocument: string;
    onSaveToLibrary: () => void;
}) => {
    const [displayContent, setDisplayContent] = useState(currentDocument);

    useEffect(() => {
        setDisplayContent(currentDocument);
    }, [currentDocument]);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-300">
                    Live Preview ({displayContent.length} chars)
                </h3>
                <Button
                    onClick={onSaveToLibrary}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    Save to Library
                </Button>
            </div>
            <div className="flex-1 overflow-auto px-4 py-4">
                <MarkdownPreview
                    mdPreview={displayContent}
                    variant="default"
                />
            </div>
        </div>
    );
};

EditModeRightPanel.displayName = 'EditModeRightPanel';

export function EditModeContent(props: EditModeContentProps) {
    return {
        middlePanel: <EditModeMiddlePanel {...props} />,
        rightPanel: <EditModeRightPanel
            currentDocument={props.currentDocument}
            onSaveToLibrary={props.onSaveToLibrary}
        />,
    };
}
