'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useDispatch, useStore } from 'react-redux';
import { Plus, Paperclip, Edit, Clipboard, Library, Save, X, BookmarkPlus, Check, FileText, Info, HelpCircle, MessageSquareDashed } from 'lucide-react';
import mermaid from 'mermaid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { RootState } from '@/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Load heavy components dynamically
const ChatComponent = dynamic(() => import('@/components/ai-chat/ChatComponent'), {
    ssr: false,
    loading: () => <div className="p-4 text-sm">Loading chat…</div>
});

// Load MarkdownLibrary dynamically to avoid affecting main UI responsiveness
const MarkdownLibrary = dynamic(() => import('@/components/ai-chat/MarkdownLibrary'), {
    ssr: false,
    loading: () => <div className="p-4 text-center text-sm">Loading document library...</div>
});

import { saveMarkdownDocument } from '@/features/model-universe/modelSlice';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import ConversationsPanel from '@/components/ai-chat/ConversationsPanel';
import GettingStartedGuide from '@/components/ai-chat/GettingStartedGuide';
import Guide from '@/components/ai-chat/Guide';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import { FileOperations } from "@/components/FileOperations";
import {
    saveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation
} from '@/features/chat/chatSlice';

export interface ChatComponentProps {
    onResponseChange: (response: string) => void;
    onViewInMarkdown: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    setShowRightPanel?: (show: boolean) => void; // Add this new prop
    error?: string;
    chatInput?: string;
    input: string;
    setInput: (input: string) => void;
    setMdContent: (message: string) => void;
    mdContent: string;
    onAddMD?: () => void;
    currentDocument?: string;
    mdPreview: string;
    setMdPreview: (preview: string) => void;
    setCurrentMessages: (messages: any[]) => void;
    gettingStartedGuide: React.ReactNode;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
}

const ModalPage = () => {
    const dispatch = useDispatch();

    // We'll read these from the store only after the user opens the assistant to avoid
    // heavy subscriptions on initial page load.
    const store = useStore();
    const [metisState, setMetisState] = useState<any | null>(null);
    const [documentsState, setDocumentsState] = useState<any[] | null>(null);
    const [focusModelIdState, setFocusModelIdState] = useState<string | null>(null);
    const [conversationsState, setConversationsState] = useState<any[] | null>(null);
    const [activeConversationIdState, setActiveConversationIdState] = useState<string | null>(null);

    const [currentModel, setCurrentModel] = useState<any | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);

    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [focusModelLocal, setFocusModelLocal] = useState<{ id: string; name: string } | null>(null);
    const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    // do NOT subscribe to messages here on initial render.
    // Use conversationsState / activeConversationIdState (read from store when showAppLoaded=true).
    const [input, setInput] = useState<string>("");
    const [chatInput, setChatInput] = useState('');
    const [mdPreview, setMdPreview] = useState<string>('Nothing to preview yet!'); // Markdown preview state
    const [mdContent, setMdContent] = useState<string>('')
    const [selectedModel, setSelectedModel] = useState('gpt-5-mini'); // Default model
    const [showGuideModal, setShowGuideModal] = useState(false);

    // Track library open state and loading status
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State to manage editing mode
    const [docName, setDocName] = useState('');
    const [currentDocument, setCurrentDocument] = useState<string>('');
    const mdFileInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Panel visibility state and response state
    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [lastResponse, setLastResponse] = useState<string>("");

    // Defer heavy chat mount until user requests it
    const [showChatLoaded, setShowChatLoaded] = useState(false);

    // Defer mounting entire assistant UI until user explicitly opens it
    const [showAppLoaded, setShowAppLoaded] = useState(false);

    // Conversation handlers
    const handleSelectConversation = (conversation: any) => {
        if (conversation) {
            dispatch(loadConversation(conversation.id));
        } else {
            dispatch(startNewConversation());
        }
    };

    const handleDeleteConversation = (id: string) => {
        dispatch(deleteConversation(id));
    };

    const handleSaveCurrentConversation = () => {
        // Save using Redux action. The action can read the messages from the store if needed.
        dispatch(saveConversation({}));
    };

    // derive currentModel when the deferred store data changes
    useEffect(() => {
        const found = metisState?.models?.find((m: any) => m.id === focusModelIdState) || null;
        setCurrentModel(found);
        const mm = metisState?.metamodels?.find((mm: any) => mm.id === found?.metamodelRef) || null;
        setCurMetamodel(mm);
    }, [metisState, focusModelIdState]);

    // When user opens the app, read store state once and subscribe for updates while open
    useEffect(() => {
        if (!showAppLoaded) return;

        const readState = () => {
            try {
                const s = store.getState() as RootState;
                setMetisState(s.modelUniverse?.phData?.metis ?? null);
                setDocumentsState(s.modelUniverse?.phData?.documents ?? null);
                setFocusModelIdState(s.modelUniverse?.phFocus?.focusModel?.id ?? null);
                setConversationsState(s.chat?.conversations ?? null);
                setActiveConversationIdState(s.chat?.activeConversationId ?? null);
            } catch { /* ignore */ }
        };

        // initial read
        readState();

        // subscribe to store changes while assistant UI is active
        const unsubscribe = store.subscribe(() => {
            readState();
        });

        return () => unsubscribe();
    }, [showAppLoaded, store]);

    const handleStartNewConversation = () => {
        dispatch(startNewConversation());
    };

    // no-op kept for ChatComponent API compatibility
    const setCurrentMessages = (messages: any[]) => { /* noop - Redux handles messages */ };

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768); // Set mobile breakpoint at 768px
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Initialize mermaid once and schedule runs via idle/timer to avoid blocking UI
    useEffect(() => {
        try {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                flowchart: { curve: 'linear' },
                sequence: { showSequenceNumbers: true },
                themeVariables: {
                    primaryColor: '#1e3a8a',
                    edgeLabelBackground: '#334155',
                    edgeLabelBorder: '#1e3a8a',
                }
            });
        } catch (err) { /* ignore */ }
    }, []);

    // throttle mermaid.run using idle callback / timeout
    const mermaidIdleRef = useRef<number | null>(null);
    useEffect(() => {
        if (!mdPreview || !mdPreview.includes('mermaid') || isEditing) return;

        const runMermaid = () => {
            try { mermaid.run(); } catch (e) { /* swallow errors */ }
        };

        if (mermaidIdleRef.current !== null) {
            try {
                if ('cancelIdleCallback' in window) {
                    // @ts-ignore
                    cancelIdleCallback(mermaidIdleRef.current);
                } else {
                    clearTimeout(mermaidIdleRef.current);
                }
            } catch { }
            mermaidIdleRef.current = null;
        }

        if ('requestIdleCallback' in window) {
            // @ts-ignore
            mermaidIdleRef.current = requestIdleCallback(runMermaid, { timeout: 1000 });
        } else {
            mermaidIdleRef.current = window.setTimeout(runMermaid, 300);
        }

        return () => {
            if (mermaidIdleRef.current !== null) {
                try {
                    if ('cancelIdleCallback' in window) {
                        // @ts-ignore
                        cancelIdleCallback(mermaidIdleRef.current);
                    } else {
                        clearTimeout(mermaidIdleRef.current);
                    }
                } catch { }
                mermaidIdleRef.current = null;
            }
        };
    }, [mdPreview, isEditing]);

    useEffect(() => {
        // Only update the document name if it's currently empty and we have markdown content
        if (!docName && mdPreview) {
            const firstLine = mdPreview.split('\n')[0] || '';
            const cleanName = firstLine.replace(/^[#\-*>`_]+\s*/, '').replace(/[^a-zA-Z0-9 ]/g, '_').trim();
            if (cleanName) setDocName(cleanName);
        }
    }, [mdPreview, docName]);

    // save currentDocument to localStorage whenever it changes
    useEffect(() => {
        if (currentDocument) {
            try { localStorage.setItem('currentDocument', currentDocument); } catch { }
        }
    }, [currentDocument]);

    // load currentDocument from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('currentDocument');
            if (stored) setCurrentDocument(stored);
        } catch { }
    }, []);

    // listen for storage changes (other tabs / custom events)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'currentDocument' && e.newValue !== null && e.newValue !== currentDocument) {
                setCurrentDocument(e.newValue);
            }
        };
        const handleCustomStorageChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent?.detail?.key === 'currentDocument' && customEvent.detail.newValue !== currentDocument) {
                setCurrentDocument(customEvent.detail.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('localStorageChange', handleCustomStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localStorageChange', handleCustomStorageChange);
        };
    }, [currentDocument]);

    const handleShowInLeftPanel = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
    };

    // Handle library open with loading indicator
    const handleOpenLibrary = () => {
        setIsLibraryLoading(true);
        setIsLibraryOpen(true);
        // Reset loading after a short delay when component should be loaded
        setTimeout(() => setIsLibraryLoading(false), 300);
    };

    const handleDocumentSelect = (content: string, name: string) => {
        setMdContent(content);
        setDocName(name);
        setIsEditing(false);
        setIsLibraryOpen(false);
        setIsLibraryLoading(false);
    };

    const handleAddMD = () => mdFileInputRef.current?.click();

    const handleExportLibrary = () => {
        if (!documentsState || documentsState.length === 0) return;
        const dataStr = JSON.stringify(documentsState, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileName = `aichat-doc-library-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    };

    const handleImportLibrary = () => fileInputRef.current?.click();

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedDocuments = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedDocuments) && importedDocuments.every(doc =>
                    typeof doc === 'object' && doc !== null &&
                    'id' in doc && 'name' in doc && 'content' in doc)) {
                    importedDocuments.forEach(doc => {
                        dispatch(saveMarkdownDocument({
                            id: doc.id || Date.now().toString(),
                            name: doc.name,
                            type: 'markdown',
                            content: doc.content,
                            createdAt: doc.createdAt || new Date().toISOString(),
                            updatedAt: doc.updatedAt || new Date().toISOString()
                        }));
                    });
                    alert(`Successfully imported ${importedDocuments.length} documents`);
                } else {
                    alert('Invalid file format. Import failed.');
                }
            } catch (error) {
                alert('Failed to import library. Invalid JSON format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleResponseChange = (response: string) => setLastResponse(response);

    const handleViewInMarkdown = (response: string) => {
        const cleanResponse = (r: string) => {
            const cleaned = r.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
            return cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
        };
        setMdPreview(cleanResponse(response));
    };

    // memoize panel definitions to avoid recreating objects on every render
    const leftPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'current-content',
                label: 'Current Content',
                content: (
                    <div className="space-y-4 px-2 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                        {currentDocument ? (
                            <div className="p-2 bg-gray-800 rounded">
                                <MarkdownPreview mdPreview={currentDocument || 'No definition available'} />
                            </div>
                        ) : (
                            <div className="p-2 bg-gray-800 rounded">
                                <div className="text-sm text-gray-400">No domain found</div>
                            </div>
                        )}
                    </div>
                )
            },
            {
                key: 'context',
                label: 'Add. Context',
                content: (
                    <DocumentPanel
                        mdContent={mdContent}
                        setMdContent={setMdContent}
                        setIsLibraryOpen={handleOpenLibrary} // Use the new handler
                        isLibraryOpen={isLibraryOpen}
                        panelType='left'
                    />
                )
            },
        ],
        defaultTab: 'current-content'
    }), [currentDocument, mdContent, isLibraryOpen]);

    const middlePanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'chat',
                label: 'AI Assistant',
                content: (
                    <div className="h-full min-w-0 w-max-[calc(100%-30rem)] overflow-hidden bg-gray-800/20 rounded pt-4 flex items-center justify-center">
                        <div className="w-full">
                            <ChatComponent
                                input={input}
                                setInput={setInput}
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                currentDocument={currentDocument}
                                setCurrentDocument={setCurrentDocument}
                                onResponseChange={handleResponseChange}
                                onViewInMarkdown={handleViewInMarkdown}
                                showLeftPanel={showLeftPanel}
                                setShowLeftPanel={setShowLeftPanel}
                                setShowRightPanel={setShowRightPanel}
                                chatInput={chatInput}
                                onAddMD={handleAddMD}
                                mdContent={mdContent}
                                setMdContent={setMdContent}
                                mdPreview={mdPreview}
                                setMdPreview={setMdPreview}
                                setCurrentMessages={setCurrentMessages}
                                gettingStartedGuide={<GettingStartedGuide />}
                                guide={<Guide />}
                                isMobile={isMobile}
                                setIsMobile={setIsMobile}
                            />
                        </div>
                    </div>
                )
            },
            {
                key: 'saved-chats',
                label: 'Saved Chats',
                content: (
                    <div className="p-2 h-full overflow-auto">
                        <ConversationsPanel
                            conversations={conversationsState ?? []}
                            onSelectConversation={handleSelectConversation}
                            onDeleteConversation={handleDeleteConversation}
                            onSaveConversation={handleSaveCurrentConversation}
                            onViewInMarkdown={handleViewInMarkdown}
                            mdPreview={mdPreview}
                        />
                    </div>
                )
            }
        ],
        defaultTab: 'chat'
    }), [input, selectedModel, currentDocument, showLeftPanel, chatInput, mdContent, mdPreview, isMobile, conversationsState, showChatLoaded]);

    const rightPanelContent = useMemo(() => ({
        tabs: [
            {
                key: 'preview',
                label: 'Preview',
                content: (
                    <DocumentPanel
                        mdContent={mdPreview}
                        setMdContent={setMdPreview}
                        setIsLibraryOpen={handleOpenLibrary} // Use the new handler
                        isLibraryOpen={isLibraryOpen}
                        panelType='right'
                        currentDocumentContent={currentDocument}
                        markdownPreviewContent={mdPreview}
                    />
                )
            }
        ],
        defaultTab: 'preview'
    }), [mdPreview, isLibraryOpen, currentDocument]);

    const modelSelector = useMemo(() => {
        if (!metisState) {
            return (
                <div className="flex justify-between bg-gray-800 text-xs">
                    <div className="px-1">
                        <label className="ms-1 font-bold text-gray-400 inline-block">Document:</label>
                        <span className="text-gray-300">{(documentsState as any)?.[0]?.name}</span>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex justify-between bg-gray-800 text-xs">
                <div className="px-1">
                    <label className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</label>
                    <span className="text-gray-300">{metisState?.name}</span>
                </div>
                <div className="px-1">
                    <label className="me-1 font-bold text-gray-400 inline-block">Current Model:</label>
                    <select id="model-select" className="ps-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={(e) => {
                        const selected = metisState?.models?.find((m: any) => m.name === e.target.value) || null;
                        setCurrentModel(selected);
                        setFocusModelLocal(selected);
                        setFocusModelview(selected?.modelviews?.[0] || null);
                    }} value={currentModel?.name || ''}>
                        {metisState?.models?.map?.((model: { name: string }) => (
                            <option key={model.name} value={model.name}>{model.name}</option>
                        ))}
                    </select>
                </div>
                <div className="px-1 me-auto">
                    <span className="text-gray-400">{curMetamodel?.name || "Default"}</span>
                </div>
                <h3 className="flex ms-1 pl-1 font-bold text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length || 0}</span></h3>
            </div>
        );
    }, [metisState, documentsState, currentModel, curMetamodel]);

    // Improved handling for stale font preload warning:
    // - Ensure as="font" and crossorigin are set
    // - Wait a short grace period and check performance resource entries
    // - Only remove the preload if the browser did not actually request the resource
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const fontFragment = 'e4af272ccee01ff0-s.p.woff2';
        const selector = `link[rel="preload"][href*="${fontFragment}"]`;
        const links = Array.from(document.querySelectorAll(selector)) as HTMLLinkElement[];
        if (links.length === 0) return;

        // Apply best-practice attributes for font preloads
        links.forEach(link => {
            try {
                if (link.getAttribute('as') !== 'font') link.setAttribute('as', 'font');
                if (!link.getAttribute('crossorigin')) link.setAttribute('crossorigin', 'anonymous');
            } catch { /* ignore DOM write errors */ }
        });

        const cleanups: Array<() => void> = [];

        links.forEach((link) => {
            const href = link.href;

            // Function to remove the link if unused
            const removeIfUnused = () => {
                try {
                    const used = performance.getEntriesByType('resource').some((r: any) => r && r.name === href);
                    if (!used) {
                        link.parentNode?.removeChild(link);
                        console.warn('Removed unused font preload link:', href);
                    }
                } catch { /* ignore */ }
            };

            // Schedule a check after a short grace period
            const timerId = window.setTimeout(removeIfUnused, 3000);
            cleanups.push(() => clearTimeout(timerId));

            // If the link errors while loading, remove it immediately
            const onError = () => {
                try { link.parentNode?.removeChild(link); } catch { /* ignore */ }
            };
            link.addEventListener('error', onError);
            cleanups.push(() => link.removeEventListener('error', onError));
        });

        return () => {
            cleanups.forEach(fn => {
                try { fn(); } catch { /* ignore */ }
            });
        };
    }, []);

    // If a font preload link exists but is not used, force-apply it briefly so the browser
    // recognizes the resource as used and won't emit the "preloaded but not used" warning.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const fontFragment = 'e4af272ccee01ff0-s.p.woff2';
        const selector = `link[rel="preload"][href*="${fontFragment}"]`;
        const link = document.querySelector(selector) as HTMLLinkElement | null;
        if (!link) return;

        try {
            const href = link.href;
            // create a unique font-family name to avoid collisions
            const family = `__preload_fix_${Math.random().toString(36).slice(2, 8)}`;

            // inject @font-face rule pointing to the same href
            const style = document.createElement('style');
            style.setAttribute('data-preload-fix', '1');
            style.textContent = `
                @font-face {
                    font-family: '${family}';
                    src: url('${href}') format('woff2');
                    font-display: swap;
                }
            `;
            document.head.appendChild(style);

            // create a tiny off-screen element that uses the font to mark it as used
            const span = document.createElement('span');
            span.style.position = 'absolute';
            span.style.left = '-9999px';
            span.style.width = '1px';
            span.style.height = '1px';
            span.style.overflow = 'hidden';
            span.style.fontFamily = `'${family}', sans-serif`;
            span.textContent = '.';
            document.body.appendChild(span);

            // remove injected elements after a short period (keep long enough for browser to consider it used)
            const cleanupTimer = window.setTimeout(() => {
                try {
                    span.parentNode?.removeChild(span);
                    style.parentNode?.removeChild(style);
                } catch { /* ignore */ }
            }, 5000);

            return () => {
                clearTimeout(cleanupTimer);
                try {
                    span.parentNode?.removeChild(span);
                } catch { }
                try {
                    style.parentNode?.removeChild(style);
                } catch { }
            };
        } catch {
            // ignore any injection errors
        }
    }, []);

    // Modal component used by this page (backdrop closes, inner content stops propagation)
    const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
        if (!isOpen) return null;
        return (
            <div
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                onClick={onClose}
            >
                <div
                    className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden mx-4 border-[1rem] border-l-orange-700 border-t-orange-700 border-r-orange-900/80 border-b-orange-900 border-gradient-to-br from-orange-900/20 via-gray-900/40 to-black/60 shadow-[0_25px_60px_-15px_rgba(249,115,22,0.45)]">
            {/* Larger green indicator bar at the top */}
            {/* <div className="h-2.5 w-full bg-gradient-to-r from-green-700 to-green-500"></div> */}

            {/* Compact header with minimal height */}
            <div className="flex justify-between items-center py-1 px-2 border-b border-gray-700 bg-gray-800/90">
            <span className="font-bold text-orange-500/60">Edit mode</span>
            <span className="font-medium font-bold text-orange-400/60">AI Chat Assistant</span>
            <Link href="/ai-chat" className="p-1 text-orange-400 hover:text-orange-200">
                <X className="w-4 h-4" />
            </Link>
            </div>

            {/* Main content area that takes remaining height */}
            <div className="flex-1 overflow-hidden bg-gray-900/60">
            <ThreePanelLayout
                moduleOperations={modelSelector}
                leftPanelContent={leftPanelContent}
                middlePanelContent={middlePanelContent}
                rightPanelContent={rightPanelContent}
                showLeftPanel={showLeftPanel}
                setShowLeftPanel={setShowLeftPanel}
                showRightPanel={showRightPanel}
                setShowRightPanel={setShowRightPanel}
                className="h-full min-w-0 bg-background text-gray-100"
            >
                <></>
            </ThreePanelLayout>
            </div>

            {/* Library and Guide modals remain unchanged */}
            {isLibraryOpen && (
            <Modal
                isOpen={isLibraryOpen}
                onClose={() => { setIsLibraryOpen(false); setIsLibraryLoading(false); }}
            >
                <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
                <div className="flex space-x-2">
                    <button onClick={handleImportLibrary} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded">
                    Import
                    </button>
                    <button onClick={handleExportLibrary} className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded" disabled={!documentsState || documentsState.length === 0}>
                    Export
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelection} accept=".json" style={{ display: 'none' }} />
                </div>
                </div>
                <div className="text-sm text-gray-400 max-h-[70vh] overflow-auto">
                {isLibraryLoading ? (
                    <div className="p-4 text-center">Loading document library...</div>
                ) : (
                    <MarkdownLibrary onSelect={handleDocumentSelect} onShowInLeftPanel={handleShowInLeftPanel} onSetCurrentDocument={setCurrentDocument} hideExportLibraryButton={false} />
                )}
                </div>
            </Modal>
            )}

            <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)}>
            <GettingStartedGuide />
            </Modal>
        </div>
    );
};

export default ModalPage;
