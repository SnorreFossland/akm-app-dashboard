'use client';

import { Eye, MessageSquare, Edit } from 'lucide-react';
import type { AIChatMode } from '@/types/aiChatModes';

interface ModeSwitcherProps {
    mode: AIChatMode;
    onModeChange: (mode: AIChatMode) => void;
    className?: string;
}

const modeButtons: Array<{ mode: AIChatMode; label: string; icon: typeof Eye }> = [
    { mode: 'view', label: 'View', icon: Eye },
    { mode: 'chat', label: 'Chat', icon: MessageSquare },
    { mode: 'edit', label: 'Edit', icon: Edit },
];

export function ModeSwitcher({ mode, onModeChange, className = '' }: ModeSwitcherProps) {
    return (
        <div className={`flex items-center gap-1 bg-gray-800/50 rounded-md p-1 ${className}`}>
            {modeButtons.map(({ mode: buttonMode, label, icon: Icon }) => (
                <button
                    key={buttonMode}
                    onClick={() => onModeChange(buttonMode)}
                    className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
            ${mode === buttonMode
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }
          `}
                    aria-label={`Switch to ${label} mode`}
                    aria-pressed={mode === buttonMode}
                >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
