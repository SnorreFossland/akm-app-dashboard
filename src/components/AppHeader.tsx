'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/model-universe/components/HandleGetLocalFileClick';
import { handleGetDefaultFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo } from '@/features/model-universe/modelSlice';
import { getCurrentMenuItemDescription } from '@/utils/navigationHelpers';

export function AppHeader() {
    const phSource = useAppSelector((state) => state.modelUniverse.phSource);
    const data = useAppSelector((state) => state.modelUniverse);
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const currentDescription = getCurrentMenuItemDescription(pathname);

    return (
        <header className="px-4 bg-gray-700 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-orange-200/80">
                <span>{pathname}
                    {(currentDescription) && ` - ${currentDescription}`
                    }
                </span>
            </div>
            <div className="flex items-center">
                <span>AI Assisted Mimris Modelling</span>
                <span className="ml-2 text-sm text-gray-400">Beta</span>
            </div>

            <div className="flex justify-end items-center gap-2">
                <span className="mt-1 mr-2 font-bold text-sm text-green-600">
                    File: {isClient ? (phSource || 'Local file not loaded') : 'Loading...'}.json
                </span>
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json"
                    onChange={(e) => handleGetLocalFile(e, dispatch)}
                />

                {/* Open File Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGetLocalFileClick(fileInputRef)}
                    className="flex items-center my-0 py-0"
                    title='Open a file from local storage'
                >
                    <Upload className="h-3 w-4" />
                    Open
                </Button>

                {/* Save File Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveToLocalFile(data)}
                    className="flex items-center my-0 py-0"
                    title='Save the current file to local storage'
                >
                    <Download className="h-3 w-4" />
                    Save
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        dispatch(clearStore());
                        handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
                    }}
                    className="flex items-center my-0 py-0"
                    title='Clear the current file and load the default file'
                >
                    Clear
                </Button>
            </div>
        </header>
    );
}