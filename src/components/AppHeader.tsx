'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faBars, faColumns } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/model-universe/components/HandleGetLocalFileClick';
import { handleGetDefaultFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo } from '@/features/model-universe/modelSlice';
import { getCurrentMenuItemDescription } from '@/utils/navigationHelpers';
import {
    ChevronLeft,
    ChevronRight,
    PanelLeft,
    PanelRight,
} from "lucide-react";

interface AppHeaderProps {
    showLeftPanel: boolean;
    showRightPanel: boolean;
    onToggleLeftPanel?: () => void;
    onToggleRightPanel?: () => void;
    moduleOperations?: React.ReactNode;
    isMobile?: boolean;
}

export function AppHeader({
    showLeftPanel,
    showRightPanel,
    onToggleLeftPanel,
    onToggleRightPanel,
    moduleOperations,
    isMobile = false
}: AppHeaderProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <header className="flex items-center justify-between p-2 bg-background border-b border-gray-600 h-14">
            <div className="flex items-center space-x-2">
                {onToggleLeftPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleLeftPanel}
                        title={showLeftPanel ? "Hide Left Panel" : "Show Left Panel"}
                    >
                        {showLeftPanel ? <ChevronLeft /> : <PanelLeft />}
                    </Button>
                )}
            </div>

            <div className="flex-grow flex justify-center">
                {moduleOperations}
            </div>

            <div className="flex items-center space-x-2">
                {onToggleRightPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleRightPanel}
                        title={showRightPanel ? "Hide Right Panel" : "Show Right Panel"}
                    >
                        {showRightPanel ? <ChevronRight /> : <PanelRight />}
                    </Button>
                )}
            </div>
        </header>
    );
}