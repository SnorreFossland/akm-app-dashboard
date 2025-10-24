import React, { useEffect } from "react";
import ModalThreePanelLayout from "@/components/ModalThreePanelLayout";

export interface AIChatEditorModalProps {
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
 * Small wrapper that mounts ModalThreePanelLayout only when `isOpen` is true.
 * Also keeps the parent's showLeftPanel/showRightPanel in sync so header buttons behave.
 */
export default function AIChatEditorModal({
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
}: AIChatEditorModalProps) {
    // Ensure panels are shown when modal opens
    useEffect(() => {
        if (isOpen) {
            if (typeof setShowLeftPanel === "function") setShowLeftPanel(true);
            if (typeof setShowRightPanel === "function") setShowRightPanel(true);
        }
    }, [isOpen, setShowLeftPanel, setShowRightPanel]);

    if (!isOpen) return null;

    return (
        <ModalThreePanelLayout
            isOpen={isOpen}
            onClose={onClose}
            moduleOperations={moduleOperations}
            leftPanelContent={leftPanelContent}
            middlePanelContent={middlePanelContent}
            rightPanelContent={rightPanelContent}
            showLeftPanel={showLeftPanel}
            setShowLeftPanel={setShowLeftPanel}
            showRightPanel={showRightPanel}
            setShowRightPanel={setShowRightPanel}
            className={className}
            inline={false}
        />
    );
}