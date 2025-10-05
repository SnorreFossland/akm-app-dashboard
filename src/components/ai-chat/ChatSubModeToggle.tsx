'use client';

import { Zap, Sparkles } from 'lucide-react';
import type { ChatSubMode } from '@/types/aiChatModes';

interface ChatSubModeToggleProps {
    subMode: ChatSubMode;
    onSubModeChange: (subMode: ChatSubMode) => void;
    className?: string;
}

export function ChatSubModeToggle({ subMode, onSubModeChange, className = '' }: ChatSubModeToggleProps) {
    return (
        <div className={`flex items-center gap-1 bg-gray-800/50 rounded-md p-1 border-l border-gray-700 ${className}`}>
            <button
                onClick={() => onSubModeChange('general')}
                className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
          ${subMode === 'general'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }
        `}
                aria-label="Switch to general chat"
                aria-pressed={subMode === 'general'}
            >
                <Zap className="w-4 h-4" />
                <span>General</span>
            </button>
            <button
                onClick={() => onSubModeChange('advanced')}
                className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
          ${subMode === 'advanced'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }
        `}
                aria-label="Switch to advanced chat"
                aria-pressed={subMode === 'advanced'}
            >
                <Sparkles className="w-4 h-4" />
                <span>Advanced</span>
            </button>
        </div>
    );
}
