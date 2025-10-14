import React from 'react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import type { MarkdownDocument, DomainData } from '@/features/model-universe/modelSlice';

type OnSetCurrentDocumentFn = (content: string, name?: string, doc?: MarkdownDocument) => void;

interface BuildLeftPanelOptions {
    domain: DomainData | null;
    projectDocument?: MarkdownDocument | null;
    currentDocument?: string;
    onSelectDocument?: (doc: MarkdownDocument) => void;
    onCreateDocumentFromTemplate?: () => void;
    includeLibrary?: boolean;
    onSetCurrentDocument?: OnSetCurrentDocumentFn;
    // New options for additional context
    includeAdditional?: boolean;
    additionalContext?: string;
    setAdditionalContext?: (content: string) => void;
    // New options for context docs (DocumentPanel)
    includeContext?: boolean;
    contextContent?: string;
    setContextContent?: (content: string) => void;
    isLibraryOpen?: boolean;
    libraryTarget?: 'context' | 'document' | null;
    openLibraryFor?: (target: 'context' | 'document') => void;
    closeLibrary?: () => void;
    // optional insertion index for placement of additional tab
    additionalInsertIndex?: number;
}

export function buildLeftPanelTabs(opts: BuildLeftPanelOptions) {
    const {
        domain,
        projectDocument,
        currentDocument,
        onSelectDocument,
        onCreateDocumentFromTemplate,
        includeLibrary = false,
        onSetCurrentDocument,
        includeAdditional = false,
        additionalContext = '',
        setAdditionalContext,
        additionalInsertIndex,
        includeContext = false,
        contextContent = '',
        setContextContent,
        isLibraryOpen,
        libraryTarget,
        openLibraryFor,
        closeLibrary,
    } = opts;

    const tabs: { key: string; label: string; content: React.ReactNode }[] = [
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
            key: 'projects',
            label: 'Project Plan',
            content: (
                <div className="h-full flex flex-col overflow-hidden">
                    {projectDocument ? (
                        <>
                            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                                <h3 className="text-base font-semibold text-gray-200 truncate">
                                    {projectDocument.name}
                                </h3>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {projectDocument.type || 'Markdown'}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto px-4 py-4">
                                {projectDocument.content ? (
                                    <MarkdownPreview mdPreview={projectDocument.content} variant="compact" />
                                ) : (
                                    <div className="text-sm text-gray-400">Loading content...</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center px-4 py-4">
                            <div className="text-center text-gray-400">
                                <p className="text-sm">No focus project set</p>
                                <p className="text-xs mt-2">Click "Focus" on a project in the Library to set it</p>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    // Insert Context Docs tab (DocumentPanel) when requested.
    if (includeContext) {
        const contextTab = {
            key: 'context',
            label: 'Context Docs',
            content: (
                <DocumentPanel
                    mdContent={contextContent}
                    setMdContent={setContextContent ?? (() => { })}
                    setIsLibraryOpen={(open: boolean) => {
                        if (open) openLibraryFor?.('context');
                        else closeLibrary?.();
                    }}
                    isLibraryOpen={!!isLibraryOpen && libraryTarget === 'context'}
                    panelType="left"
                />
            ),
        };
        // Default insertion after 'projects' (index 2)
        tabs.splice(2, 0, contextTab);
    }

    // Insert Additional Context tab (simple free-text textarea) when requested.
    if (includeAdditional) {
        const additionalTab = {
            key: 'additional',
            label: 'Additional Context',
            content: (
                <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                        <h3 className="text-sm font-semibold text-gray-200">Additional Context</h3>
                        <span className="text-xs text-gray-400">Free text or Markdown</span>
                    </div>
                    <div className="flex-1 overflow-auto px-4 py-4">
                        <textarea
                            value={additionalContext || ''}
                            onChange={(e) => setAdditionalContext?.(e.target.value)}
                            placeholder="Add extra free-text context for the AI."
                            className="w-full h-full bg-gray-800 text-gray-200 p-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                        />
                    </div>
                </div>
            ),
        };

        // Default insertion after 'projects' or after context if present.
        const defaultIdx = includeContext ? 3 : 2;
        const idx = typeof additionalInsertIndex === 'number'
            ? Math.max(0, Math.min(additionalInsertIndex, tabs.length))
            : defaultIdx;
        tabs.splice(idx, 0, additionalTab);
    }

    // Library tab appended when requested
    // Prefer 'additional' as the default when Additional Context is included.
    // This avoids tab switching (e.g., jumping to "Project Plan") while the user edits additional context.
    let defaultTab: string | undefined;
    if (includeAdditional) {
        defaultTab = 'additional';
    } else {
        defaultTab = projectDocument ? 'projects' : (domain?.presentation ? 'domain' : undefined);
    }

    if (includeLibrary) {
        tabs.push({
            key: 'library',
            label: 'Library',
            content: (
                <div className="h-full overflow-auto px-2 py-2">
                    <MarkdownLibrary
                        onSelect={(content: string, name?: string, doc?: MarkdownDocument) => {
                            if (doc && onSelectDocument) {
                                onSelectDocument(doc);
                                return;
                            }
                            if (onSetCurrentDocument) {
                                onSetCurrentDocument(content, name, doc);
                            }
                        }}
                        hideExportLibraryButton={false}
                        onSetCurrentDocument={onSetCurrentDocument}
                        currentDocument={currentDocument}
                        onCreateFromTemplate={onCreateDocumentFromTemplate}
                    />
                </div>
            ),
        });
        defaultTab = defaultTab || 'library';
    }

    return {
        tabs,
        defaultTab,
    };
}
