import React, { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import DocumentPanel from "@/components/ai-chat/DocumentPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

    // Combined modal: shows left, middle and right panels side-by-side
    const combinedOpen = localShowLeft || localShowRight;

    return (
        <div className={`h-full p-1 min-w-0 bg-background text-gray-100 overflow-hidden ${className}`}>
            <div className="flex flex-col h-full">
                {showAppHeader && (
                    <div className="min-w-0 w-full">
                        <AppHeader
                            showLeftPanel={!!showLeftPanel}
                            showRightPanel={!!showRightPanel}
                            onToggleLeftPanel={() => setLocalShowLeft((s) => !s)}
                            onToggleRightPanel={() => setLocalShowRight((s) => !s)}
                            moduleOperations={moduleOperations}
                        />
                    </div>
                )}

                <div className="flex-1 overflow-hidden min-w-0">
                    {middlePanelContent ? (
                        <div className="flex flex-col h-full overflow-hidden min-w-0">
                            <Tabs value={activeMiddleTab} onValueChange={setActiveMiddleTab} className="flex flex-col h-full">
                                <TabsList className="grid grid-cols-4 w-full pt-3 z-10">
                                    {finalMiddle?.tabs?.map((t) => (
                                        <TabsTrigger key={t.key} value={t.key} className="text-xs">
                                            {t.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="flex-1 overflow-auto min-w-0">
                                    {finalMiddle?.tabs?.map((t) => (
                                        <TabsContent key={t.key} value={t.key} className="flex-1 overflow-auto m-0 p-0 min-w-0">
                                            {t.content}
                                        </TabsContent>
                                    ))}
                                </div>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-hidden min-w-0 w-full">{children}</div>
                    )}
                </div>

                <Dialog
                    open={combinedOpen}
                    onOpenChange={(open) => {
                        // mirror to local states: when dialog closes -> hide both; when opens -> show both (keeps parity)
                        if (!open) {
                            setLocalShowLeft(false);
                            setLocalShowRight(false);
                            // Call the onClose callback when the internal dialog closes
                            if (onClose) onClose();
                        } else {
                            // Opening: ensure both sides are open so all panels are visible
                            setLocalShowLeft(true);
                            setLocalShowRight(true);
                        }
                    }}
                >
                    <DialogContent className="w-[min(98vw,1400px)] max-w-full h-[90vh] overflow-hidden p-0">
                        <DialogHeader className="p-3 border-b border-gray-700">
                            <DialogTitle>AI Assistant</DialogTitle>
                        </DialogHeader>

                        <div className="flex h-[calc(90vh-64px)] p-1 overflow-hidden min-w-0">
                            {/* Left panel column */}
                            {finalLeft && (
                                <div className="flex-shrink-0 w-80 min-w-[220px] border-r border-gray-700 bg-surface-dark flex flex-col">
                                    <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex flex-col h-full">
                                        <TabsList className="flex items-center gap-2 p-2 border-b border-gray-700">
                                            {finalLeft.tabs.map((t) => (
                                                <TabsTrigger key={t.key} value={t.key} className="text-xs">
                                                    {t.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        <div className="flex-1 overflow-auto min-w-0">
                                            {finalLeft.tabs.map((t) => (
                                                <TabsContent key={t.key} value={t.key} className="p-3 m-0 min-w-0">
                                                    {t.content}
                                                </TabsContent>
                                            ))}
                                        </div>
                                    </Tabs>
                                </div>
                            )}

                            {/* Middle panel column (main editor/chat) */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                                {finalMiddle ? (
                                    <Tabs value={activeMiddleTab} onValueChange={setActiveMiddleTab} className="flex flex-col h-full">
                                        <TabsList className="flex items-center gap-2 p-2 border-b border-gray-700">
                                            {finalMiddle.tabs.map((t) => (
                                                <TabsTrigger key={t.key} value={t.key} className="text-xs">
                                                    {t.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        <div className="flex-1 overflow-auto min-w-0">
                                            {finalMiddle.tabs.map((t) => (
                                                <TabsContent key={t.key} value={t.key} className="p-3 m-0 min-w-0">
                                                    {t.content}
                                                </TabsContent>
                                            ))}
                                        </div>
                                    </Tabs>
                                ) : (
                                    <div className="h-full w-full overflow-auto min-w-0">{children}</div>
                                )}
                            </div>

                            {/* Right panel column */}
                            {finalRight && (
                                <div className="flex-shrink-0 w-80 min-w-[220px] border-l border-gray-700 bg-surface-dark flex flex-col">
                                    <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col h-full">
                                        <TabsList className="flex items-center gap-2 px-2 border-b border-gray-700">
                                            {finalRight.tabs.map((t) => (
                                                <TabsTrigger key={t.key} value={t.key} className="text-xs">
                                                    {t.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        <div className="flex-1 overflow-auto min-w-0">
                                            {finalRight.tabs.map((t) => (
                                                <TabsContent key={t.key} value={t.key} className="p-3 m-0 min-w-0">
                                                    {t.content}
                                                </TabsContent>
                                            ))}
                                        </div>
                                    </Tabs>
                                </div>
                            )}
                        </div>

                        <DialogFooter />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default ModalThreePanelLayout;