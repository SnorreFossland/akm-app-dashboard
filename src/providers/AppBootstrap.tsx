'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { handleGetPublicFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { openCurrentDomainDialog } from '@/store/uiSlice';
import { X } from 'lucide-react';

// Minimal full-screen modal (Tailwind classes) rendered to document.body via portal
function StartupPrompt({
    onLoadLocal,
    onLoadMimris,
    onClose,
}: {
    onLoadLocal: () => void;
    onLoadMimris: () => void;
    onClose: () => void;
}) {
    // Avoid SSR/Next hydration issues by only portaling after mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 sm:p-6">
            <div className="relative w-full max-w-md rounded-lg border border-orange-600 bg-popover p-5 shadow-xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <h2 className="m-2 text-lg font-semibold text-foreground text-orange-700">Load data</h2>
                <p className="mb-4 p-2 text-sm text-muted-foreground">
                    We found a previous session in your browser. What do you want to load?
                </p>
                <div className="flex gap-2 m-2">
                    <button
                        onClick={onLoadLocal}
                        className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                    >
                        Load previous session
                    </button>
                    <button
                        onClick={onLoadMimris}
                        className="flex-1 rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
                    >
                        Load Mimris template
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function AppBootstrap() {
    const dispatch = useAppDispatch();

    // Existing selectors (keep if used elsewhere)
    const hasModels = useAppSelector(
        (s) => (s.modelUniverse?.phData?.metis?.models?.length ?? 0) > 0
    );
    const hasSource = useAppSelector((s) => Boolean(s.modelUniverse?.phSource));
    const hasData = hasModels || hasSource;

    const [showPrompt, setShowPrompt] = useState(false);

    // Show the load dialog on startup regardless of current tab/page
    useEffect(() => {
        // Optionally gate to once-per-session using sessionStorage
        setShowPrompt(true);
    }, []);

    // Open Current Domain dialog when domain becomes available the first time
    const domain = useAppSelector((s) => s.modelUniverse?.phData?.domain);
    const hasDomain =
        !!domain &&
        Boolean(
            domain.name?.trim() ||
            domain.description?.trim() ||
            domain.presentation?.trim() ||
            domain.prompt?.trim() ||
            domain.additionalContext?.trim()
        );
    const openedRef = useRef(false);
    useEffect(() => {
        if (!openedRef.current && hasDomain) {
            openedRef.current = true;
            setTimeout(() => dispatch(openCurrentDomainDialog()), 0);
        }
    }, [hasDomain, dispatch]);

    const onLoadLocal = () => {
        setShowPrompt(false);
        // If you have a local loader, trigger it here
        // handleGetLocalFileClick(dispatch as any);
    };

    const onLoadMimris = () => {
        handleGetPublicFile(dispatch as any, '/Mimris-Template_PR.json', 'Mimris-Template_PR');
        setShowPrompt(false);
    };

    const onClose = () => setShowPrompt(false);

    return showPrompt ? (
        <StartupPrompt onLoadLocal={onLoadLocal} onLoadMimris={onLoadMimris} onClose={onClose} />
    ) : null;
}