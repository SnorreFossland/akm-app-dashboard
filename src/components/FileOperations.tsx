'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';
import { handleGetDefaultFile, handleGetPublicFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo, setSource, setFileData, setDomainData } from '@/features/model-universe/modelSlice';
import { clearCurrentMessages, startNewConversation } from '@/features/chat/chatSlice';
import { getCurrentMenuItemDescription } from '@/utils/navigationHelpers';
import { persistor } from '@/store/store';


interface FileOperationsProps {
    className?: string;
}

export function FileOperations({ className = "" }: FileOperationsProps) {
    const data = useAppSelector((state) => state.modelUniverse);
    const domain = data.phData.domain
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelUniverse = data.phSource;
    const currentMenuItemDescription = getCurrentMenuItemDescription(pathname);
    const [isMobile, setIsMobile] = useState(false);

    console.log('FileOperations component mounted with data:', data);



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

    const onLoadMimris = () => {
        handleGetPublicFile(dispatch, '/Mimris-Template_PR.json', 'Mimris-Template_PR');
    };

    const onClearModel = async () => {
        // Stop redux-persist from writing new state while we clear
        persistor.pause();

        try {
            // Ensure any in-flight writes are completed before purge
            try {
                await persistor.flush();
            } catch {
                // Non-fatal; continue to purge
            }

            // Clear Redux slices in memory
            dispatch(clearStore());                  // modelUniverse -> initialState
            dispatch(clearCurrentMessages());        // clears messages + activeConversationId
            dispatch(startNewConversation());        // ensures a clean chat session

            // Remove app-specific localStorage keys
            localStorage.removeItem('currentDocument');

            // Clear sessionStorage keys for chat
            try {
                const sessionKeys = Object.keys(sessionStorage);
                const chatKeys = sessionKeys.filter(key => key.startsWith('chat_session_'));
                chatKeys.forEach(key => sessionStorage.removeItem(key));
            } catch (error) {
                console.error('Error clearing sessionStorage:', error);
                try { sessionStorage.clear(); } catch { }
            }

            // Purge redux-persist storage (removes 'persist:root')
            await persistor.purge();

            // Hard reload to fully reset UI
            window.location.reload();
        } finally {
            // After reload this won't matter, but safe to leave
            persistor.persist();
        }
    };

    return (
        <div className={`flex md:flex-row items-center justify-between w-full ${className}`}>
            <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-sm text-white whitespace-nowrap flex-shrink-0 ps-2">Universe:</span>
                <input
                    type="text"
                    value={(modelUniverse?.includes('-Template') ? (domain?.name ?? '') : (modelUniverse ?? ''))}
                    onChange={(e) => {
                        // If the current source is a template, update the domain name (so the shown value changes)
                        // and also keep phSource with the '-Template' suffix. For non-template sources, update phSource only.
                        const isTemplate = modelUniverse?.includes('-Template');
                        const templateSuffix = '-Template';
                        const rawValue = (e.target.value || '');
                        const newValue = rawValue; // preserve user's input (we'll trim when storing source)

                        if (isTemplate) {
                            // Update domain.name so the displayed value reflects the edit
                            const domainName = newValue.replace(new RegExp(`${templateSuffix}$`), '').trim();
                            // setDomainData expects a full DomainData object; preserve other fields from current domain
                            dispatch(setDomainData({
                                name: domainName,
                                description: domain?.description ?? '',
                                presentation: domain?.presentation ?? '',
                                prompt: domain?.prompt ?? '',
                            }));

                            // Ensure phSource keeps the suffix when non-empty
                            const hasSuffix = newValue.endsWith(templateSuffix);
                            const sourceName = newValue.trim();
                            const newSource = sourceName ? (hasSuffix ? sourceName : `${sourceName}${templateSuffix}`) : '';
                            dispatch(setSource(newSource));
                        } else {
                            dispatch(setSource(newValue.trimStart()));
                        }
                    }}
                    className={`bg-gray-800 px-2 py-1 rounded text-gray-400 min-w-0 flex-1 ${modelUniverse?.includes('-Template') ? 'animate-pulse placeholder:text-orange-400' : ''}`}
                    placeholder="Type your Universe/file name here"
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

                    {/* <Button
                        variant="outline"
                        size={isMobile ? "icon" : "sm"}
                        onClick={onLoadMimris}
                        className="flex items-center gap-1"
                        title="Load Mimris-Template_PR.json from /public"
                    >
                        <FontAwesomeIcon icon={faUpload} className="h-2 w-2" />
                        {!isMobile && "Mimris"}
                    </Button> */}

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