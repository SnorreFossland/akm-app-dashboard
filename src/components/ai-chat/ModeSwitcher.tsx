'use client';

import { Eye, MessageSquare, Edit } from 'lucide-react';
import type { AIChatMode } from '@/types/aiChatModes';
import React from 'react';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { X, Library } from 'lucide-react';

interface ModeSwitcherProps {
    currentMode: AIChatMode;
    onModeChange: (mode: AIChatMode) => void;
    onOpenAIChat?: () => boolean | void;
    aiChatOpen?: boolean;
    onCloseAIChat?: () => void;
}

export function ModeSwitcher({ currentMode, onModeChange, onOpenAIChat, aiChatOpen, onCloseAIChat }: ModeSwitcherProps) {
    

    const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex gap-1 bg-gray-500/50 p-0.5 rounded">
                <button
                    onClick={() => onModeChange('view')}
                    className={`mx-1 px-2.5 py-1 rounded text-sm font-medium transition-colors ${currentMode === 'view'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-100 bg-gray-800 hover:bg-gray-500'
                        }`}
                    title='View current document'
                >
                    <Eye className="h-4 w-4 inline mr-1" />
                    View
                </button>
            </div>
            <div className="flex gap-1 bg-gray-500/50 p-0.5 rounded ml-auto">
                <button
                    onClick={() => {
                        if (aiChatOpen && onCloseAIChat) {
                            onCloseAIChat();
                        }
                        onModeChange(currentMode === 'edit' ? 'view' : 'edit');
                    }}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${currentMode === 'edit'
                        ? 'bg-orange-600/80 text-white'
                        : 'text-gray-100 bg-gray-800 hover:bg-gray-500'
                        }`}
                    title='Open Edit modal to edit current document'
                >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit
                </button>
            </div>
            <div className="flex gap-1 bg-gray-500/50 p-0.5 rounded">
                <button
                    onClick={() => setIsLibraryOpen(true)}
                    className="px-2.5 py-1 rounded text-sm font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600"
                    title='Open Library modal'
                >
                    <Library className="h-4 w-4 inline mr-1" />
                    Library
                </button>
                {isLibraryOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="bg-gray-900 rounded-lg shadow-lg p-2 max-w-4xl w-full relative">
                            <div className="flex items-center justify-between border-b border-gray-700 pb-0 mb-1">
                                <span className="text-lg font-semibold text-white pl-1">Library</span>
                                <button
                                    onClick={() => setIsLibraryOpen(false)}
                                    className="text-gray-400 hover:text-white"
                                    aria-label="Close Library"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <MarkdownLibrary
                                onSelect={() => setIsLibraryOpen(false)}
                                hideExportLibraryButton={false}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
