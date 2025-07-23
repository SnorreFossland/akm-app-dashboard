"use client";
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AppHeader } from "@/components/AppHeader";
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { saveMarkdownDocument } from "@/features/documents/markdownSlice";
import { MarkdownDocument } from "@/features/documents/markdownSlice";

interface ThreePanelLayoutProps {
    children: ReactNode;
    leftPanelContent?: {
        tabs: Array<{
            key: string;
            label: string;
            content: ReactNode;
        }>;
        defaultTab?: string;
    };
    rightPanelContent?: {
        tabs: Array<{
            key: string;
            label: string;
            content: ReactNode;
        }>;
        defaultTab?: string;
    };
    showAppHeader?: boolean;
    className?: string;
    moduleOperations?: ReactNode;
}

export function ThreePanelLayout({
    children,
    leftPanelContent,
    rightPanelContent,
    showAppHeader = true,
    className = "",
    moduleOperations
}: ThreePanelLayoutProps) {
    const documents = useSelector((state: RootState) => state.markdown.documents);

    // State for panel management
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [activeLeftTab, setActiveLeftTab] = useState(
        leftPanelContent?.defaultTab || leftPanelContent?.tabs[0]?.key || 'guide'
    );
    const [activeRightTab, setActiveRightTab] = useState(
        rightPanelContent?.defaultTab || rightPanelContent?.tabs[0]?.key || 'help'
    );

    // Document management for default panels
    const [mdContent, setMdContent] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [docName, setDocName] = useState<string>('Welcome');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // Refs for panel management
    const leftPanelWidthRef = useRef(leftPanelWidth);
    const rightPanelWidthRef = useRef(rightPanelWidth);
    const showLeftPanelRef = useRef(showLeftPanel);

    // Panel sizing constants
    const MIN_PANEL_WIDTH = 300;
    const MAX_PANEL_WIDTH = () => window.innerWidth * 0.6;

    // Update refs when state changes
    useEffect(() => {
        leftPanelWidthRef.current = leftPanelWidth;
    }, [leftPanelWidth]);

    useEffect(() => {
        rightPanelWidthRef.current = rightPanelWidth;
    }, [rightPanelWidth]);

    useEffect(() => {
        showLeftPanelRef.current = showLeftPanel;
    }, [showLeftPanel]);

    // Handle window resize to keep panels within bounds
    useEffect(() => {
        const handleResize = () => {
            const leftPanelActualWidth = showLeftPanel ? leftPanelWidth + 8 : 0;
            const minimumMiddleWidth = 320;
            const dragBarWidth = 8;
            const padding = 80;
            const maxRightWidth = Math.max(
                MIN_PANEL_WIDTH,
                window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - dragBarWidth - padding
            );

            // Adjust right panel if it's too wide
            if (rightPanelWidth > maxRightWidth) {
                setRightPanelWidth(maxRightWidth);
            }

            // Adjust left panel if it's too wide
            const maxLeftWidth = Math.min(window.innerWidth * 0.5, 800);
            if (leftPanelWidth > maxLeftWidth) {
                setLeftPanelWidth(maxLeftWidth);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [leftPanelWidth, rightPanelWidth, showLeftPanel]);

    // Panel drag handling
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, panel: 'left' | 'right') => {
        if ('button' in e && e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const startLeftWidth = leftPanelWidthRef.current;
        const startRightWidth = rightPanelWidthRef.current;

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        document.body.style.touchAction = 'none';

        const onMove = (event: MouseEvent | TouchEvent) => {
            if (event instanceof MouseEvent && !(event.buttons & 1)) {
                onEnd();
                return;
            }

            const currentX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
            const deltaX = currentX - startX;

            if (panel === 'left') {
                const newWidth = Math.max(
                    MIN_PANEL_WIDTH,
                    Math.min(MAX_PANEL_WIDTH(), startLeftWidth + deltaX)
                );
                setLeftPanelWidth(newWidth);
            } else if (panel === 'right') {
                const leftPanelActualWidth = showLeftPanelRef.current ? leftPanelWidthRef.current + 8 : 0;
                const minimumMiddleWidth = 320;
                const dragBarWidth = 8;
                const padding = 40;
                const maxRightWidth = Math.max(
                    MIN_PANEL_WIDTH,
                    window.innerWidth - leftPanelActualWidth - minimumMiddleWidth - dragBarWidth - padding
                );

                const newWidth = Math.max(
                    MIN_PANEL_WIDTH,
                    Math.min(maxRightWidth, startRightWidth - deltaX)
                );
                setRightPanelWidth(newWidth);
            }
        };

        const onEnd = () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            document.body.style.touchAction = '';

            document.removeEventListener('mousemove', onMove, { capture: true });
            document.removeEventListener('mouseup', onEnd, { capture: true });
            document.removeEventListener('touchmove', onMove, { capture: true });
            document.removeEventListener('touchend', onEnd, { capture: true });
            document.removeEventListener('touchcancel', onEnd, { capture: true });
        };

        document.addEventListener('mousemove', onMove, { capture: true });
        document.addEventListener('mouseup', onEnd, { capture: true });
        document.addEventListener('touchmove', onMove, { capture: true });
        document.addEventListener('touchend', onEnd, { capture: true });
        document.addEventListener('touchcancel', onEnd, { capture: true });
    };

    // Handler functions
    const handleShowInLeftPanel = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
        setActiveLeftTab('document');
        setIsLibraryOpen(false);
    };

    const handleSelectFromLibrary = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
        setIsEditing(false);
        setActiveLeftTab('document'); // Switch to document tab
        setIsLibraryOpen(false); // Close the library modal after selection
        console.log("Selected document from library:", { content, name });
    };

    // Panel toggle handlers
    const handleToggleLeftPanel = () => setShowLeftPanel(!showLeftPanel);
    const handleToggleRightPanel = () => setShowRightPanel(!showRightPanel);

    // Default left panel content
    const defaultLeftPanelContent = {
        tabs: [
            {
                key: 'guide',
                label: 'Guide',
                content: (
                    <div className="p-4">
                        <GettingStartedGuide />
                    </div>
                )
            },
            {
                key: 'document',
                label: 'Document',
                content: (
                    <DocumentPanel
                        mdContent={mdContent}
                        setMdContent={setMdContent}
                        setIsLibraryOpen={setIsLibraryOpen}
                        isLibraryOpen={isLibraryOpen}
                        panelType="left"
                    />
                )
            },
            {
                key: 'library',
                label: 'Library',
                content: (
                    <div className="p-4">
                        <MarkdownLibrary
                            onSelect={handleSelectFromLibrary}
                            hideExportLibraryButton={true}
                        />
                    </div>
                )
            }
        ],
        defaultTab: 'guide'
    };

    // Default right panel content (Model tab removed)
    const defaultRightPanelContent = {
        tabs: [
            {
                key: 'help',
                label: 'Help',
                content: (
                    <div className="p-4">
                        <div className="space-y-4">
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-white mb-2"> Tips</h3>
                            </div>
                        </div>
                    </div>
                )
            }
        ],
        defaultTab: 'help'
    };

    const finalLeftPanelContent = leftPanelContent || defaultLeftPanelContent;
    const finalRightPanelContent = rightPanelContent || defaultRightPanelContent;

    return (
        <div className={`h-full bg-background text-gray-100 overflow-hidden ${className}`}>
            <div className="flex flex-row h-full overflow-hidden">
                {/* Left Panel */}
                {showLeftPanel && (
                    <div
                        className="bg-gray-800 border-r border-gray-600 flex flex-col overflow-hidden"
                        style={{ width: `${leftPanelWidth}px`, minWidth: `${MIN_PANEL_WIDTH}px` }}
                    >
                        <div className="flex justify-between items-center p-2 border-b border-gray-600">
                            <h3 className="text-sm font-medium text-gray-300">Input</h3>
                            <button
                                onClick={() => setShowLeftPanel(false)}
                                className="text-gray-400 hover:text-white"
                                title="Close panel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex flex-col flex-1">
                            <TabsList className="grid grid-cols-3 w-full pt-3 z-20">
                                {finalLeftPanelContent.tabs.map((tab) => (
                                    <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {finalLeftPanelContent.tabs.map((tab) => (
                                <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0">
                                    {tab.content}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}

                {/* Draggable Bar for Left Panel */}
                {showLeftPanel && (
                    <div
                        className="w-2 bg-gray-700 cursor-col-resize relative flex-shrink-0"
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                        onTouchStart={(e) => handleMouseDown(e, 'left')}
                        style={{ touchAction: 'none' }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
                    </div>
                )}

                {/* Middle Panel: Main Content */}
                <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden"
                    style={{ minWidth: '320px' }}>
                    {/* AppHeader at the top of the middle panel with panel controls and file operations */}
                    {showAppHeader && (
                        <AppHeader
                            showLeftPanel={showLeftPanel}
                            showRightPanel={showRightPanel}
                            onToggleLeftPanel={handleToggleLeftPanel}
                            onToggleRightPanel={handleToggleRightPanel}
                            moduleOperations={moduleOperations}
                        />
                    )}

                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>

                {/* Draggable Bar for Right Panel */}
                {showRightPanel && (
                    <div
                        className="w-2 bg-gray-700 cursor-col-resize relative flex-shrink-0"
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        onTouchStart={(e) => handleMouseDown(e, 'right')}
                        style={{ touchAction: 'none' }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-8 sm:h-12 bg-gray-500 w-1 mx-auto"></div>
                    </div>
                )}

                {/* Right Panel */}
                {showRightPanel && (
                    <div
                        className="bg-gray-800 border-l border-background flex flex-col overflow-hidden"
                        style={{ width: `${rightPanelWidth}px`, minWidth: `${MIN_PANEL_WIDTH}px` }}
                    >
                        <div className="flex justify-between items-center p-2 border-b border-gray-600">
                            <h3 className="text-sm font-medium text-gray-300">Output</h3>
                            <button
                                onClick={() => setShowRightPanel(false)}
                                className="text-gray-400 hover:text-white"
                                title="Close panel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col flex-1 overflow-hidden">
                            <TabsList className="grid grid-cols-3 w-full pt-3 z-20">
                                {finalRightPanelContent.tabs.map((tab) => (
                                    <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {finalRightPanelContent.tabs.map((tab) => (
                                <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0">
                                    {tab.content}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}