'use client';

import { Edit, Eye, Sparkles } from 'lucide-react';

type OntologyBuilderHeaderProps = {
    onViewMode?: () => void;
    onToggleEdit: () => void;
    onOpenAIAssistant: () => void;
    showLeftPanel: boolean;
    showRightPanel: boolean;
    isEditActive?: boolean;
    isAIAssistantActive?: boolean;
};

export function OntologyBuilderHeader({
    onViewMode,
    onToggleEdit,
    onOpenAIAssistant,
    showLeftPanel,
    showRightPanel,
    isEditActive = false,
    isAIAssistantActive = false,
}: OntologyBuilderHeaderProps) {
    const isViewMode = !isEditActive && !isAIAssistantActive;

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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isViewMode
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    title="View mode"
                >
                    <Eye className="h-4 w-4" />
                    View
                </button>

                <button
                    onClick={onToggleEdit}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isEditActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    title="Toggle project editor"
                >
                    <Edit className="h-4 w-4" />
                    Edit Document
                </button>

                <button
                    onClick={onOpenAIAssistant}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isAIAssistantActive
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    title="Open AI Assistant"
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

export default OntologyBuilderHeader;
