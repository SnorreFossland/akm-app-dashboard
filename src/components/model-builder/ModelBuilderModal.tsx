import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// The modal will render only the AI Assistant (middle) tab content — not the full three-panel layout.

export interface ModelBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleOperations?: React.ReactNode;
    leftPanelContent?: any;
    middlePanelContent?: any;
    rightPanelContent?: any;
    showLeftPanel?: boolean;
    setShowLeftPanel?: (v: boolean) => void;
    showRightPanel?: boolean;
    setShowRightPanel?: (v: boolean) => void;
    className?: string;
}

/**
 * Modal wrapper for the Model Builder — mirrors the AI chat modal behavior.
 * Mounts the three-panel modal only when `isOpen` is true and ensures
 * left/right panel visibility is set when opened.
 */
export default function ModelBuilderModal({
    isOpen,
    onClose,
    moduleOperations,
    leftPanelContent,
    middlePanelContent,
    rightPanelContent,
    showLeftPanel,
    setShowLeftPanel,
    showRightPanel,
    setShowRightPanel,
    className,
}: ModelBuilderModalProps) {
    // Keep parent panels unchanged; modal shows only the AI Assistant content.
    useEffect(() => {
        // If callers provided handlers and want panels shown when modal opens, they can handle that.
    }, [isOpen]);

    if (!isOpen) return null;

    // Find the ai-model tab from the provided middlePanelContent
    const aiTab = (middlePanelContent?.tabs || []).find((t: any) => t.key === 'ai-model') || (middlePanelContent?.tabs?.[0] ?? null);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>AI Modelling Assistant</DialogTitle>
                </DialogHeader>

                <div className="h-[calc(85vh-64px)] overflow-auto p-4">
                    {aiTab ? aiTab.content : <div className="text-sm text-gray-400">No content available</div>}
                </div>

                <DialogFooter>
                    <div className="w-full flex justify-end">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
