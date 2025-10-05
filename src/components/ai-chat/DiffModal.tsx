'use client';
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { diffLines, Change } from 'diff';

interface DiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    oldContent: string;
    newContent: string;
    title: string;
}

export default function DiffModal({
    isOpen,
    onClose,
    onConfirm,
    oldContent,
    newContent,
    title
}: DiffModalProps) {
    const diff = useMemo(() => {
        return diffLines(oldContent || '', newContent || '');
    }, [oldContent, newContent]);

    if (!isOpen) return null;

    const addedLines = diff.filter(change => change.added).reduce((acc, change) => acc + (change.count || 0), 0);
    const removedLines = diff.filter(change => change.removed).reduce((acc, change) => acc + (change.count || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="relative bg-popover rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-100">
                            Review Changes: {title}
                        </h2>
                        <div className="text-sm text-gray-400 mt-1">
                            <span className="text-green-400">+{addedLines} added</span>
                            {' / '}
                            <span className="text-red-400">-{removedLines} removed</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                        aria-label="Close diff modal"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto px-2 py-4 bg-gray-950">
                    {diff.map((change: Change, index: number) => {
                        // Skip rendering unchanged lines if there are too many (show only context)
                        if (!change.added && !change.removed) {
                            const lines = change.value.split('\n');
                            // Show first 3 and last 3 lines of unchanged blocks, collapse the rest
                            if (lines.length > 8) {
                                const firstLines = lines.slice(0, 3);
                                const lastLines = lines.slice(-3);
                                return (
                                    <div key={index}>
                                        {firstLines.map((line, i) => (
                                            <div key={`first-${i}`} className="px-4 py-0.5 text-gray-500 font-mono text-sm">
                                                <span className="inline-block w-8 text-gray-600 select-none">  </span>
                                                {line}
                                            </div>
                                        ))}
                                        <div className="px-4 py-2 text-gray-600 text-sm italic border-l-2 border-gray-700 ml-8">
                                            ... {lines.length - 6} unchanged lines ...
                                        </div>
                                        {lastLines.map((line, i) => (
                                            <div key={`last-${i}`} className="px-4 py-0.5 text-gray-500 font-mono text-sm">
                                                <span className="inline-block w-8 text-gray-600 select-none">  </span>
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                        }

                        const bgColor = change.added
                            ? 'bg-green-900/30 border-l-4 border-green-600'
                            : change.removed
                                ? 'bg-red-900/30 border-l-4 border-red-600'
                                : '';

                        const textColor = change.added
                            ? 'text-green-200'
                            : change.removed
                                ? 'text-red-200'
                                : 'text-gray-500';

                        const prefix = change.added ? '+ ' : change.removed ? '- ' : '  ';
                        const prefixColor = change.added ? 'text-green-400' : change.removed ? 'text-red-400' : 'text-gray-600';

                        return change.value.split('\n').map((line, lineIndex) => (
                            <div
                                key={`${index}-${lineIndex}`}
                                className={`${bgColor} ${textColor} px-4 py-0.5 font-mono text-sm whitespace-pre-wrap break-all`}
                            >
                                <span className={`inline-block w-8 ${prefixColor} select-none font-bold`}>
                                    {prefix}
                                </span>
                                {line}
                            </div>
                        ));
                    })}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Confirm & Save
                    </Button>
                </div>
            </div>
        </div>
    );
}