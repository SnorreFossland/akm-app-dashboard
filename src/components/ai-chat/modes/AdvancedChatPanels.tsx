'use client';

import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import type { Domain } from '@/features/model-universe/types';

interface AdvancedChatPanelsProps {
    domain: Domain | null;
    contextContent: string;
    setContextContent: (content: string) => void;
    additionalContext: string;
    setAdditionalContext: (content: string) => void;
    currentDocument: string;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
}

export function AdvancedChatPanels({
    domain,
    contextContent,
    setContextContent,
    additionalContext,
    setAdditionalContext,
    currentDocument,
    isLibraryOpen,
    libraryTarget,
    openLibraryFor,
    closeLibrary,
}: AdvancedChatPanelsProps) {
    const leftPanelContent = {
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
                key: 'context',
                label: 'Context Docs',
                content: (
                    <DocumentPanel
                        mdContent={contextContent}
                        setMdContent={setContextContent}
                        setIsLibraryOpen={(open) => {
                            if (open) {
                                openLibraryFor('context');
                            } else {
                                closeLibrary();
                            }
                        }}
                        isLibraryOpen={isLibraryOpen && libraryTarget === 'context'}
                        panelType="left"
                    />
                ),
            },
            {
                key: 'additional',
                label: 'Additional Context',
                content: (
                    <DocumentPanel
                        mdContent={additionalContext}
                        setMdContent={setAdditionalContext}
                        panelType="left"
                    />
                ),
            },
        ],
        defaultTab: 'context',
    };

    const middlePanelContent = {
        tabs: [
            {
                key: 'chat',
                label: 'AI Chat',
                content: <ChatComponent contextContent={`${contextContent}\n\n${additionalContext}`} />,
            },
            {
                key: 'multimodel',
                label: 'Multi-Model Compare',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <div className="text-sm text-gray-400">Multi-model comparison coming soon...</div>
                    </div>
                ),
            },
            {
                key: 'experiments',
                label: 'Experiments',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <div className="text-sm text-gray-400">Experimental features coming soon...</div>
                    </div>
                ),
            },
        ],
        defaultTab: 'chat',
    };

    const rightPanelContent = {
        tabs: [
            {
                key: 'suggestions',
                label: 'Suggestions',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <div className="text-sm text-gray-400">AI suggestions will appear here...</div>
                    </div>
                ),
            },
            {
                key: 'analysis',
                label: 'Analysis',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <div className="text-sm text-gray-400">Document analysis will appear here...</div>
                    </div>
                ),
            },
            {
                key: 'tools',
                label: 'Tools',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <div className="text-sm text-gray-400">Additional tools will appear here...</div>
                    </div>
                ),
            },
        ],
        defaultTab: 'suggestions',
    };

    return {
        leftPanelContent,
        middlePanelContent,
        rightPanelContent,
    };
}
