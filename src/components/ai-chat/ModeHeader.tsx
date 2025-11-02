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
    onOpenAIChat?: () => void;
    aiChatOpen?: boolean;
    onCloseAIChat?: () => void;
}

export function ModeHeader({
    mode,
    chatSubMode,
    onModeChange,
    onChatSubModeChange,
    showFileOperations = false,
    onOpenAIChat,
    aiChatOpen,
    onCloseAIChat,
}: ModeHeaderProps) {
    const handleOpenAIChat = () => {
        if (typeof onOpenAIChat === 'function') {
            return onOpenAIChat();
        }
        return false;
    };

    return (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/50 w-full">
            <ModeSwitcher
                currentMode={mode}
                onModeChange={onModeChange}
                onOpenAIChat={handleOpenAIChat}
                aiChatOpen={aiChatOpen}
                onCloseAIChat={onCloseAIChat}
            />
        </div>
    );
}
