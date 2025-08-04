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
        <header className="flex items-center justify-between bg-background border-b border-gray-600 h-10 text-gray-100">
            <div className="flex items-center ">
                {onToggleLeftPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleLeftPanel}
                        className="flex items-center text-xs bg-transparent hover:bg-gray-600 text-white px-1 pb-1 rounded"
                        title={showLeftPanel ? "Hide Left Panel" : "Show Left Panel"}
                    >
                        <span>
                            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </span>
                    </Button>
                )}
            </div>

            <div className="w-full">
                {moduleOperations}
            </div>

            <div className="flex items-center ms-auto space-x-2">
                {onToggleRightPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleRightPanel}
                        className="flex items-center text-xs bg-transparent hover:bg-gray-600 text-white px-1 pb-1 rounded"
                        title={showRightPanel ? 'Hide right panel' : 'Show right panel'}
                    >
                        <span>
                            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="6" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </span>
                    </Button>
                )}
            </div>
        </header>
    );
}