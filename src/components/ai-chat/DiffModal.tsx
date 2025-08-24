'use client';
import React from 'react';
import { diffLines, Change } from 'diff';
import { X, Save, ArrowLeft } from 'lucide-react';

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
    if (!isOpen) return null;

    const diff = diffLines(oldContent || '', newContent || '');

    const renderDiffLine = (change: Change, index: number) => {
        let className = 'font-mono text-sm px-3 py-1';
        let prefix = ' ';

        if (change.added) {
            className += ' bg-green-900/40 text-green-200 border-l-2 border-green-500';
            prefix = '+';
        } else if (change.removed) {
            className += ' bg-red-900/40 text-red-200 border-l-2 border-red-500';
            prefix = '-';
        } else {
            className += ' text-gray-300';
        }

        return (
            <div key={index} className={`${className} block w-full`} style={{ display: 'table', tableLayout: 'fixed', width: '100%' }}>
                <div style={{ display: 'table-cell', width: '20px', verticalAlign: 'top' }}>
                    <span className="text-gray-500 select-none">{prefix}</span>
                </div>
                <div style={{
                    display: 'table-cell',
                    width: 'calc(100% - 20px)',
                    verticalAlign: 'top',
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap'
                }}>
                    <span
                        className="font-mono text-sm leading-relaxed"
                        style={{
                            wordBreak: 'break-all',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'pre-wrap',
                            display: 'block',
                            width: '100%',
                            maxWidth: '100%'
                        }}
                    >
                        {change.value}
                    </span>
                </div>
            </div>
        );
    };

    const addedLines = diff.filter(change => change.added).reduce((acc, change) => acc + (change.count || 0), 0);
    const removedLines = diff.filter(change => change.removed).reduce((acc, change) => acc + (change.count || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700 w-full max-w-[95vw] h-full max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
                    <div className="flex flex-col"
                    >
                        <h3 className="text-xl font-bold text-white">Save Changes to Library</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Document: <span className="text-blue-400">{title}</span>
                        </p>
                        <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-green-400">+{addedLines} additions</span>
                            <span className="text-red-400">-{removedLines} deletions</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save to Library
                        </button>
                    </div>
                </div>

                {/* Diff Content */}
                <div className="flex-1 bg-gray-950 overflow-hidden" style={{ minWidth: 0, maxWidth: '100%' }}>
                    <div className="h-full overflow-auto p-4" style={{ minWidth: 0, maxWidth: '100%' }}>
                        <div
                            className="bg-gray-900 rounded border border-gray-700 overflow-hidden"
                            style={{
                                minWidth: 0,
                                maxWidth: '100%',
                                width: '100%',
                                tableLayout: 'fixed'
                            }}
                        >
                            {diff.length === 0 ? (
                                <div className="p-4 text-center text-gray-400">
                                    No changes detected
                                </div>
                            ) : (
                                <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                                    {diff.map((change, index) => renderDiffLine(change, index))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="p-3 border-t border-gray-700 bg-gray-800">
                    <div className="flex gap-6 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-900/40 border-l-2 border-green-500"></div>
                            <span>Added lines</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-900/40 border-l-2 border-red-500"></div>
                            <span>Removed lines</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-700"></div>
                            <span>Unchanged lines</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}