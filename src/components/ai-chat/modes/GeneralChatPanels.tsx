'use client';

import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import ChatComponent from '@/components/ai-chat/ChatComponent';
import type { Domain } from '@/features/model-universe/types';

interface GeneralChatPanelsProps {
    domain: Domain | null;
    contextContent: string;
    setContextContent: (content: string) => void;
    currentDocument: string;
    previewContent: string;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
    handleSetCurrentDocument: (content: string) => void;
}

export function GeneralChatPanels({
    domain,
    contextContent,
    setContextContent,
    currentDocument,
    previewContent,
    isLibraryOpen,
    libraryTarget,
    openLibraryFor,
    closeLibrary,
    handleSetCurrentDocument,
}: GeneralChatPanelsProps) {
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
        ],
        defaultTab: domain?.presentation ? 'domain' : 'context',
    };

    const middlePanelContent = {
        tabs: [
            {
                key: 'chat',
                label: 'AI Chat',
                content: <ChatComponent contextContent={contextContent} />,
            },
            {
                key: 'document',
                label: 'Current Document',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <MarkdownPreview mdPreview={currentDocument} variant="default" />
                    </div>
                ),
            },
        ],
        defaultTab: 'chat',
    };

    const rightPanelContent = {
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <div className="h-full overflow-auto px-4 py-4">
                        <MarkdownPreview mdPreview={previewContent || currentDocument} variant="default" />
                    </div>
                ),
            },
            {
                key: 'library',
                label: 'Library',
                content: (
                    <div className="h-full overflow-auto">
                        <MarkdownLibrary
                            onSelect={(content) => handleSetCurrentDocument(content)}
                            hideExportLibraryButton={false}
                            onSetCurrentDocument={(content) => handleSetCurrentDocument(content)}
                            currentDocument={currentDocument}
                        />
                    </div>
                ),
            },
        ],
        defaultTab: 'preview',
    };

    return {
        leftPanelContent,
        middlePanelContent,
        rightPanelContent,
    };
}
