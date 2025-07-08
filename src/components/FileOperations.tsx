'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFileClick } from '@/features/model-universe/components/HandleGetLocalFileClick';
import { handleGetDefaultFile } from '@/features/model-universe/components/HandleGetDefaultFile';
import { clearStore, setSource } from '@/features/model-universe/modelSlice';

interface FileOperationsProps {
    className?: string;
}

export function FileOperations({ className = "" }: FileOperationsProps) {
    const data = useAppSelector((state) => state.modelUniverse);
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelUniverse = data.phSource



    return (
        <div className={`flex justify-between items-center gap-4 w-full ${className}`}>
            <div className="flex-shrink-0 min-w-0 flex-1 max-w-md flex items-center gap-2">
                <span className="text-sm text-white whitespace-nowrap">Universe:</span>
                <input
                    type="text"
                    value={modelUniverse}
                    onChange={(e) => dispatch(setSource(e.target.value))}
                    className="bg-gray-800 px-2 py-1 rounded text-sm text-white min-w-0 w-48"
                    placeholder="Universe name"
                />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                <span className="whitespace-nowrap">File: {modelUniverse}.json</span>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleGetLocalFileClick(e)}
                />

                {/* Load button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1"
                    title="Load a file from your computer"
                >
                    <FontAwesomeIcon icon={faUpload} className="h-3 w-3" />
                    Load
                </Button>

                {/* Save button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveToLocalFile(data)}
                    className="flex items-center gap-1 px-2 py-1"
                    title="Save the current file to your computer"
                >
                    <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                    Save
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        dispatch(clearStore());
                        handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
                    }}
                    className="flex items-center px-2 py-1"
                    title="Clear the current file and load the default file"
                >
                    Clear
                </Button>
            </div>
        </div>
    );
}