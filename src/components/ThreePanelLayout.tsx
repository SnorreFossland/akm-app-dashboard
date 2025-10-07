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
import { useIsMobile } from '@/hooks/use-mobile';

const debug = false;
export interface PanelTab {
    key: string;
    label: React.ReactNode;
    content: React.ReactNode;
}

export interface PanelGroup {
    tabs: PanelTab[];
    defaultTab?: string;
}

export interface ThreePanelLayoutProps {
    showAppHeader?: boolean;
    moduleOperations?: React.ReactNode;
    leftPanelContent: PanelGroup;
    // Make middlePanelContent optional
    middlePanelContent?: PanelGroup;
    rightPanelContent: PanelGroup;
    showLeftPanel: boolean;
    setShowLeftPanel: (v: boolean) => void;
    showRightPanel: boolean;
    setShowRightPanel: (v: boolean) => void;
    className?: string;
    children?: React.ReactNode;
    middlePanelHeader?: React.ReactNode; // Add this prop
}

export function ThreePanelLayout({
    children,
    leftPanelContent,
    middlePanelContent,
    rightPanelContent,
    showAppHeader = true,
    className = "min-w-0",
    moduleOperations,
    showLeftPanel = true,
    setShowLeftPanel,
    showRightPanel = true,
    setShowRightPanel,
    middlePanelHeader,
}: ThreePanelLayoutProps) {
    const MIN_PANEL_WIDTH = 150;
    const MIN_MIDDLE_WIDTH = 180;

    // Use the same mobile detection as sidebar
    const isMobile = useIsMobile();
    const [leftPanelWidth, setLeftPanelWidth] = useState(500);
    const [rightPanelWidth, setRightPanelWidth] = useState(500);

    // Remove duplicate mobile detection useEffect
    useEffect(() => {
        // Calculate header height dynamically
        const checkScreenSize = () => {
            const headerElement = document.querySelector('header') || document.querySelector('.app-header');
            const headerHeight = headerElement ? headerElement.offsetHeight : 200;
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // helper to pick a safe default tab key
    const getDefaultTabKey = (panel: any, fallback = 'guide') => {
        if (!panel) return fallback;
        if (typeof panel.defaultTab === 'string' && panel.defaultTab.length > 0) return panel.defaultTab;
        if (Array.isArray(panel.tabs) && panel.tabs.length > 0) {
            return (panel.tabs[0] && typeof panel.tabs[0].key === 'string') ? panel.tabs[0].key : fallback;
        }
        return fallback;
    };

    // Initialize active tabs from defaultTab - FIXED VERSION
    const [activeLeftTab, setActiveLeftTab] = useState<string>(() => {
        if (leftPanelContent && typeof leftPanelContent === 'object' && 'tabs' in leftPanelContent) {
            return leftPanelContent.defaultTab || (leftPanelContent.tabs[0]?.key) || 'left';
        }
        return 'left';
    });

    const [activeMiddleTab, setActiveMiddleTab] = useState<string>(() => {
        if (middlePanelContent && typeof middlePanelContent === 'object' && 'tabs' in middlePanelContent) {
            return middlePanelContent.defaultTab || (middlePanelContent.tabs[0]?.key) || 'guide';
        }
        return 'guide';
    });

    const [activeRightTab, setActiveRightTab] = useState<string>(() => {
        if (rightPanelContent && typeof rightPanelContent === 'object' && 'tabs' in rightPanelContent) {
            return rightPanelContent.defaultTab || (rightPanelContent.tabs[0]?.key) || 'preview';
        }
        return 'preview';
    });

    // Update active tabs when panel content changes
    useEffect(() => {
        if (leftPanelContent && typeof leftPanelContent === 'object' && 'tabs' in leftPanelContent) {
            const defaultKey = leftPanelContent.defaultTab || (leftPanelContent.tabs[0]?.key);
            if (defaultKey) {
                setActiveLeftTab(defaultKey);
            }
        }
    }, [leftPanelContent]);

    useEffect(() => {
        if (middlePanelContent && typeof middlePanelContent === 'object' && 'tabs' in middlePanelContent) {
            const defaultKey = middlePanelContent.defaultTab || (middlePanelContent.tabs[0]?.key);
            if (defaultKey) {
                setActiveMiddleTab(defaultKey);
            }
        }
    }, [middlePanelContent]);

    useEffect(() => {
        if (rightPanelContent && typeof rightPanelContent === 'object' && 'tabs' in rightPanelContent) {
            const defaultKey = rightPanelContent.defaultTab || (rightPanelContent.tabs[0]?.key);
            if (defaultKey) {
                setActiveRightTab(defaultKey);
            }
        }
    }, [rightPanelContent]);

    // Initialize active tabs from defaultTab when panel content changes
    useEffect(() => {
        if (leftPanelContent && typeof leftPanelContent === 'object' && 'tabs' in leftPanelContent) {
            const defaultKey = leftPanelContent.defaultTab || (leftPanelContent.tabs[0]?.key);
            if (defaultKey) {
                setActiveLeftTab(defaultKey);
            }
        }
    }, [leftPanelContent]);

    useEffect(() => {
        if (middlePanelContent && typeof middlePanelContent === 'object' && 'tabs' in middlePanelContent) {
            const defaultKey = middlePanelContent.defaultTab || (middlePanelContent.tabs[0]?.key);
            if (defaultKey) {
                setActiveMiddleTab(defaultKey);
            }
        }
    }, [middlePanelContent]);

    useEffect(() => {
        if (rightPanelContent && typeof rightPanelContent === 'object' && 'tabs' in rightPanelContent) {
            const defaultKey = rightPanelContent.defaultTab || (rightPanelContent.tabs[0]?.key);
            if (defaultKey) {
                setActiveRightTab(defaultKey);
            }
        }
    }, [rightPanelContent]);

    // Helper to check if panel is a tabs object
    const isPanelTabs = (panel: any): boolean => {
        return panel && typeof panel === 'object' && Array.isArray(panel.tabs);
    };

    // Helper to render panel content (tabs or plain JSX)
    const renderPanelContent = (panel: any, activeKey: string) => {
        if (!panel) return null;
        // If plain JSX (React.ReactNode), render directly
        if (React.isValidElement(panel)) return panel;
        // If tabs object, render Tabs component
        if (isPanelTabs(panel)) {
            return (
                <Tabs value={activeKey} onValueChange={(v) => {
                    // Set active tab based on which panel this is
                    // (caller will wire setActiveLeftTab/Middle/Right)
                }} className="h-full flex flex-col">
                    <TabsList className="grid w-full pt-0 z-10" style={{ gridTemplateColumns: `repeat(${panel.tabs.length}, 1fr)` }}>
                        {panel.tabs.map((tab: any) => (
                            <TabsTrigger key={tab.key} value={tab.key} className="text-[12px] py-1">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        {panel.tabs.map((tab: any) => (
                            <TabsContent key={tab.key} value={tab.key} className="h-full">
                                {tab.content}
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            );
        }
        return null;
    };

    const [mdContent, setMdContent] = useState<string>('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const handleToggleLeftPanel = () => setShowLeftPanel(!showLeftPanel);
    const handleToggleRightPanel = () => setShowRightPanel(!showRightPanel);

    // Allow other components to switch the right panel tab and open the panel via CustomEvents
    useEffect(() => {
        const handleSetRightTab = (e: Event) => {
            const ce = e as CustomEvent<{ key?: string }>;
            const key = ce?.detail?.key;
            if (key) setActiveRightTab(key);
        };
        const handleOpenRight = () => {
            setShowRightPanel(true);
        };
        window.addEventListener('threepanel:setRightTab', handleSetRightTab as EventListener);
        window.addEventListener('threepanel:openRight', handleOpenRight as EventListener);
        return () => {
            window.removeEventListener('threepanel:setRightTab', handleSetRightTab as EventListener);
            window.removeEventListener('threepanel:openRight', handleOpenRight as EventListener);
        };
    }, [setShowRightPanel]);

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
            { key: 'document', label: 'Document', content: <DocumentPanel mdContent={mdContent} setMdContent={setMdContent} setIsLibraryOpen={setIsLibraryOpen} isLibraryOpen={isLibraryOpen} panelType="left" /> },
            { key: 'library', label: 'Library', content: <div className="p-4"><MarkdownLibrary onSelect={handleSelectFromLibrary} hideExportLibraryButton={true} /></div> }
        ],
        defaultTab: 'document'
    };
    const defaultMiddlePanelContent = {
        tabs: [
            { key: 'guide', label: 'Getting Started', content: <GettingStartedGuide /> },
            { key: 'document', label: 'Document', content: <DocumentPanel mdContent={mdContent} setMdContent={setMdContent} setIsLibraryOpen={setIsLibraryOpen} isLibraryOpen={isLibraryOpen} panelType="middle" /> }
        ],
        defaultTab: 'document'
    };
    const defaultRightPanelContent = {
        tabs: [
            { key: 'preview', label: 'Preview', content: <div className="p-4"><div className="space-y-4"><div className="bg-gray-700/50 p-4 rounded-lg"><h3 className="text-lg font-semibold text-white mb-2"> Preview</h3></div></div></div> }
        ],
        defaultTab: 'preview'
    };

    const finalLeftPanelContent = leftPanelContent || defaultLeftPanelContent;
    const finalMiddlePanelContent = middlePanelContent || defaultMiddlePanelContent;
    const finalRightPanelContent = rightPanelContent || defaultRightPanelContent;

    // Helper to find active tab content safely
    const getActiveTabContent = (panel: any, activeKey: string) => {
        if (!panel) return null;
        const tabs = Array.isArray(panel.tabs) ? panel.tabs : [];
        const found = tabs.find((t: any) => t.key === activeKey) || tabs[0] || null;
        return found ? found.content : null;
    };

    // Add debug logging
    if (debug) console.log('ThreePanelLayout render:', {
        hasMiddlePanelHeader: !!middlePanelHeader,
        middlePanelHeaderType: typeof middlePanelHeader,
    });

    if (isMobile) {
        return (
            <div className={`h-full min-w-0 bg-background text-gray-100 overflow-hidden ${className}`}>
                {showAppHeader && (
                    // ensure the header itself can shrink (min-w-0)
                    <div className="min-w-0 w-full">
                        <AppHeader
                            showLeftPanel={showLeftPanel}
                            showRightPanel={showRightPanel}
                            onToggleLeftPanel={undefined}
                            onToggleRightPanel={undefined}
                            moduleOperations={moduleOperations}
                            isMobile={isMobile}
                        />
                    </div>
                )}
                <Accordion type="single" collapsible defaultValue="main-panel" className="w-full  overflow-auto">
                    {leftPanelContent && (
                        <AccordionItem value="input-panel">
                            <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Input</AccordionTrigger>
                            <AccordionContent>
                                <div className="bg-gray-800 border-b border-gray-600 flex flex-col overflow-hidden h-full">
                                    <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex flex-col flex-1">
                                        {/* Reduce z-index to avoid conflicts with sidebar */}
                                        <TabsList className="grid grid-cols-3 w-full pt-3 z-10">
                                            {finalLeftPanelContent.tabs.map((tab) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalLeftPanelContent.tabs.map((tab) => (
                                            // add min-w-0 here so tab content can shrink on small screens
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">{tab.content}</TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    {/* 
                    <AccordionItem value="main-panel">
                        <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Main</AccordionTrigger>
                        <AccordionContent>
                            <div className="flex-1 overflow-hidden min-w-0 w-full h-[calc(100vh-14rem)] text-gray-100 pb-5">
                                {children}
                            </div>
                        </AccordionContent>
                    </AccordionItem> */}

                    <AccordionItem value="middle-panel">
                        <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Input</AccordionTrigger>
                        <AccordionContent>
                            <div className="bg-gray-800 border-b border-gray-600 flex flex-col overflow-hidden h-full">
                                <Tabs value={activeMiddleTab} onValueChange={setActiveMiddleTab} className="flex flex-col flex-1">
                                    {/* Reduce z-index to avoid conflicts with sidebar */}
                                    <TabsList className="grid grid-cols-3 w-full pt-3 z-10">
                                        {finalMiddlePanelContent.tabs.map((tab) => (
                                            <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {finalMiddlePanelContent.tabs.map((tab) => (
                                        // add min-w-0 here as well
                                        <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">{tab.content}</TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {rightPanelContent && (
                        <AccordionItem value="output-panel">
                            <AccordionTrigger className="px-4 py-0 font-semibold bg-card">Output</AccordionTrigger>
                            <AccordionContent>
                                <div className="bg-gray-800 border-b border-gray-600 flex flex-col overflow-hidden h-[calc(100vh-var(--header-height,220px))]">
                                    <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col flex-1 overflow-hidden">
                                        {/* Reduce z-index to avoid conflicts with sidebar */}
                                        <TabsList className="grid grid-cols-3 w-full pt-3 z-10">
                                            {finalRightPanelContent.tabs.map((tab) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalRightPanelContent.tabs.map((tab) => (
                                            // add min-w-0
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">{tab.content}</TabsContent>
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
            <div className="flex flex-col h-full overflow-auto">
                <div className="flex h-full overflow-hidden">
                    {/* Left Panel (Input) */}
                    {showLeftPanel && (
                        <div className="flex flex-col bg-gray-800 border-r border-gray-600 overflow-hidden flex-shrink-0"
                            style={{ width: `${leftPanelWidth}px` }}>
                            <div className="flex justify-between items-center p-2 border-b border-gray-600">
                                <h3 className="text-sm font-medium text-gray-300">Input</h3>
                                <button onClick={() => setShowLeftPanel(false)} className="text-gray-400 hover:text-white" title="Close panel">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="h-full flex flex-col">
                                {React.isValidElement(finalLeftPanelContent) ? (
                                    finalLeftPanelContent
                                ) : isPanelTabs(finalLeftPanelContent) ? (
                                    <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="h-full flex flex-col">
                                        <TabsList className="grid w-full pt-0 z-10" style={{ gridTemplateColumns: `repeat(${finalLeftPanelContent.tabs.length}, 1fr)` }}>
                                            {finalLeftPanelContent.tabs.map((tab: any) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-[12px] py-1">
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        <div className="flex-1 min-h-0 overflow-hidden">
                                            {finalLeftPanelContent.tabs.map((tab: any) => (
                                                <TabsContent key={tab.key} value={tab.key} className="h-full">
                                                    {tab.content}
                                                </TabsContent>
                                            ))}
                                        </div>
                                    </Tabs>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* Resizable divider between left panel and main content */}
                    {showLeftPanel && (
                        <div
                            className="w-2 bg-gray-700 cursor-col-resize flex-shrink-0"
                            onMouseDown={(e) => handleMouseDown(e, 'left')}
                            onTouchStart={(e) => handleMouseDown(e, 'left')}
                        />
                    )}

                    {/* Main content area - RENDER MIDDLE PANEL CONTENT HERE */}
                    <div
                        className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden min-w-0"
                        style={{ minWidth: `${MIN_MIDDLE_WIDTH}px` }}
                    >
                        {showAppHeader && (
                            // Wrap header to ensure it can shrink; prevents header children from forcing page width
                            <div className="min-w-0 w-full ">
                                <AppHeader
                                    showLeftPanel={showLeftPanel}
                                    showRightPanel={showRightPanel}
                                    onToggleLeftPanel={handleToggleLeftPanel}
                                    onToggleRightPanel={handleToggleRightPanel}
                                    moduleOperations={middlePanelHeader || moduleOperations}
                                />
                            </div>
                        )}
                        {/* Middle panel tabs/content */}
                        {middlePanelContent ? (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <Tabs
                                    value={activeMiddleTab}
                                    onValueChange={setActiveMiddleTab}
                                    className="flex flex-col flex-1 overflow-hidden"
                                >
                                    <TabsList className="grid grid-cols-4 w-full pt-0 z-10">
                                        {Array.isArray(finalMiddlePanelContent?.tabs) && finalMiddlePanelContent.tabs.length > 0
                                            ? finalMiddlePanelContent.tabs.map((tab: any) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-[12px] py-1">
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))
                                            : null
                                        }
                                    </TabsList>

                                    <div className="h-full">
                                        {Array.isArray(finalMiddlePanelContent?.tabs) && finalMiddlePanelContent.tabs.length > 0
                                            ? finalMiddlePanelContent.tabs.map((tab: any) => (
                                                <TabsContent key={tab.key} value={tab.key} className="h-full">
                                                    {tab.content}
                                                </TabsContent>
                                            ))
                                            : null
                                        }
                                    </div>
                                </Tabs>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-hidden min-w-0 w-full">{children}</div>
                        )}
                    </div>
                    {/* Resizable divider between main content and right panel */}
                    {showRightPanel && (
                        <div
                            className="w-2 bg-gray-700 cursor-col-resize flex-shrink-0"
                            onMouseDown={(e) => handleMouseDown(e, 'right')}
                            onTouchStart={(e) => handleMouseDown(e, 'right')}
                        />
                    )}

                    {/* Right Panel (Output) */}
                    {showRightPanel && (
                        <div className="flex flex-col bg-gray-800 border-l border-gray-600 overflow-hidden flex-shrink-0"
                            style={{ width: `${rightPanelWidth}px` }}>
                            <div className="flex justify-between items-center p-2 border-b border-gray-600">
                                <h3 className="text-sm font-medium text-gray-300">Output</h3>
                                <button onClick={() => setShowRightPanel(false)} className="text-gray-400 hover:text-white" title="Close panel">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="h-full flex flex-col">
                                {React.isValidElement(finalRightPanelContent) ? (
                                    finalRightPanelContent
                                ) : isPanelTabs(finalRightPanelContent) ? (
                                    <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="h-full flex flex-col">
                                        <TabsList className="grid w-full pt-0 z-10" style={{ gridTemplateColumns: `repeat(${finalRightPanelContent.tabs.length}, 1fr)` }}>
                                            {finalRightPanelContent.tabs.map((tab: any) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-[12px] py-1">
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        <div className="flex-1 min-h-0 overflow-hidden">
                                            {finalRightPanelContent.tabs.map((tab: any) => (
                                                <TabsContent key={tab.key} value={tab.key} className="h-full">
                                                    {tab.content}
                                                </TabsContent>
                                            ))}
                                        </div>
                                    </Tabs>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div >
            </div >
        </div >
    );
}

type TabProps = {
    key: string;
    label: React.ReactNode;
    content: React.ReactNode;
};
