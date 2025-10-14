'use client';

import { Edit, Sparkles, Eye } from 'lucide-react';

interface DomainBuilderHeaderProps {
    onEditDocument: () => void;
    onOpenAIAssistant: () => void;
    onViewMode?: () => void;
    showLeftPanel: boolean;
    showRightPanel: boolean;
    isAIAssistantActive?: boolean;
    isEditDocumentActive?: boolean;
}

export function DomainBuilderHeader({
    onEditDocument,
    onOpenAIAssistant,
    onViewMode,
    showLeftPanel,
    showRightPanel,
    isAIAssistantActive = false,
    isEditDocumentActive = false
}: DomainBuilderHeaderProps) {
    const isViewMode = !isAIAssistantActive && !isEditDocumentActive;

    // All buttons use gray base, only active gets color
    const baseBtn = "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-500";
    const activeView = "bg-gray-700";
    const activeEdit = "bg-blue-600";
    const activeAI = "bg-purple-600";

    return (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-2">
                {!showLeftPanel && (
                    <span className="text-xs text-gray-400">← Toggle left panel</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onViewMode}
                    className={`${baseBtn} ${isViewMode ? activeView : ''}`}
                    title="View mode"
                >
                    <Eye className="h-4 w-4" />
                    View
                </button>
                <button
                    onClick={onEditDocument}
                    className={`${baseBtn} ${isEditDocumentActive ? activeEdit : ''}`}
                    title="Toggle domain editor"
                >
                    <Edit className="h-4 w-4" />
                    Edit Document
                </button>
                <button
                    onClick={onOpenAIAssistant}
                    className={`${baseBtn} ${isAIAssistantActive ? activeAI : ''}`}
                    title="Toggle AI Assistant chat"
                >
                    <Sparkles className="h-4 w-4" />
                    AI Assistant
                </button>
            </div>
            <div className="flex items-center gap-2">
                {!showRightPanel && (
                    <span className="text-xs text-gray-400">Toggle right panel →</span>
                )}
            </div>
        </div>
    );
}
