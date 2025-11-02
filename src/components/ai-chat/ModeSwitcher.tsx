'use client';

import { Eye, MessageSquare, Edit } from 'lucide-react';
import type { AIChatMode } from '@/types/aiChatModes';

interface ModeSwitcherProps {
    currentMode: AIChatMode;
    onModeChange: (mode: AIChatMode) => void;
    onOpenAIChat?: () => boolean | void;
    aiChatOpen?: boolean;
    onCloseAIChat?: () => void;
}

export function ModeSwitcher({ currentMode, onModeChange, onOpenAIChat, aiChatOpen, onCloseAIChat }: ModeSwitcherProps) {
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
                <button
                    onClick={() => {
                        if (onCloseAIChat) onCloseAIChat();
                        if (typeof onOpenAIChat === 'function') {
                            const handled = Boolean(onOpenAIChat());
                            if (handled) {
                                onModeChange('view');
                                return;
                            }
                        }
                        onModeChange(currentMode === 'chat' ? 'view' : 'chat');
                    }}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${(currentMode === 'chat' || aiChatOpen)
                        ? 'bg-orange-800 text-white'
                        : 'text-gray-100 bg-gray-800 hover:bg-gray-500'
                        }`}
                    title='Open AI Chat modal'
                >
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    AI Chat
                </button>
            </div>
        </div>
    );
}
