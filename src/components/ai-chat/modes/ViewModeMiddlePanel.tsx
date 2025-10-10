'use client';

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
    // Debug: Log what we're rendering
    console.log('📄 ViewModeMiddlePanel render:', {
        hasDocument: !!document,
        documentName: document?.name,
        documentType: document?.type,
        currentDocumentLength: currentDocument?.length,
    });

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Document Header with Name and Type */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2 flex-1">
                    <span className="font-semibold text-gray-200 break-words whitespace-pre-line">
                        {document?.name || 'Current Document'}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-400">
                        {document?.type || 'Markdown'}
                    </span>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto px-4 py-4">
                <div className="mx-auto w-full max-w-3xl">
                    {currentDocument ? (
                        <MarkdownPreview mdPreview={currentDocument} variant="default" />
                    ) : (
                        <div className="text-center text-gray-400 p-8">
                            <p className="text-sm">No document selected</p>
                            <p className="text-xs mt-2">
                                Select a document from the library to view it here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
