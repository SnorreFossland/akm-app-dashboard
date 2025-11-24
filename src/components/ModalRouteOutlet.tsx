'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

// Dynamically import the AI Chat page as a modal (fallback to main page if modal route missing)
const AiChatModalPage = dynamic(
    () => import('@/app/ai-chat/page').then((mod) => mod.default),
    { ssr: false }
);

export default function ModalRouteOutlet() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const modalFlag = searchParams.get('aiChatModal');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(Boolean(modalFlag));
    }, [modalFlag]);

    const close = useCallback(() => {
        // Remove the query param without navigating away from the page.
        // We reconstruct the URL and replace it so 'back' works reasonably.
        const url = new URL(window.location.href);
        url.searchParams.delete('aiChatModal');
        router.replace(url.toString());
        // ensure local state updates quickly for UX
        setIsOpen(false);
    }, [router]);

    if (!isOpen) return null;

    return (
        // Simple overlay wrapper so the imported modal page is shown as an overlay.
        // The AiChatModalPage component already contains its own layout and an internal modal wrapper;
        // if you prefer to only render the inner Chat UI, we can change the dynamic import target.
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="absolute inset-0 bg-black/60 z-40"
                onClick={close}
            />
            <div className="relative z-50 w-[90%] max-w-8xl max-h-[96vh] overflow-hidden pt-4">
                <AiChatModalPage />
            </div>
        </div>
    );
}