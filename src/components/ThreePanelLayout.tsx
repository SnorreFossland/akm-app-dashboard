"use client";
import React, { useState, useEffect, ReactNode } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { AppHeader } from "@/components/AppHeader";
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ThreePanelLayoutProps {
    children: ReactNode;
    showLeftPanel?: boolean;
    setShowLeftPanel: (show: boolean) => void;
    showRightPanel?: boolean;
    setShowRightPanel: (show: boolean) => void;
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
    isMobile?: boolean;
}

export function ThreePanelLayout({
    children,
    leftPanelContent,
    rightPanelContent,
    showAppHeader = true,
    className = "min-w-0",
    moduleOperations,
    showLeftPanel = true,
    setShowLeftPanel,
    showRightPanel = true,
    setShowRightPanel,
}: ThreePanelLayoutProps) {
    const MIN_PANEL_WIDTH = 150;
    const MIN_MIDDLE_WIDTH = 200;

    const [isMobile, setIsMobile] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(400);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [activeLeftTab, setActiveLeftTab] = useState(
        leftPanelContent?.defaultTab || leftPanelContent?.tabs[0]?.key || 'guide'
    );
    const [activeRightTab, setActiveRightTab] = useState(
        rightPanelContent?.defaultTab || rightPanelContent?.tabs[0]?.key || 'help'
    );

    const [mdContent, setMdContent] = useState<string>('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const handleToggleLeftPanel = () => setShowLeftPanel(!showLeftPanel);
    const handleToggleRightPanel = () => setShowRightPanel(!showRightPanel);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, panel: 'left' | 'right') => {
        if ('button' in e && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const startLeftWidth = leftPanelWidth;
        const startRightWidth = rightPanelWidth;

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        const onMove = (event: MouseEvent | TouchEvent) => {
            const currentX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
            const deltaX = currentX - startX;

            requestAnimationFrame(() => {
                if (panel === 'left') {
                    const newWidth = startLeftWidth + deltaX;
                    const maxLeftWidth = window.innerWidth - rightPanelWidth - MIN_MIDDLE_WIDTH - 16;
                    setLeftPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxLeftWidth)));
                } else {
                    const newWidth = startRightWidth - deltaX;
                    const maxRightWidth = window.innerWidth - leftPanelWidth - MIN_MIDDLE_WIDTH - 16;
                    setRightPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxRightWidth)));
                }
            });
        };

        const onEnd = () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);
    };

    const handleSelectFromLibrary = (content: string, name: string) => {
        setMdContent(content);
        setActiveLeftTab('document');
        setIsLibraryOpen(false);
    };

    const defaultLeftPanelContent = {
        tabs: [
            { key: 'guide', label: 'Guide', content: <div className="p-4"><GettingStartedGuide /></div> },
            { key: 'document', label: 'Document', content: <DocumentPanel mdContent={mdContent} setMdContent={setMdContent} setIsLibraryOpen={setIsLibraryOpen} isLibraryOpen={isLibraryOpen} panelType="left" /> },
            { key: 'library', label: 'Library', content: <div className="p-4"><MarkdownLibrary onSelect={handleSelectFromLibrary} hideExportLibraryButton={true} /></div> }
        ],
        defaultTab: 'guide'
    };

    const defaultRightPanelContent = {
        tabs: [
            { key: 'help', label: 'Help', content: <div className="p-4"><div className="space-y-4"><div className="bg-gray-700/50 p-4 rounded-lg"><h3 className="text-lg font-semibold text-white mb-2"> Tips</h3></div></div></div> }
        ],
        defaultTab: 'help'
    };

    const finalLeftPanelContent = leftPanelContent || defaultLeftPanelContent;
    const finalRightPanelContent = rightPanelContent || defaultRightPanelContent;

    if (isMobile) {
        return (
            <div className={`h-full min-w-0 bg-background text-gray-100 overflow-hidden ${className}`}>
                {showAppHeader && (
                    <AppHeader
                        showLeftPanel={showLeftPanel}
                        showRightPanel={showRightPanel}
                        onToggleLeftPanel={undefined}
                        onToggleRightPanel={undefined}
                        moduleOperations={moduleOperations}
                        isMobile={isMobile}
                    />
                )}
                <Accordion type="single" collapsible defaultValue="main-panel" className="w-full h-full overflow-auto">
                    {leftPanelContent && (
                        <AccordionItem value="input-panel">
                            <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Input</AccordionTrigger>
                            <AccordionContent>
                                <div className="bg-gray-800 border-b border-gray-600 flex flex-col overflow-hidden h-[calc(100vh-200px)]">
                                    <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex flex-col flex-1">
                                        <TabsList className="grid grid-cols-3 w-full pt-3 z-20">
                                            {finalLeftPanelContent.tabs.map((tab) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalLeftPanelContent.tabs.map((tab) => (
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0">{tab.content}</TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    <AccordionItem value="main-panel">
                        <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Main</AccordionTrigger>
                        <AccordionContent>
                            <div className="flex-1 overflow-hidden min-w-0 w-full h-[calc(100vh-200px)] text-gray-100">
                                {children}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {rightPanelContent && (
                        <AccordionItem value="output-panel">
                            <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Output</AccordionTrigger>
                            <AccordionContent>
                                <div className="bg-gray-800 border-t border-gray-600 flex flex-col overflow-hidden h-[calc(100vh-200px)]">
                                    <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col flex-1 overflow-hidden">
                                        <TabsList className="grid grid-cols-3 w-full pt-3 z-20">
                                            {finalRightPanelContent.tabs.map((tab) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalRightPanelContent.tabs.map((tab) => (
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0">{tab.content}</TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </div>
        );
    }

    return (
        <div className={`h-full min-w-0 bg-background text-gray-100 overflow-hidden ${className}`}>
            <div className="flex flex-row h-full overflow-hidden">
                {showLeftPanel && (
                    <div
                        className="bg-gray-800 border-r border-gray-600 flex flex-col overflow-hidden flex-shrink-0"
                        style={{ width: `${leftPanelWidth}px` }}
                    >
                        <div className="flex justify-between items-center p-2 border-b border-gray-600">
                            <h3 className="text-sm font-medium text-gray-300">Input</h3>
                            <button onClick={() => setShowLeftPanel(false)} className="text-gray-400 hover:text-white" title="Close panel">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        </div>
                        <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex flex-col flex-1">
                            <TabsList className="grid grid-cols-3 w-full pt-3 z-20">
                                {finalLeftPanelContent.tabs.map((tab) => (
                                    <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                ))}
                            </TabsList>
                            {finalLeftPanelContent.tabs.map((tab) => (
                                <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0">{tab.content}</TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}

                {showLeftPanel && (
                    <div
                        className="w-2 bg-gray-700 cursor-col-resize flex-shrink-0"
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                        onTouchStart={(e) => handleMouseDown(e, 'left')}
                    />
                )}

                <div
                    className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden"
                    style={{ minWidth: `${MIN_MIDDLE_WIDTH}px` }}
                >
                    {showAppHeader && (
                        <AppHeader
                            showLeftPanel={showLeftPanel}
                            showRightPanel={showRightPanel}
                            onToggleLeftPanel={handleToggleLeftPanel}
                            onToggleRightPanel={handleToggleRightPanel}
                            moduleOperations={moduleOperations}
                        />
                    )}
                    <div className="flex-1 overflow-hidden min-w-0 w-full">{children}</div>
                </div>

                {showRightPanel && (
                    <div
                        className="w-2 bg-gray-700 cursor-col-resize flex-shrink-0"
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        onTouchStart={(e) => handleMouseDown(e, 'right')}
                    />
                )}

                {showRightPanel && (
                    <div
                        className="bg-gray-800 border-l border-background flex flex-col overflow-hidden flex-shrink-0"
                        style={{ width: `${rightPanelWidth}px` }}
                    >
                        <div className="flex justify-between items-center p-2 border-b border-gray-600">
                            <h3 className="text-sm font-medium text-gray-300">Output</h3>
                            <button onClick={() => setShowRightPanel(false)} className="text-gray-400 hover:text-white" title="Close panel">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col flex-1 overflow-hidden">
                            <TabsList className="grid grid-cols-3 w-full pt-3 z-20">
                                {finalRightPanelContent.tabs.map((tab) => (
                                    <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                ))}
                            </TabsList>
                            {finalRightPanelContent.tabs.map((tab) => (
                                <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0">{tab.content}</TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}