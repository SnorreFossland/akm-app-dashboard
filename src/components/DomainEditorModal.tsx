import React, { useEffect } from "react";
import ModalThreePanelLayout from "@/components/ModalThreePanelLayout";

export interface DomainEditorModalProps {
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
export default function DomainEditorModal({
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
}: DomainEditorModalProps) {
    // When modal opens, ensure left/right are shown so the dialog renders all panels.
    useEffect(() => {
        if (isOpen) {
            if (typeof setShowLeftPanel === "function") setShowLeftPanel(true);
            if (typeof setShowRightPanel === "function") setShowRightPanel(true);
        }
        // We intentionally do not automatically hide left/right on mount -> unmount.
        // onClose handler (provided by parent) will be used to set isOpen false.
    }, [isOpen, setShowLeftPanel, setShowRightPanel]);

    // Only mount the heavy modal component when requested
    if (!isOpen) return null;

    return (
        <ModalThreePanelLayout
            isOpen={isOpen} // forward visibility
            onClose={onClose} // forward close handler
            moduleOperations={moduleOperations}
            leftPanelContent={leftPanelContent}
            middlePanelContent={middlePanelContent}
            rightPanelContent={rightPanelContent}
            // Mirror the show flags into the modal. ModalThreePanelLayout mirrors local->parent via props
            showLeftPanel={showLeftPanel}
            setShowLeftPanel={setShowLeftPanel}
            showRightPanel={showRightPanel}
            setShowRightPanel={setShowRightPanel}
            className={className}
        />
    );
}