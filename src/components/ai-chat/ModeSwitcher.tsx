'use client';

import { Eye, MessageSquare, Edit } from 'lucide-react';
import type { AIChatMode } from '@/types/aiChatModes';

interface ModeSwitcherProps {
    mode: AIChatMode;
    onModeChange: (mode: AIChatMode) => void;
    className?: string;
}

export function ModeSwitcher({ mode, onModeChange, className = '' }: ModeSwitcherProps) {
    const modes: Array<{ value: AIChatMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
        { value: 'view', label: 'View', icon: Eye },
        { value: 'edit', label: 'Edit', icon: Edit },
        { value: 'chat', label: 'Chat', icon: MessageSquare },
    ];

    return (
        <div className={`flex items-center gap-1 bg-gray-800/50 rounded-md p-1 ${className}`}>
            {modes.map(({ value: buttonMode, label, icon: Icon }) => (
                <button
                    key={buttonMode}
                    onClick={() => onModeChange(buttonMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === buttonMode
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                    aria-pressed={mode === buttonMode}
                >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
