'use client';
import React from 'react';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';

interface DocumentPanelProps {
    mdContent: string;
}

export default function DocumentPanel({ mdContent }: DocumentPanelProps) {
    return (
        <div className="p-2">
            {mdContent && (
                <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto max-h-[80vh] max-w-full whitespace-pre-wrap break-words">
                    <MarkdownPreview mdPreview={mdContent} />
                </div>

            )}
        </div>
    );
}