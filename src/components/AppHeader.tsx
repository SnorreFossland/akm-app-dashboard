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

interface AppHeaderProps {
    showLeftPanel?: boolean;
    showRightPanel?: boolean;
    onToggleLeftPanel?: () => void;
    onToggleRightPanel?: () => void;
    moduleOperations?: ReactNode;
}

export function AppHeader({
    showLeftPanel,
    showRightPanel,
    onToggleLeftPanel,
    onToggleRightPanel,
    moduleOperations
}: AppHeaderProps) {
    // const phSource = useAppSelector((state) => state.modelUniverse.phSource);
    // const data = useAppSelector((state) => state.modelUniverse);
    // const dispatch = useAppDispatch();
    // const fileInputRef = useRef<HTMLInputElement>(null);
    // const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // const currentDescription = getCurrentMenuItemDescription(pathname);

    return (
        <header className="bg-gray-700 border-b flex items-center justify-around">
            {/* Panel toggle buttons */}
            {onToggleLeftPanel && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleLeftPanel}
                    // className={`flex flex-col flex-grow bg-transparent text-gray-100  ${showLeftPanel ? 'bg-muted' : ''}`}
                    className="flex items-center text-xs bg-transparent hover:bg-gray-600 text-white px-1 pb-1 rounded"
                    title={showLeftPanel ? 'Hide left panel' : 'Show left panel'}
                >
                    <span>
                        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </span>
                </Button>
            )}
            <div className="flex-1 min-w-0 mx-1">
                {/* Module operations */}
                {moduleOperations && (
                    <div className="flex items-center gap-2 w-full">
                        {moduleOperations}
                    </div>
                )}
            </div>
            {/* Right Panel toggle button */}
            {onToggleRightPanel && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleRightPanel}
                    // className={`flex items-center my-0 py-0 ${showRightPanel ? 'bg-blue-600' : ''}`}
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
        </header>
    );
}