'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Legacy redirect page for /ai-chat/edit
// Redirects to new multi-mode page with edit mode
export default function EditDocumentRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/ai-chat?mode=edit');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-gray-400">Redirecting to Document Editor...</div>
        </div>
    );
}
