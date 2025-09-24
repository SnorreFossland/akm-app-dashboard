// src/components/OntologyEditorModal.tsx
import React, { useEffect } from "react";
import ModalThreePanelLayout from "@/components/ModalThreePanelLayout";

export interface OntologyEditorModalProps {
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

export default function OntologyEditorModal({
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
}: OntologyEditorModalProps) {
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
            // Mirror the show flags into the modal. ModalThreePanelLayout mirrors local->parent via props
            showLeftPanel={showLeftPanel}
            setShowLeftPanel={setShowLeftPanel}
            showRightPanel={showRightPanel}
            setShowRightPanel={setShowRightPanel}
            className={className}
        />
    );
}