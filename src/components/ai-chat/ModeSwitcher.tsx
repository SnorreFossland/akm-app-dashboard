'use client';

import { Eye, MessageSquare, Edit } from 'lucide-react';
import type { AIChatMode } from '@/types/aiChatModes';

interface ModeSwitcherProps {
    currentMode: AIChatMode;
    onModeChange: (mode: AIChatMode) => void;
}

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
    return (
        <div className="flex gap-1 bg-gray-700/50 p-0.5 rounded">
            <button
                onClick={() => onModeChange('view')}
                className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${currentMode === 'view'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-600'
                    }`}
            >
                <Eye className="h-4 w-4 inline mr-1" />
                View
            </button>
            <button
                onClick={() => onModeChange('edit')}
                className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${currentMode === 'edit'
                        ? 'bg-orange-600/80 text-white'
                        : 'text-gray-300 hover:bg-gray-600'
                    }`}
            >
                <Edit className="h-4 w-4 inline mr-1" />
                Edit
            </button>
            <button
                onClick={() => onModeChange('chat')}
                className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${currentMode === 'chat'
                        ? 'bg-orange-800 text-white'
                        : 'text-gray-300 hover:bg-gray-600'
                    }`}
            >
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Chat
            </button>
        </div>
    );
}
