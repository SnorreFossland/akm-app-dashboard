'use client';

import ChatComponent from '@/components/ai-chat/ChatComponent';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { buildLeftPanelTabs } from './sharedPanelBuilders';
import type { DomainData, MarkdownDocument } from '@/features/model-universe/modelSlice';
import { BookmarkPlus, X, Check, Edit, FilePlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
    onSavePreviewToLibrary?: (content: string, name?: string, type?: string, options?: { forceNew?: boolean }) => void;
    onCreateDocumentFromTemplate?: () => void;
    projectDocument?: MarkdownDocument | null;
    // New optional free-text additional context for General chat (no library)
    additionalContext?: string;
    setAdditionalContext?: (content: string) => void;
}

export function GeneralChatPanels(props: GeneralChatPanelsProps) {
    const {
        domain,
        contextContent,
        setContextContent,
        currentDocument,
        additionalContext,
        setAdditionalContext,
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
        onCreateDocumentFromTemplate,
        projectDocument,
    } = props;

    const handleResponseChange = (response: string) => {
        // future hook point
    };

    const handleViewInMarkdown = (response: string) => {
        setChatMdPreview(response);
        // Set preview name to first line of response (strip markdown heading markers)
        const firstLine = response.split('\n')[0].replace(/^#+\s*/, '').trim();
        if (firstLine) {
            // Optionally: expose a setter for previewName via props or context
            // For this file, use window event as a workaround
            window.dispatchEvent(new CustomEvent('aiChat_setPreviewName', { detail: { previewName: firstLine } }));
        }
    };

    // Build a consistent base left-panel (domain + projects) and include Additional Context.
    const baseLeftPanel = buildLeftPanelTabs({
        domain,
        projectDocument,
        currentDocument,
        onCreateDocumentFromTemplate,
        includeLibrary: false, // General chat should not show the library list
        onSetCurrentDocument: handleSetCurrentDocument,
        includeAdditional: true, // put Additional Context into the shared tabs
        additionalContext: additionalContext || '',
        setAdditionalContext: setAdditionalContext,
    });

    const documentTab = {
        key: 'document',
        label: 'Current Document',
        content: (
            <div className="h-full overflow-auto px-4 py-4">
                <MarkdownPreview mdPreview={currentDocument} variant="default" />
            </div>
        ),
    };

    const leftPanelContent = {
        ...baseLeftPanel,
        // Ensure the Current Document tab is available in General chat
        tabs: [...(baseLeftPanel.tabs || []), documentTab],
        defaultTab: baseLeftPanel.defaultTab || 'domain',
    };

    // Right panel: only Preview kept for General chat (library removed so the document list is hidden)
    const rightPanelContent = {
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <PreviewPanel
                        chatMdPreview={chatMdPreview}
                        setChatMdPreview={setChatMdPreview}
                        onSavePreviewToLibrary={props.onSavePreviewToLibrary}
                        documentName={props.documentName}
                        documentType={props.documentType}
                    />
                ),
            },
        ],
        defaultTab: 'preview',
    };

    return {
        leftPanelContent,
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
                            additionalContext={additionalContext}
                            setAdditionalContext={setAdditionalContext}
                            documentName={props.documentName}
                            documentType={props.documentType}
                            mdPreview={chatMdPreview}
                            setMdPreview={setChatMdPreview}
                            setCurrentMessages={setChatMessages}
                            includeDomainContext={includeDomainContext}
                            setIncludeDomainContext={setIncludeDomainContext}
                            gettingStartedGuide={
                                <div className="text-center text-gray-400">
                                    <h3 className="text-lg font-semibold mb-2">Welcome to AI Chat</h3>
                                    <p className="text-sm">Start a conversation with the AI assistant or select a prompt template to get started.</p>
                                    <p className="text-xs mt-2">Use Context Docs to provide background information.</p>
                                </div>
                            }
                        />
                    ),
                },
            ],
            defaultTab: 'chat',
        },
        rightPanelContent,
    };

    // Extract preview panel into a separate component where hooks are allowed
    function PreviewPanel({
        chatMdPreview,
        setChatMdPreview,
        onSavePreviewToLibrary,
        documentName: parentDocumentName,
        documentType: parentDocumentType,
    }: {
        chatMdPreview: string;
        setChatMdPreview: (preview: string) => void;
        onSavePreviewToLibrary?: (content: string, name?: string, type?: string, options?: { forceNew?: boolean }) => void;
        documentName?: string;
        documentType?: string;
    }) {
        const [isEditingPreview, setIsEditingPreview] = useState(false);
        const [previewEditContent, setPreviewEditContent] = useState('');
        const defaultName = parentDocumentName || 'AI Response';
        const defaultType = parentDocumentType || 'ai-response';
        const [previewName, setPreviewName] = useState(defaultName);
        const [previewType, setPreviewType] = useState(defaultType);

        console.log('🔷 PreviewPanel render:', {
            hasParentDocumentName: !!parentDocumentName,
            parentDocumentName,
            parentDocumentType,
            previewName,
            previewType
        });

        // Sync preview edit content when chatMdPreview changes
        useEffect(() => {
            if (!isEditingPreview) {
                setPreviewEditContent(chatMdPreview || '');
            }
        }, [chatMdPreview, isEditingPreview]);

        useEffect(() => {
            setPreviewName(defaultName);
            setPreviewType(defaultType);
        }, [defaultName, defaultType]);

        return (
            <div className="h-full flex flex-col overflow-hidden">
                {chatMdPreview ? (
                    <>
                        {/* Document Header with Name and Type */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-200 truncate">
                                    {previewName}
                                </h3>
                                <span className="text-xs text-gray-400">
                                    {previewType}
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
                                                previewName,
                                                previewType,
                                                parentDocumentName,
                                                parentDocumentType,
                                                contentLength: chatMdPreview?.length
                                            });

                                            if (onSavePreviewToLibrary && chatMdPreview) {
                                                console.log('✅ Calling save with:', {
                                                    name: previewName,
                                                    type: previewType
                                                });
                                                onSavePreviewToLibrary(chatMdPreview, previewName, previewType);
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
                                    <button
                                        onClick={() => {
                                            console.group('🆕 Preview Save-As-New Clicked');
                                            console.log('Current name/type:', {
                                                previewName,
                                                previewType,
                                                parentDocumentName,
                                                parentDocumentType,
                                                contentLength: chatMdPreview?.length
                                            });

                                            if (onSavePreviewToLibrary && chatMdPreview) {
                                                onSavePreviewToLibrary(chatMdPreview, previewName, previewType, { forceNew: true });
                                            } else {
                                                console.error('❌ Cannot save as new');
                                            }
                                            console.groupEnd();
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
                                        title="Save preview as new library document"
                                    >
                                        <FilePlus className="h-3 w-3" />
                                        Save as New
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto px-4 py-4">
                            {isEditingPreview ? (
                                <>
                                    <div className="mb-3 flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={previewName}
                                            onChange={e => {
                                                if (!props.documentName) {
                                                    setPreviewName(e.target.value);
                                                }
                                            }}
                                            disabled={!!props.documentName}
                                            className="px-2 py-1 text-sm rounded bg-gray-700 text-gray-200 border border-gray-600 focus:border-blue-500 focus:outline-none w-1/2"
                                            placeholder="Document Name"
                                        />
                                        <select
                                            value={previewType}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                if (!props.documentType) {
                                                    setPreviewType(e.target.value);
                                                }
                                            }}
                                            disabled={!!props.documentType}
                                            className="px-2 py-1 text-sm rounded bg-gray-700 text-gray-200 border border-gray-600 focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="ai-response">AI Response</option>
                                            <option value="markdown">Markdown</option>
                                            <option value="project-plan">Project Plan</option>
                                            <option value="roadmap">Roadmap</option>
                                            <option value="domain">Domain</option>
                                            <option value="prompt">Prompt</option>
                                            <option value="specification">Specification</option>
                                            <option value="requirements">Requirements</option>
                                            <option value="report">Report</option>
                                        </select>
                                    </div>
                                    <textarea
                                        value={previewEditContent}
                                        onChange={(e) => setPreviewEditContent(e.target.value)}
                                        className="w-full h-full bg-gray-800 text-gray-200 p-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                                        placeholder="Edit preview content..."
                                    />
                                </>
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
}
