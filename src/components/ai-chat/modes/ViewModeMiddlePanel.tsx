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
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-transparent">
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={onChatWithDoc}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-700/80 hover:bg-blue-600 text-[11px] text-white transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    </button>
                    <span className="font-semibold text-gray-200 break-words whitespace-pre-line">
                        {document?.name || 'Current Document'}
                    </span>
                    <span className="ml-4 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-400">
                        {document?.type || 'Markdown'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto px-4 py-4">
                <div className="mx-auto w-full max-w-3xl">
                    {currentDocument ? (
                        <MarkdownPreview mdPreview={currentDocument} variant="default" />
                    ) : (
                        <div className="text-center text-gray-400 p-8">
                            <p className="text-sm">No document to view</p>
                            <p className="text-sm text-green-400 mt-2">
                                Use the AI Chat tab above to generate a new document,<br />
                                or select an existing document from the library (in the left panel), to view it here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
