'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { AIChatMode, AIChatModeState, ChatSubMode } from '@/types/aiChatModes';

const STORAGE_KEY = 'aiChat_mode';
const SUBMODE_STORAGE_KEY = 'aiChat_chatSubMode';

export function useAIChatMode() {
    const searchParams = useSearchParams();

    const [modeState, setModeState] = useState<AIChatModeState>({
        mode: 'view',
        chatSubMode: 'general',
        previousMode: null,
    });

    // Initialize mode from URL or localStorage (only once on mount)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const urlMode = searchParams?.get('mode') as AIChatMode | null;
        const urlSubMode = searchParams?.get('sub') as ChatSubMode | null;

        if (urlMode && ['view', 'chat', 'edit'].includes(urlMode)) {
            setModeState(prev => ({
                ...prev,
                mode: urlMode,
                chatSubMode: urlSubMode && ['general', 'advanced'].includes(urlSubMode)
                    ? urlSubMode
                    : prev.chatSubMode,
            }));
        } else {
            // Fallback to localStorage
            const savedMode = localStorage.getItem(STORAGE_KEY) as AIChatMode | null;
            const savedSubMode = localStorage.getItem(SUBMODE_STORAGE_KEY) as ChatSubMode | null;

            if (savedMode && ['view', 'chat', 'edit'].includes(savedMode)) {
                setModeState(prev => ({
                    ...prev,
                    mode: savedMode,
                    chatSubMode: savedSubMode || prev.chatSubMode,
                }));
            }
        }
    }, [searchParams]);

    // Sync mode to URL and localStorage whenever modeState changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Update localStorage
        localStorage.setItem(STORAGE_KEY, modeState.mode);
        localStorage.setItem(SUBMODE_STORAGE_KEY, modeState.chatSubMode);

        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set('mode', modeState.mode);
        if (modeState.mode === 'chat') {
            url.searchParams.set('sub', modeState.chatSubMode);
        } else {
            url.searchParams.delete('sub');
        }
        window.history.replaceState({}, '', url);
    }, [modeState.mode, modeState.chatSubMode]);

    const switchMode = useCallback((newMode: AIChatMode) => {
        setModeState(prev => ({
            mode: newMode,
            chatSubMode: prev.chatSubMode,
            previousMode: prev.mode,
        }));
    }, []);

    const switchChatSubMode = useCallback((newSubMode: ChatSubMode) => {
        setModeState(prev => ({
            ...prev,
            chatSubMode: newSubMode,
        }));
    }, []);

    const returnToPreviousMode = useCallback(() => {
        setModeState(prev => {
            if (!prev.previousMode) return prev;
            return {
                mode: prev.previousMode,
                chatSubMode: prev.chatSubMode,
                previousMode: null,
            };
        });
    }, []);

    return {
        mode: modeState.mode,
        chatSubMode: modeState.chatSubMode,
        previousMode: modeState.previousMode,
        switchMode,
        switchChatSubMode,
        returnToPreviousMode,
    };
}
