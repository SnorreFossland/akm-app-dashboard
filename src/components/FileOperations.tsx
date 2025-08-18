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
import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo, setSource, setFileData } from '@/features/model-universe/modelSlice';
import { getCurrentMenuItemDescription } from '@/utils/navigationHelpers';
import { persistor } from '@/store/store';


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
        handleGetLocalFile(event, dispatch, data);
    };

    const onGetDefaultFile = () => {
        handleGetDefaultFile(dispatch, updateModelInfo, updateProjectInfo, updateMetisInfo);
    };

    const onSaveFile = () => {
        handleSaveToLocalFile(data, dispatch);
    };

    const onClearModel = () => {
        dispatch(clearStore());

        // Clear only Redux persist data (more targeted approach)
        localStorage.removeItem('persist:root');
        localStorage.removeItem('currentDocument');

        // Clear sessionStorage items related to chat with debugging
        try {
            const sessionKeys = Object.keys(sessionStorage);
            console.log('All sessionStorage keys:', sessionKeys);

            const chatKeys = sessionKeys.filter(key => key.startsWith('chat_session_'));
            console.log('Chat session keys found:', chatKeys);

            chatKeys.forEach(key => {
                console.log(`Removing sessionStorage key: ${key}`);
                sessionStorage.removeItem(key);
            });

            // Alternative approach - clear all sessionStorage if needed
            // sessionStorage.clear();

            console.log('Remaining sessionStorage keys after cleanup:', Object.keys(sessionStorage));
        } catch (error) {
            console.error('Error clearing sessionStorage:', error);
            // Fallback: try to clear all sessionStorage
            try {
                sessionStorage.clear();
            } catch (fallbackError) {
                console.error('Fallback sessionStorage.clear() also failed:', fallbackError);
            }
        }

        persistor.purge().then(() => {
            window.location.reload();
        });
    };

    return (
        <div className={`flex md:flex-row items-center justify-between w-full ${className}`}>
            <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-sm text-white whitespace-nowrap flex-shrink-0 ps-1">Universe:</span>
                <input
                    type="text"
                    value={modelUniverse || ''} // Add fallback empty string to ensure value is never undefined
                    onChange={(e) => dispatch(setSource(e.target.value))}
                    className="bg-gray-800 px-2 py-1 rounded text-sm text-white min-w-0 flex-1"
                    placeholder="Universe name"
                />
                <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">File: {modelUniverse}.json</div>
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