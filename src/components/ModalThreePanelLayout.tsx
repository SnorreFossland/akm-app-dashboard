import React, { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import DocumentPanel from "@/components/ai-chat/DocumentPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react';

export interface PanelTab {
    key: string;
    label: React.ReactNode;
    content: React.ReactNode;
}

export interface PanelGroup {
    tabs: PanelTab[];
    defaultTab?: string;
}

export interface ModalThreePanelLayoutProps {
    leftPanelContent: any;
    middlePanelContent: any;
    rightPanelContent: any;
    showLeftPanel?: boolean;
    setShowLeftPanel?: (v: boolean) => void;
    showRightPanel?: boolean;
    setShowRightPanel?: (v: boolean) => void;
    moduleOperations?: React.ReactNode;
    className?: string;
    showAppHeader?: boolean;
    // Add an optional isOpen prop so parent can indicate visibility
    isOpen?: boolean;
    // Add onClose prop to handle modal close events
    onClose?: () => void;
    children?: React.ReactNode;
}

export function ModalThreePanelLayout({
    leftPanelContent,
    middlePanelContent,
    rightPanelContent,
    showLeftPanel,
    setShowLeftPanel,
    showRightPanel,
    setShowRightPanel,
    moduleOperations,
    className,
    showAppHeader = true,
    // default to false if not provided
    isOpen = false,
    onClose,
    children,
}: ModalThreePanelLayoutProps) {
    const [localShowLeft, setLocalShowLeft] = useState<boolean>(!!showLeftPanel);
    const [localShowRight, setLocalShowRight] = useState<boolean>(!!showRightPanel);

    const finalLeft = leftPanelContent;
    const finalMiddle = middlePanelContent;
    const finalRight = rightPanelContent;

    const [activeLeftTab, setActiveLeftTab] = useState(finalLeft?.defaultTab || finalLeft?.tabs?.[0]?.key || "document");
    const [activeMiddleTab, setActiveMiddleTab] = useState(finalMiddle?.defaultTab || finalMiddle?.tabs?.[0]?.key || "guide");
    const [activeRightTab, setActiveRightTab] = useState(finalRight?.defaultTab || finalRight?.tabs?.[0]?.key || "help");

    useEffect(() => {
        setLocalShowLeft(!!showLeftPanel);
    }, [showLeftPanel]);

    useEffect(() => {
        setLocalShowRight(!!showRightPanel);
    }, [showRightPanel]);

    // mirror local -> parent
    useEffect(() => {
        if (typeof setShowLeftPanel === "function") setShowLeftPanel(localShowLeft);
    }, [localShowLeft, setShowLeftPanel]);

    useEffect(() => {
        if (typeof setShowRightPanel === "function") setShowRightPanel(localShowRight);
    }, [localShowRight, setShowRightPanel]);

    useEffect(() => {
        if (!isOpen) {
            // if modal not open, do nothing (no listeners)
            return;
        }

        const handleSetRightTab = (e: Event) => {
            try {
                const ce = e as CustomEvent;
                const key = ce?.detail?.key;
                if (key) {
                    setActiveRightTab(key);
                    // ensure right panel is shown in modal when a tab is requested
                    setLocalShowRight(true);
                }
            } catch (err) {
                // ignore malformed events
                // console.warn('ModalThreePanelLayout.handleSetRightTab error', err);
            }
        };

        const handleOpenRight = () => {
            setLocalShowRight(true);
        };

        window.addEventListener("threepanel:setRightTab", handleSetRightTab as EventListener);
        window.addEventListener("threepanel:openRight", handleOpenRight as EventListener);

        return () => {
            window.removeEventListener("threepanel:setRightTab", handleSetRightTab as EventListener);
            window.removeEventListener("threepanel:openRight", handleOpenRight as EventListener);
        };
    }, [isOpen /* only attach when visibility changes */]);

    // Toggle handlers
    const handleToggleLeftPanel = () => setLocalShowLeft(!localShowLeft);
    const handleToggleRightPanel = () => setLocalShowRight(!localShowRight);

    // Combined modal: shows left, middle and right panels side-by-side
    const combinedOpen = localShowLeft || localShowRight;

    return (
        <div className={`h-full p-1 min-w-0 bg-background text-gray-100 overflow-hidden ${className}`}>
            <div className="flex flex-col h-full">
                {showAppHeader && (
                    <div className="min-w-0 w-full">
                        <AppHeader
                            showLeftPanel={localShowLeft}
                            showRightPanel={localShowRight}
                            onToggleLeftPanel={handleToggleLeftPanel}
                            onToggleRightPanel={handleToggleRightPanel}
                            moduleOperations={moduleOperations}
                        />
                    </div>
                )}


                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0">
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle>AI Assistant</DialogTitle>
                        </DialogHeader>

                        {/* Panel toggle buttons below the header line */}
                        <div className="flex justify-between items-center px-6 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                {!localShowLeft && (
                                    <button
                                        onClick={handleToggleLeftPanel}
                                        className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded"
                                        title="Show left panel"
                                    >
                                        <PanelLeft className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center">
                                {!localShowRight && (
                                    <button
                                        onClick={handleToggleRightPanel}
                                        className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded"
                                        title="Show right panel"
                                    >
                                        <PanelRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex h-full overflow-hidden">
                            {/* Left Panel */}
                            {localShowLeft && finalLeft && (
                                <div className="flex flex-col bg-gray-800 border-r border-gray-600 overflow-hidden w-80 flex-shrink-0">
                                    <div className="flex justify-between items-center p-2 border-b border-gray-600">
                                        <h3 className="text-sm font-medium text-gray-300">Input</h3>
                                        <button
                                            onClick={handleToggleLeftPanel}
                                            className="text-gray-400 hover:text-white"
                                            title="Close panel"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex flex-col flex-1 overflow-hidden">
                                        <TabsList className="grid w-full pt-3 z-20" style={{ gridTemplateColumns: `repeat(${finalLeft.tabs.length}, 1fr)` }}>
                                            {finalLeft.tabs.map((tab: any) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalLeft.tabs.map((tab: any) => (
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">
                                                {tab.content}
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            )}

                            {/* Middle Panel */}
                            <div className="flex flex-col flex-grow bg-background text-gray-100 overflow-hidden min-w-0">
                                {finalMiddle && (
                                    <Tabs value={activeMiddleTab} onValueChange={setActiveMiddleTab} className="flex flex-col flex-1 overflow-hidden">
                                        <TabsList className="grid w-full pt-3 z-10" style={{ gridTemplateColumns: `repeat(${finalMiddle.tabs.length}, 1fr)` }}>
                                            {finalMiddle.tabs.map((tab: any) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalMiddle.tabs.map((tab: any) => (
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">
                                                {tab.content}
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                )}
                                {children}
                            </div>

                            {/* Right Panel */}
                            {localShowRight && finalRight && (
                                <div className="flex flex-col bg-gray-800 border-l border-gray-600 overflow-hidden w-80 flex-shrink-0">
                                    <div className="flex justify-between items-center p-2 border-b border-gray-600">
                                        <h3 className="text-sm font-medium text-gray-300">Output</h3>
                                        <button
                                            onClick={handleToggleRightPanel}
                                            className="text-gray-400 hover:text-white"
                                            title="Close panel"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col flex-1 overflow-hidden">
                                        <TabsList className="grid w-full pt-3 z-20" style={{ gridTemplateColumns: `repeat(${finalRight.tabs.length}, 1fr)` }}>
                                            {finalRight.tabs.map((tab: any) => (
                                                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {finalRight.tabs.map((tab: any) => (
                                            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">
                                                {tab.content}
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default ModalThreePanelLayout;