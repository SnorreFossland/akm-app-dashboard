'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';
import { handleGetDefaultFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo, setSource } from '@/features/model-universe/modelSlice';
import { getCurrentMenuItemDescription } from '@/utils/navigationHelpers';

interface FileOperationsProps {
    className?: string;
}

export function FileOperations({ className = "" }: FileOperationsProps) {
    const data = useAppSelector((state) => state.modelUniverse);
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelUniverse = data.phSource;
    const currentMenuItemDescription = getCurrentMenuItemDescription(pathname);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleGetLocalFile(event, dispatch, updateModelInfo, updateProjectInfo, updateMetisInfo);
    };

    const onGetDefaultFile = () => {
        handleGetDefaultFile(dispatch, updateModelInfo, updateProjectInfo, updateMetisInfo);
    };

    const onSaveFile = () => {
        handleSaveToLocalFile(data.phData);
    };

    const onClearModel = () => {
        dispatch(clearModel());
    };

    return (
        <div className={`flex flex-col md:flex-row items-center gap-2 w-full ${className}`}>
            <div className="flex-shrink-0 min-w-0 w-full md:flex-1 md:max-w-md flex items-center gap-2">
                <span className="text-sm text-white whitespace-nowrap">Universe:</span>
                <input
                    type="text"
                    value={modelUniverse}
                    onChange={(e) => dispatch(setSource(e.target.value))}
                    className="bg-gray-800 px-2 py-1 rounded text-sm text-white min-w-0 w-full md:w-48"
                    placeholder="Universe name"
                />
                <div className="text-xs text-gray-500 whitespace-nowrap">File: {modelUniverse}.json</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={onFileSelected}
                    />

                    <Button
                        variant="outline"
                        size={isMobile ? "icon" : "sm"}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1"
                        title="Load a file from your computer"
                    >
                        <FontAwesomeIcon icon={faUpload} className="h-2 w-2" />
                        {!isMobile && "Load"}
                    </Button>

                    <Button
                        variant="outline"
                        size={isMobile ? "icon" : "sm"}
                        onClick={onSaveFile}
                        className="flex items-center gap-1"
                        title="Save the current file to your computer"
                    >
                        <FontAwesomeIcon icon={faDownload} className="h-2 w-2" />
                        {!isMobile && "Save"}
                    </Button>

                    <Button
                        variant="outline"
                        size={isMobile ? "icon" : "sm"}
                        onClick={onClearModel}
                        className="flex items-center gap-1"
                        title="Clear the current file"
                    >
                        <FontAwesomeIcon icon={faTrash} className="h-2 w-2" />
                        {!isMobile && "Clear"}
                    </Button>
                </div>
            </div>
        </div>
    );
}