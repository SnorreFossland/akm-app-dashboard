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
    return (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-2">
                {/* Hide left panel toggle button */}
            </div>

            <div className="flex items-center gap-2">
                <ModeSwitcher currentMode={mode} onModeChange={onModeChange} />

                {/* HIDE ChatSubModeToggle - Comment out or remove this block */}
                {/* {mode === 'chat' && (
                    <ChatSubModeToggle
                        currentSubMode={chatSubMode}
                        onSubModeChange={onChatSubModeChange}
                    />
                )} */}
            </div>

            <div className="flex items-center gap-2">
                {/* Hide right panel toggle button */}
            </div>
        </div>
    );
}
