'use client';

import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import type { MarkdownDocument } from '@/features/model-universe/modelSlice';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import { useDispatch } from 'react-redux';
import { setDomainData, updateProjectInfo, setFocusDoc } from '@/features/model-universe/modelSlice';
import extractDomainNameAndDescription from '@/components/ai-chat/docExtraction';
import { toast } from 'sonner';
import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';

interface ViewModeMiddlePanelProps {
    currentDocument: string;
    document?: MarkdownDocument;
    onEdit: () => void;
    onChatWithDoc: () => void;
    onDelete?: () => void;
    onSetAdditionalContext?: (content: string, doc?: MarkdownDocument) => void;
    onSetCurrent?: (content: string, name: string, doc?: MarkdownDocument) => void;
    onSetProjectPlan?: (doc: MarkdownDocument) => void;
    onSetDomain?: (content: string, name: string, type: string, e?: React.MouseEvent) => void;
    onNewDocument?: () => void;
}


export function ViewModeMiddlePanel({
    currentDocument,
    document,
    onEdit,
    onChatWithDoc,
    onDelete,
    onNewDocument,
    // onSetAdditionalContext,
    // onSetCurrent,
    // onSetProjectPlan,
    // onSetDomain,
}: ViewModeMiddlePanelProps) {
    const dispatch = useDispatch();
    // Debug: Log what we're rendering
    console.log('📄 ViewModeMiddlePanel render:', {
        hasDocument: !!document,
        documentName: document?.name,
        documentType: document?.type,
        currentDocumentLength: currentDocument?.length,
    });

    // Handler implementations (copied/adapted from MarkdownLibrary)
    const handleSetAdditionalContext = () => {
        if (!document) return;
        dispatch(setDomainData({
            name: document.name,
            description: '',
            presentation: document.content,
            prompt: '',
            additionalContext: document.content
        }));
        toast.success('Additional context updated');
    };

    const handleSetCurrent = () => {
        if (!document) return;
        dispatch(setFocusDoc({ id: document.id, name: document.name }));
        toast.success(`Current document set: ${document.name}`);
    };

    const handleSetProjectPlan = () => {
        if (!document) return;
        dispatch(updateProjectInfo({ id: document.id, name: document.name }));
        toast.success(`Project "${document.name}" set as focus`);
    };

    const handleSetDomain = (e?: React.MouseEvent) => {
        if (!document) return;
        const trimmedDocName = document.name?.trim() || '';
        const { name: extractedName, description } = extractDomainNameAndDescription(document.content || currentDocument);
        const domainName = trimmedDocName || extractedName;
        dispatch(setDomainData({
            name: domainName,
            description: description || '',
            presentation: document.content || currentDocument,
            prompt: '',
            additionalContext: ''
        }));
        toast.success(`Domain data "${domainName}" saved from document.`);
        if (e) e.stopPropagation();
    };

    const panelLabel = useMemo(() => {
        const formatType = (value?: string) => {
            if (!value) return undefined;
            const trimmed = value.trim();
            if (!trimmed) return undefined;
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        };

        const parts = [
            document?.name || 'Current Document',
            formatType(document?.type)
        ].filter(Boolean);
        // const label = parts.length > 0 ? parts.join(' • ') : 'Current Document'; //
        return (
            <span className="flex items-center gap-1">
                {/* {allowDocumentList && !isDocumentListVisible && (
                        <button
                            onClick={() => setIsDocumentListVisible(true)}
                            className="p-1 border border-gray-700 bg-gray-800 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-md"
                            title="Show document list"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )} */}
                {/* {label} */}
            </span>
        );
    }, [document]);


    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-transparent">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-200 break-words whitespace-pre-line">
                        {document?.name || 'Current Document'}
                    </span>
                    <span className="ml-4 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-400">
                        {document?.type || 'Markdown'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                </div>
                {/* Action buttons header */}
                <div className="flex flex-wrap gap-2 bg-gray-500/50 py-1 rounded ml-auto items-center">
                    <span className="text-sm text-gray-400 ps-2">Set as:</span>
                    <button
                        className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        onClick={handleSetAdditionalContext}
                    >
                        Additional Context
                    </button>
                    <button
                        className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        onClick={handleSetCurrent}
                    >
                        Current Document
                    </button>
                    <button
                        className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded"
                        onClick={handleSetProjectPlan}
                    >
                        Project Plan
                    </button>
                    <button
                        className="flex items-center gap-1 text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded"
                        onClick={handleSetDomain}
                    >
                        Domain
                    </button>
                    {onNewDocument && (
                        <button
                            onClick={onNewDocument}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-md"
                            title="New document from template"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    )}
                    <div className="text-sm text-gray-400">
                        {panelLabel}
                    </div>
                </div>
            </div>
            {/* Document Content */}
            <div className="flex-1 overflow-auto bg-background/50">
                {/* <div className="mx-auto w-full max-w-3xl"> */}
                {currentDocument ? (
                    <DocumentPanel
                        mdContent={currentDocument}
                        onClearDocument={onDelete}
                    />
                    // <MarkdownPreview mdPreview={currentDocument} variant="default" />
                ) : (
                    <div className="text-center text-gray-400 p-8">
                        <p className="text-sm">No document to view</p>
                        <p className="text-sm text-green-400 mt-2">
                            Use the AI Chat tab above to generate a new document,<br />
                            or select an existing document from the library (in the left panel), to view it here.
                        </p>
                    </div>
                )}
                {/* </div> */}
            </div>
        </div>
    );
}
