'use client';

import { MessageSquare, Edit, Trash2, Calendar, FileText } from 'lucide-react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';

interface ViewModeMiddlePanelProps {
    currentDocument: string;
    document?: MarkdownDocument;
    onEdit: () => void;
    onChatWithDoc: () => void;
    onDelete?: () => void;
}

export function ViewModeMiddlePanel({
    currentDocument,
    document,
    onEdit,
    onChatWithDoc,
    onDelete,
}: ViewModeMiddlePanelProps) {
    // Debug logging
    console.log('ViewModeMiddlePanel render:', {
        hasCurrentDocument: !!currentDocument,
        currentDocumentLength: currentDocument?.length,
        hasDocument: !!document,
        documentName: document?.name
    });

    // Show empty state if no document is selected
    if (!currentDocument || currentDocument.trim() === '') {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center text-gray-400 space-y-2 p-8">
                    <FileText className="w-16 h-16 mx-auto opacity-50" />
                    <p className="text-lg font-medium">No document selected</p>
                    <p className="text-sm">Select a document from the library to view it here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Document metadata header - only show if we have document metadata */}
            {document && (
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50 space-y-2 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 w-full">
                            <h2 className="text-lg font-semibold text-gray-100">{document.name}</h2>
                            <div className="flex items-center gap-3 ms-auto mt-1 text-xs text-gray-400 ml-auto">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {document.type || 'Markdown'}
                                </span>
                                {document.createdAt && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(document.createdAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    {/* <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={onChatWithDoc}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Chat with AI
                        </button>
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors ml-auto"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                    </div> */}
                </div>
            )}

            {/* Document preview - this should always show if we have content */}
            <div className="flex-1 overflow-auto px-4 py-4 bg-background">
                <MarkdownPreview mdPreview={currentDocument} variant="default" />
            </div>
        </div>
    );
}
