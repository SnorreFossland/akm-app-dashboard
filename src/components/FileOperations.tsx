'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
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
    const phSource = useAppSelector((state) => state.modelUniverse.phSource);
    const data = useAppSelector((state) => state.modelUniverse);
    const domain = data.phData.domain;
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const rawDomainName = typeof domain?.name === 'string' ? domain.name : '';
    const cleanedDomainName = rawDomainName.trim();
    const rawSource = data.phSource || '';
    const displayUniverseName = rawSource && rawSource.trim().length > 0
        ? rawSource.trim()
        : cleanedDomainName;
    const isTemplateSource = rawSource.includes('-Template');
    const currentMenuItemDescription = getCurrentMenuItemDescription(pathname);
    const [isMobile, setIsMobile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        console.debug('FileOperations mounted');

    }, []);

    useEffect(() => {
        console.debug('58 FileOperations observed phSource change:', phSource, data);
    }, [phSource]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleGetLocalFile(event, dispatch, data);
    };

    const onGetDefaultFile = () => {
        handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
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

    const documents = Array.isArray(data?.phData?.documents) ? data.phData.documents : [];
    const metisModels = Array.isArray(data?.phData?.metis?.models) ? data.phData.metis.models : [];

    const hasDomainDefinition = Boolean(
        (domain?.name && domain.name.trim()) ||
        (domain?.presentation && domain.presentation.trim()) ||
        (domain?.description && domain.description.trim())
    );

    const hasProjectPlan = documents.some((doc) =>
        (doc.type && doc.type.toLowerCase() === 'project-plan') ||
        (doc.name && /project\s*plan/i.test(doc.name))
    );

    const hasModelContent = (keyword: string) => {
        const lowerKeyword = keyword.toLowerCase();
        const match = metisModels.find((model: any) =>
            typeof model?.name === 'string' && model.name.toLowerCase().includes(lowerKeyword)
        );

        if (!match) return false;
        const hasObjects = Array.isArray(match.objects) && match.objects.length > 0;
        const hasRelships = Array.isArray(match.relships) && match.relships.length > 0;
        return hasObjects || hasRelships;
    };

    const hasTypeModel = metisModels.some((model: any) => {
        const name = typeof model?.name === 'string' ? model.name.toLowerCase().trim() : '';
        return ['type model', 'type-model', 'type'].includes(name) || name.includes('type model');
    }) && hasModelContent('type');

    const statusItems = [
        { label: 'Domain', complete: hasDomainDefinition },
        { label: 'Project plan', complete: hasProjectPlan },
        { label: 'POPS model', complete: hasModelContent('pops') },
        { label: 'IRTV model', complete: hasModelContent('irtv') },
        { label: 'BPMN model', complete: hasModelContent('bpmn') },
        { label: 'TYPE model', complete: hasModelContent('core') },
        { label: 'META model', complete: hasTypeModel },
    ];
    const canOpenAiToolsModal = pathname?.startsWith('/ai-chat') || pathname?.startsWith('/model-builder');
    const openAiToolsModal = () => {
        if (typeof window === 'undefined') return;
        const target = pathname?.startsWith('/ai-chat')
            ? 'ai-chat'
            : pathname?.startsWith('/model-builder')
                ? 'model-builder'
                : null;
        if (!target) return;
        window.dispatchEvent(new CustomEvent('ai-tools:open', {
            detail: {
                target,
                action: 'toggle',
                initialMode: target === 'model-builder' ? 'ai' : 'chat',
            },
        }));
    };

    return (
        <div className={`w-full ${className}`}>

            <div className="flex md:flex-row items-center justify-between w-full">
                <div className="flex items-center gap-2 w-full">
                    <div className="flex flex-1 items-center gap-2 flex-wrap">
                        <div className="relative" ref={menuRef}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={onFileSelected}
                            />
                            <Button
                                variant="ghost"
                                size={isMobile ? 'icon' : 'sm'}
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                className="flex items-center"
                                title="File actions"
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                            {isMenuOpen && (
                                <div className="absolute left-0 mt-1 w-40 rounded-md border border-gray-700 bg-gray-900 shadow-lg z-50">
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faUpload} className="w-3.5" />
                                        <span>Open Local File</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
                                        onClick={() => {
                                            onSaveFile();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="w-3.5" />
                                        <span>Save to Local File</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-300 hover:bg-gray-800"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onClearModel();
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="w-3.5" />
                                        <span>Clear</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* <div className="bg-gray-800 rounded border border-green-900 ms-1 px-1 text-xs text-orange-400 flex-shrink-0">
                       <span className="text-orange-300">{pathname}</span>
                    </div> */}
                        <span className="text-gray-500  whitespace-nowrap flex-shrink-0">Domain Library:</span>
                        <input
                            type="text"
                            value={displayUniverseName}
                            onChange={(e) => {
                                // If the current source is a template, update the domain name (so the shown value changes)
                                // and also keep phSource with the '-Template' suffix. For non-template sources, update phSource only.
                                const templateSuffix = '-Template';
                                const rawValue = (e.target.value || '');
                                const newValue = rawValue; // preserve user's input (we'll trim when storing source)

                                if (isTemplateSource) {
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
                            className={`bg-gray-800 px-2 rounded text-white min-w-0 flex-1 ${isTemplateSource ? 'animate-pulse placeholder:text-orange-400' : ''}`}
                            placeholder="Type your Universe/file name here"
                        />
                        {/* App quick-nav buttons */}
                        <div className="flex-1 justify-around items-center gap-1 overflow-x-auto pr-2">
                            {[
                                // { label: 'Dashboard', href: '/dashboard' },
                                { label: 'Documents', href: '/ai-chat' },
                                // { label: 'Domain', href: '/domain-builder' },
                                // { label: 'Ontology', href: '/ontology-builder' },
                                { label: 'Models', href: '/model-builder' },
                                { label: 'Modelviews', href: '/modelview-builder' },
                                // { label: 'Prompt', href: '/prompt-builder' },
                                // { label: 'Roadmap', href: '/roadmap' },
                            ].map((item) => {
                                const isActive = pathname?.startsWith(item.href);
                                return (
                                    <Button
                                        key={item.href}
                                        asChild
                                        size={isMobile ? 'icon' : 'sm'}
                                        variant={isActive ? 'secondary' : 'ghost'}
                                        className={`whitespace-nowrap ${isActive ? 'text-orange-400 bg-orange-900/20 border-orange-800' : ''}`}
                                        title={item.label}
                                    >
                                        <Link href={item.href}>{!isMobile ? item.label : item.label.charAt(0)}</Link>
                                    </Button>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-1 mb-1 text-[10px] bg-gray-700 leading-tight">Status:
                            {statusItems.map((item) => (
                                <div
                                    key={item.label}
                                    className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border transition-colors ${item.complete
                                        ? 'border-green-600 bg-green-900/30 text-green-200'
                                        : 'border-gray-700 bg-gray-800/70 text-gray-400'
                                        }`}
                                    title={item.complete ? 'Completed' : 'Pending'}
                                >
                                    <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${item.complete ? 'bg-green-400' : 'bg-gray-500'
                                            }`}
                                    />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        {/* <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">File: {(displayUniverseName || 'untitled')}.json</div> */}
                        {/* <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">

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
                    </div> */}
                    </div>
                    {canOpenAiToolsModal && (
                        <Button
                            size="xs"
                            className="text-xs p-1 px-2 my-0 mx-1 text-white bg-orange-800 hover:bg-orange-700"
                            onClick={openAiToolsModal}
                        >
                            Open AI Chat
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
