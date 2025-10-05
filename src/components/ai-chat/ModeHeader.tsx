'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { ModeSwitcher } from './ModeSwitcher';
import { ChatSubModeToggle } from './ChatSubModeToggle';
import { FileOperations } from '@/components/FileOperations';
import { MODE_CONFIGS, type AIChatMode, type ChatSubMode } from '@/types/aiChatModes';

interface ModeHeaderProps {
    mode: AIChatMode;
    chatSubMode: ChatSubMode;
    onModeChange: (mode: AIChatMode) => void;
    onChatSubModeChange: (subMode: ChatSubMode) => void;
    showFileOperations?: boolean;
}

export function ModeHeader({
    mode,
    chatSubMode,
    onModeChange,
    onChatSubModeChange,
    showFileOperations = false,
}: ModeHeaderProps) {
    const config = MODE_CONFIGS[mode];

    console.log('ModeHeader render:', { mode, showFileOperations });

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-center gap-4 w-full">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <ModeSwitcher mode={mode} onModeChange={onModeChange} />
                    {mode === 'chat' && (
                        <ChatSubModeToggle
                            subMode={chatSubMode}
                            onSubModeChange={onChatSubModeChange}
                        />
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {mode === 'edit' && (
                        <span className="text-xs uppercase tracking-wide text-orange-300/70">
                            {config.description}
                        </span>
                    )}
                    {/* <Link
                        href="/"
                        className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                        aria-label="Close and return home"
                    >
                        <X className="w-4 h-4" />
                    </Link> */}
                </div>
            </div>
        </div>
    );
}
