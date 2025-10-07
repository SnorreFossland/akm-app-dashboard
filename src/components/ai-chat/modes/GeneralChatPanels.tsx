'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import type { DomainData } from '@/features/model-universe/modelSlice';
import { BookmarkPlus, X, Check, Edit } from 'lucide-react';

interface GeneralChatPanelsProps {
    domain: DomainData | null;
    contextContent: string;
    setContextContent: (content: string) => void;
    currentDocument: string;
    previewContent: string;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
    handleSetCurrentDocument: (content: string) => void;
    // Chat state from parent
    chatInput: string;
    setChatInput: (input: string) => void;
    chatSelectedModel: string;
    setChatSelectedModel: (model: string) => void;
    chatMdPreview: string;
    setChatMdPreview: (preview: string) => void;
    chatShowLeftPanel: boolean;
    setChatShowLeftPanel: (show: boolean) => void;
    chatShowRightPanel: boolean;
    setChatShowRightPanel: (show: boolean) => void;
    chatMessages: any[];
    setChatMessages: (messages: any[]) => void;
    includeDomainContext: boolean;
    setIncludeDomainContext: (include: boolean) => void;
    documentName?: string;
    documentType?: string;
    onSavePreviewToLibrary?: (content: string, name?: string, type?: string) => void;
}

function PreviewPanel({
    chatMdPreview,
    setChatMdPreview,
    onSavePreviewToLibrary,
    documentName: parentDocumentName,
    documentType: parentDocumentType,
}: {
    chatMdPreview: string;
    setChatMdPreview: (preview: string) => void;
    onSavePreviewToLibrary?: (content: string, name?: string, type?: string) => void;
    documentName?: string;
    documentType?: string;
}) {
    const [isEditingPreview, setIsEditingPreview] = useState(false);
    const [previewEditContent, setPreviewEditContent] = useState('');

    // Use parent name/type if provided
    const displayName = parentDocumentName || 'AI Response';
    const displayType = parentDocumentType || 'ai-response';

    // Sync preview edit content when chatMdPreview changes
    useEffect(() => {
        if (!isEditingPreview) {
            setPreviewEditContent(chatMdPreview || '');
        }
    }, [chatMdPreview, isEditingPreview]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {chatMdPreview ? (
                <>
                    {/* Document Header with Name and Type */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-200 truncate">
                                {displayName}
                            </h3>
                            <span className="text-xs text-gray-400">
                                {displayType}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/30">
                        {isEditingPreview ? (
                            <>
                                <button
                                    onClick={() => {
                                        setChatMdPreview(previewEditContent);
                                        setIsEditingPreview(false);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                                    title="Apply changes"
                                >
                                    <Check className="h-3 w-3" />
                                    Apply
                                </button>
                                <button
                                    onClick={() => {
                                        setPreviewEditContent(chatMdPreview);
                                        setIsEditingPreview(false);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
                                    title="Cancel editing"
                                >
                                    <X className="h-3 w-3" />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setPreviewEditContent(chatMdPreview);
                                        setIsEditingPreview(true);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
                                    title="Edit preview"
                                >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setChatMdPreview('')}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
                                    title="Clear preview"
                                >
                                    <X className="h-3 w-3" />
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        console.group('🔵 Preview Save Button Clicked');
                                        console.log('Current name/type:', {
                                            displayName,
                                            displayType,
                                            parentDocumentName,
                                            parentDocumentType,
                                            contentLength: chatMdPreview?.length
                                        });

                                        if (onSavePreviewToLibrary && chatMdPreview) {
                                            console.log('✅ Calling save with:', {
                                                name: displayName,
                                                type: displayType
                                            });
                                            onSavePreviewToLibrary(chatMdPreview, displayName, displayType);
                                        } else {
                                            console.error('❌ Cannot save');
                                        }
                                        console.groupEnd();
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                                    title="Save preview to library"
                                >
                                    <BookmarkPlus className="h-3 w-3" />
                                    Save to Library
                                </button>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto px-4 py-4">
                        {isEditingPreview ? (
                            <textarea
                                value={previewEditContent}
                                onChange={(e) => setPreviewEditContent(e.target.value)}
                                className="w-full h-full bg-gray-800 text-gray-200 p-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                                placeholder="Edit preview content..."
                            />
                        ) : (
                            <MarkdownPreview mdPreview={chatMdPreview} variant="default" />
                        )}
                    </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center px-4 py-4">
                    <div className="text-center text-gray-400">
                        <p className="text-sm">No preview available</p>
                        <p className="text-xs mt-2">Click "Show Preview" on an AI response to view it here</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export function GeneralChatPanels(props: GeneralChatPanelsProps) {
    const {
        domain,
        contextContent,
        setContextContent,
        currentDocument,
        isLibraryOpen,
        libraryTarget,
        openLibraryFor,
        closeLibrary,
        handleSetCurrentDocument,
        chatInput,
        setChatInput,
        chatSelectedModel,
        setChatSelectedModel,
        chatMdPreview,
        setChatMdPreview,
        chatShowLeftPanel,
        setChatShowLeftPanel,
        chatShowRightPanel,
        setChatShowRightPanel,
        chatMessages,
        setChatMessages,
        includeDomainContext,
        setIncludeDomainContext,
        documentName,
        documentType,
        onSavePreviewToLibrary,
    } = props;

    const handleResponseChange = (response: string) => {
        // setChatMdPreview(response);
    };

    const handleViewInMarkdown = (response: string) => {
        setChatMdPreview(response);
    };


    return {
        leftPanelContent: {
            tabs: [
                {
                    key: 'domain',
                    label: 'Domain',
                    content: (
                        <div className="h-full overflow-auto px-2 py-2">
                            {domain?.presentation ? (
                                <MarkdownPreview mdPreview={domain.presentation} variant="compact" />
                            ) : (
                                <div className="text-sm text-gray-400">No domain presentation available.</div>
                            )}
                        </div>
                    ),
                },
                {
                    key: 'document',
                    label: 'Current Document',
                    content: (
                        <div className="h-full overflow-auto px-4 py-4">
                            {currentDocument ? (
                                <MarkdownPreview mdPreview={currentDocument} variant="default" />
                            ) : (
                                <div className="text-center text-gray-400 p-8">
                                    <p className="text-sm">No document selected</p>
                                    <p className="text-xs mt-2">Select a document from the library</p>
                                </div>
                            )}
                        </div>
                    ),
                },
            ],
            defaultTab: 'domain',
        },
        middlePanelContent: {
            tabs: [
                {
                    key: 'chat',
                    label: 'AI Chat',
                    content: (
                        <ChatComponent
                            input={chatInput}
                            setInput={setChatInput}
                            selectedModel={chatSelectedModel}
                            setSelectedModel={setChatSelectedModel}
                            onResponseChange={handleResponseChange}
                            onViewInMarkdown={handleViewInMarkdown}
                            showLeftPanel={chatShowLeftPanel}
                            setShowLeftPanel={setChatShowLeftPanel}
                            showRightPanel={chatShowRightPanel}
                            setShowRightPanel={setChatShowRightPanel}
                            mdContent={contextContent}
                            setMdContent={setContextContent}
                            currentDocument={currentDocument}
                            setCurrentDocument={handleSetCurrentDocument}
                            mdPreview={chatMdPreview}
                            setMdPreview={setChatMdPreview}
                            setCurrentMessages={setChatMessages}
                            includeDomainContext={includeDomainContext}
                            setIncludeDomainContext={setIncludeDomainContext}
                            gettingStartedGuide={
                                <div className="text-center text-gray-400">
                                    <h3 className="text-lg font-semibold mb-2">Welcome to AI Chat</h3>
                                    <p className="text-sm">Start a conversation with the AI assistant.</p>
                                    <p className="text-xs mt-2">Use Context Docs to provide background information.</p>
                                </div>
                            }
                        />
                    ),
                },
            ],
            defaultTab: 'chat',
        },
        rightPanelContent: {
            tabs: [
                {
                    key: 'preview',
                    label: 'Preview',
                    content: (
                        <PreviewPanel
                            chatMdPreview={chatMdPreview}
                            setChatMdPreview={setChatMdPreview}
                            onSavePreviewToLibrary={onSavePreviewToLibrary}
                            documentName={documentName}
                            documentType={documentType}
                        />
                    ),
                },
                {
                    key: 'library',
                    label: 'Library',
                    content: (
                        <div className="h-full overflow-auto px-2 py-2">
                            <MarkdownLibrary
                                onSelect={(content) => setContextContent(content)}
                                hideExportLibraryButton={true}
                                onSetCurrentDocument={handleSetCurrentDocument}
                                currentDocument={currentDocument}
                            />
                        </div>
                    ),
                },
            ],
            defaultTab: 'preview',
        },
    };
}
