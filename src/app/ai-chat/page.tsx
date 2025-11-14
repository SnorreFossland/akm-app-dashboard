'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, X } from 'lucide-react';

import { RootState } from '@/store';
import { FileOperations } from '@/components/FileOperations';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ModeHeader } from '@/components/ai-chat/ModeHeader';
import { ViewModeContent } from '@/components/ai-chat/modes/ViewModeContent';
import { ChatModeContent } from '@/components/ai-chat/modes/ChatModeContent';
import { EditModeContent } from '@/components/ai-chat/modes/EditModeContent';
import { setFocusDoc, MarkdownDocument, saveMarkdownDocument, updateProjectInfo, setDomainCategory } from '@/features/model-universe/modelSlice';
import type { DomainCategory } from '@/features/model-universe/modelSlice';
import DocumentTemplateSelector, { DocumentTemplate } from '@/components/ai-chat/DocumentTemplateSelector';
import { useAIChatMode } from '@/hooks/useAIChatMode';
import { MODE_CONFIGS } from '@/types/aiChatModes';
import DiffModal from '@/components/ai-chat/DiffModal';
import { buildLeftPanelTabs } from '@/components/ai-chat/modes/sharedPanelBuilders';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AIChatPage = () => {
    const dispatch = useDispatch();
    const { mode, chatSubMode, switchMode, switchChatSubMode } = useAIChatMode();

    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);
    const documents = useSelector((state: RootState) => state.modelUniverse?.phData?.documents);
    const focusDoc = useSelector((state: RootState) => state.modelUniverse?.phFocus?.focusDoc);
    const focusProject = useSelector((state: RootState) => state.modelUniverse?.phFocus?.focusProj);
    const [projectDocument, setProjectDocument] = useState<MarkdownDocument | null>(null);
    const ontology = useSelector((state: RootState) => state.modelUniverse?.phData?.domain?.ontology);

    // Shared state across all modes
    const [contextContent, setContextContent] = useState('');
    const [additionalContext, setAdditionalContext] = useState('');
    // (Editing UI moved into sharedPanelBuilders' Additional Context textarea)

    // View mode state
    const [selectedDocument, setSelectedDocument] = useState<MarkdownDocument | undefined>();
    const [currentDocument, setCurrentDocument] = useState('');

    // Add useEffect to sync projectDocument with focusProject
    useEffect(() => {
        if (focusProject) {
            const matchingDoc = documents?.find(doc => doc.id === focusProject.id);
            setProjectDocument(matchingDoc || null);
        } else {
            setProjectDocument(null);
        }
    }, [focusProject, documents]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedContext = localStorage.getItem('aiChat_context');
        const storedAdditionalContext = localStorage.getItem('aiChat_additionalContext');
        const storedFocusDocId = localStorage.getItem('aiChat_focusDocId');

        if (storedContext) setContextContent(storedContext);
        if (storedAdditionalContext) setAdditionalContext(storedAdditionalContext);
        if (storedFocusDocId) {
            dispatch(setFocusDoc({ id: storedFocusDocId, name: '' })); // name can be empty; will be set when doc is loaded
        }
    }, [dispatch]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (focusDoc?.id) {
            localStorage.setItem('aiChat_focusDocId', focusDoc.id);
        } else {
            localStorage.removeItem('aiChat_focusDocId');
        }
    }, [focusDoc]);

    useEffect(() => {
        if (!focusDoc?.id) {
            setSelectedDocument(undefined);
            setCurrentDocument('');
            return;
        }

        const doc = documents?.find(d => d.id === focusDoc.id);
        if (doc) {
            setSelectedDocument(doc);
            setDocumentName(doc.name);
            setDocumentType(doc.type || 'markdown');
            setPreviewContent(doc.content);
            setOriginalContent(doc.content);
            setCurrentDocument(doc.content);
            // initialize category from doc (if present) or fallback to live domain
            setDocumentCategory((doc as any).domainCategory ?? domain?.domainCategory ?? 'Organizational');
        }
    }, [focusDoc, documents, domain]);

    // Edit mode state
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('markdown');
    const [previewContent, setPreviewContent] = useState('');
    const [originalContent, setOriginalContent] = useState(''); // Add this to track original content

    // New: local UI state for document/domain category (pre-populated from domain if available)
    const [documentCategory, setDocumentCategory] = useState<DomainCategory>(domain?.domainCategory ?? 'Organizational');

    // Library modal state
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState<'context' | 'document' | null>(null);

    // Template selector modal state
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Panel visibility state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(false);
    // Local inline modal state for middle-panel modal
    const [showAIChatInlineModal, setShowAIChatInlineModal] = useState(false);
    const [showChatPreviewPanel, setShowChatPreviewPanel] = useState(true);
    const [showEditPreviewPanel, setShowEditPreviewPanel] = useState(true);

    // Diff modal state
    const [showDiffModal, setShowDiffModal] = useState(false);
    const [pendingSave, setPendingSave] = useState<{
        doc: MarkdownDocument;
        oldContent: string;
    } | null>(null);

    // useEffect(() => {
    //     if (typeof window === 'undefined') return;
    //     const storedContext = localStorage.getItem('aiChat_context');
    //     const storedAdditionalContext = localStorage.getItem('aiChat_additionalContext');
    //     const storedFocusDocId = localStorage.getItem('aiChat_focusDocId');

    //     if (storedContext) setContextContent(storedContext);
    //     if (storedAdditionalContext) setAdditionalContext(storedAdditionalContext);
    //     // if (storedFocusDocId) {
    //     //     dispatch(setFocusDoc({ id: storedFocusDocId }));
    //     // }
    // }, [dispatch]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (focusDoc?.id) {
            localStorage.setItem('aiChat_focusDocId', focusDoc.id);
        } else {
            localStorage.removeItem('aiChat_focusDocId');
        }
    }, [focusDoc]);

    useEffect(() => {
        if (!focusDoc?.id) {
            setSelectedDocument(undefined);
            setCurrentDocument('');
            return;
        }

        const doc = documents?.find(d => d.id === focusDoc.id);
        if (doc) {
            setSelectedDocument(doc);
            setDocumentName(doc.name);
            setDocumentType(doc.type || 'markdown');
            setPreviewContent(doc.content);
            setOriginalContent(doc.content);
            setCurrentDocument(doc.content);
            // initialize category from doc (if present) or fallback to live domain
            setDocumentCategory((doc as any).domainCategory ?? domain?.domainCategory ?? 'Organizational');
        }
    }, [focusDoc, documents, domain]);

    // Ref to track previous document value
    const previousDocumentRef = useRef<string | null>(null);

    useEffect(() => {
        if (focusProject) {
            const matchingDoc = documents?.find(doc => doc.id === focusProject.id);
            setProjectDocument(matchingDoc || null);
        } else {
            setProjectDocument(null);
        }
    }, [focusProject, documents]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedContext = localStorage.getItem('aiChat_context');
        const storedAdditionalContext = localStorage.getItem('aiChat_additionalContext');
        const storedFocusDocId = localStorage.getItem('aiChat_focusDocId');

        if (storedContext) setContextContent(storedContext);
        if (storedAdditionalContext) setAdditionalContext(storedAdditionalContext);
        if (storedFocusDocId) {
            dispatch(setFocusDoc({ id: storedFocusDocId, name: '' })); // name can be empty; will be set when doc is loaded
        }
    }, [dispatch]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (focusDoc?.id) {
            localStorage.setItem('aiChat_focusDocId', focusDoc.id);
        } else {
            localStorage.removeItem('aiChat_focusDocId');
        }
    }, [focusDoc]);

    useEffect(() => {
        if (!focusDoc?.id) {
            setSelectedDocument(undefined);
            setCurrentDocument('');
            return;
        }

        const doc = documents?.find(d => d.id === focusDoc.id);
        if (doc) {
            setSelectedDocument(doc);
            setDocumentName(doc.name);
            setDocumentType(doc.type || 'markdown');
            setPreviewContent(doc.content);
            setOriginalContent(doc.content);
            setCurrentDocument(doc.content);
            // initialize category from doc (if present) or fallback to live domain
            setDocumentCategory((doc as any).domainCategory ?? domain?.domainCategory ?? 'Organizational');
        }
    }, [focusDoc, documents, domain]);

    // Persist context to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('aiChat_context', contextContent);
    }, [contextContent]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('aiChat_additionalContext', additionalContext);
    }, [additionalContext]);

    const handleSetCurrentDocument = useCallback((content: string) => {
        setCurrentDocument(content);
    }, []);

    const openLibraryFor = useCallback((target: 'context' | 'document') => {
        setLibraryTarget(target);
        setIsLibraryOpen(true);
    }, []);

    const closeLibrary = useCallback(() => {
        setIsLibraryOpen(false);
        setLibraryTarget(null);
    }, []);

    const normalizeDocumentType = useCallback((type?: string) => {
        if (!type) return 'markdown';
        const trimmed = type.trim().toLowerCase();
        return trimmed || 'markdown';
    }, []);

    const updateProjectFromDocument = useCallback((doc: MarkdownDocument) => {
        const summary = doc.content?.replace(/\s+/g, ' ').trim().slice(0, 200) || 'No summary available.';
        dispatch(updateProjectInfo({
            id: doc.id,
            name: doc.name,
            description: summary,
        }));
        setProjectDocument(doc);
    }, [dispatch, setProjectDocument]);

    const handleOpenTemplateSelector = useCallback(() => {
        setShowTemplateSelector(true);
    }, []);

    const handleLibrarySelect = useCallback((content: string, name?: string, doc?: MarkdownDocument) => {
        if (libraryTarget === 'context') {
            setContextContent(content);
        } else if (libraryTarget === 'document') {
            setCurrentDocument(content);
            if (doc) {
                dispatch(setFocusDoc({ id: doc.id, name: doc.name }));
                setSelectedDocument(doc);
                setDocumentName(doc.name);
                setDocumentType(doc.type || 'markdown');
                setPreviewContent(doc.content);
                setOriginalContent(doc.content);
            } else {
                dispatch(setFocusDoc({ id: null, name: name || 'Untitled Document' })); // Clear focus if no doc
            }
        }
        closeLibrary();
    }, [closeLibrary, libraryTarget, dispatch]);

    // View mode handlers
    const handleSelectDocument = useCallback((doc: MarkdownDocument) => {
        dispatch(setFocusDoc({ id: doc.id, name: doc.name }));
        setSelectedDocument(doc);
        setDocumentName(doc.name);
        setDocumentType(doc.type || 'markdown');
        setOriginalContent(doc.content);
        setPreviewContent(doc.content);
        setCurrentDocument(doc.content);
    }, [dispatch]);

    const handleEditDocument = useCallback(() => {
        if (selectedDocument) {
            setDocumentName(selectedDocument.name);
            setDocumentType(selectedDocument.type || 'markdown');
            setPreviewContent(selectedDocument.content);
            setOriginalContent(selectedDocument.content);
            setCurrentDocument(selectedDocument.content);
        }
        switchMode('edit');
    }, [selectedDocument, switchMode]);

    const handleChatWithDocument = useCallback(() => {
        if (selectedDocument) {
            setContextContent(selectedDocument.content);
        }
        switchMode('chat');
    }, [selectedDocument, switchMode]);

    const handleClearCurrentDocument = useCallback(() => {
        if (!selectedDocument) return;

        const confirmed = window.confirm(`Clear "${selectedDocument.name}"?`);
        if (confirmed) {
            setCurrentDocument('');
            // TODO: Implement delete in Redux
            console.log('Clear document:', selectedDocument.id);
        }
    }, [selectedDocument]);

    // Edit mode save handler
    const handleSaveToLibrary = useCallback(() => {
        const contentToSave = currentDocument; // Use currentDocument which has the live edits

        // Find the document we're editing by matching the original content
        const existingDoc = documents?.find(doc =>
            doc.content === originalContent || doc.name === documentName
        );

        let newDoc: MarkdownDocument;
        let oldContent = originalContent || ''; // Use the stored original content

        if (existingDoc) {
            const desiredName = (documentName || '').trim();
            const desiredType = (documentType || '').trim();
            const normalizedName = desiredName !== '' ? desiredName : existingDoc.name;
            const normalizedType = desiredType !== '' ? desiredType : (existingDoc.type || 'markdown');

            // Prevent accidental name collisions with a different document
            const conflictingDoc = documents?.find(doc => doc.id !== existingDoc.id && doc.name === normalizedName);
            const finalName = conflictingDoc ? `${normalizedName} (${new Date().toISOString().slice(0, 16).replace('T', ' ')})` : normalizedName;

            // Updating existing document - keep the same ID, allow rename/type change
            newDoc = {
                id: existingDoc.id, // Keep the same ID to update in place
                name: finalName,
                type: normalizedType,
                // propagate domainCategory when updating domain docs
                ...(normalizedType === 'domain' ? { domainCategory: documentCategory } : {}),
                content: contentToSave,
                createdAt: existingDoc.createdAt,
                updatedAt: new Date().toISOString(),
            };

            // Use the existing document's content as old content if we don't have originalContent
            if (!oldContent) {
                oldContent = existingDoc.content;
            }
        } else {
            // Creating new document only if no existing document found
            newDoc = {
                id: Date.now().toString(),
                name: documentName || 'Untitled Document',
                type: documentType,
                // attach category for new domain documents
                ...((documentType || '').trim().toLowerCase() === 'domain' ? { domainCategory: documentCategory } : {}),
                content: contentToSave,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            // For new documents, oldContent remains empty or the originalContent
        }

        // Show diff modal
        setPendingSave({ doc: newDoc, oldContent });
        setShowDiffModal(true);
    }, [documentName, documentType, currentDocument, documents, originalContent, documentCategory]);

    const handleConfirmSave = useCallback(() => {
        if (!pendingSave) {
            console.error('No pending save data');
            return;
        }

        try {
            // dispatch save action
            dispatch(saveMarkdownDocument(pendingSave.doc));
            // If saving a domain, also ensure domain slice category is set
            if (pendingSave.doc.type === 'domain') {
                const cat = pendingSave.doc.domainCategory ?? (domain?.domainCategory ?? 'Organizational');
                // keep domain slice in sync
                dispatch(setDomainCategory(cat));
            }

            // Step 3: Update local state - CRITICAL: Set selectedDocument for View Mode
            console.log('4. Updating local state...');
            setSelectedDocument(pendingSave.doc);
            setDocumentName(pendingSave.doc.name);
            setDocumentType(pendingSave.doc.type || 'markdown');
            setOriginalContent(pendingSave.doc.content);
            setPreviewContent(pendingSave.doc.content);
            setCurrentDocument(pendingSave.doc.content);
            setFocusDoc({ id: pendingSave.doc.id, name: pendingSave.doc.name });
            console.log('   ✓ Local state updated - selectedDocument set to:', pendingSave.doc.name);

            // Step 4: Persist to localStorage
            // Step 5: Clear modal state
            console.log('6. Clearing modal state...');
            setShowDiffModal(false);
            setPendingSave(null);
            console.log('   ✓ Modal state cleared');

            // Step 6: Switch to view mode - selectedDocument should now be available
            console.log('7. Switching to view mode with selectedDocument:', {
                id: pendingSave.doc.id,
                name: pendingSave.doc.name
            });
            switchMode('view');
            console.log('   ✓ Switched to view mode');

            console.log('✅ Save complete! Document saved with name:', pendingSave.doc.name, 'and type:', pendingSave.doc.type);
            console.groupEnd();
        } catch (error) {
            console.error('❌ Error during save:', error);
            console.groupEnd();
        }
    }, [pendingSave, dispatch, switchMode, domain]);

    const handleCancelSave = useCallback(() => {
        setShowDiffModal(false);
        setPendingSave(null);
    }, []);

    // Allow EditModeContent to set document id (focus) from frontmatter
    const setDocumentId = useCallback((id?: string) => {
        if (!id) return;
        // dispatch to set focus doc so the rest of the app treats it as selected
        dispatch(setFocusDoc({ id, name: '' }));
    }, [dispatch]);

    // Chat mode state (shared across both General and Advanced)
    const [chatInput, setChatInput] = useState('');
    const [chatSelectedModel, setChatSelectedModel] = useState('gpt-5-mini');
    const [chatMdPreview, setChatMdPreview] = useState('');
    const [chatShowLeftPanel, setChatShowLeftPanel] = useState(true);
    const [chatShowRightPanel, setChatShowRightPanel] = useState(true);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [includeDomainContext, setIncludeDomainContext] = useState(true); // New state for domain context

    const handleTemplateSelect = useCallback((template: DocumentTemplate) => {
        const normalizedType = normalizeDocumentType(template.type);
        const nowIso = new Date().toISOString();
        const templateDoc: MarkdownDocument = {
            id: `template-${Date.now()}`,
            name: template.name,
            type: normalizedType,
            content: template.content,
            createdAt: nowIso,
            updatedAt: nowIso,
            // if the template is a domain template, carry over current UI category (optional)
            // ...(normalizedType === 'domain' ? { domainCategory: documentCategory } : {})
        };

        dispatch(saveMarkdownDocument(templateDoc));
        dispatch(setFocusDoc({ id: templateDoc.id, name: templateDoc.name }));
        // if (templateDoc.type === 'domain') {
        //     // keep live domain slice in sync
        //     dispatch(setDomainCategory((templateDoc as any).domainCategory ?? documentCategory));
        // }
        setSelectedDocument(templateDoc);
        setDocumentName(template.name);
        setDocumentType(normalizedType);
        setPreviewContent(template.content);
        setOriginalContent(template.content);
        setChatMdPreview(template.content);
        // setCurrentDocument(template.content);
        // updateProjectFromDocument(templateDoc);
        closeLibrary();
        setShowTemplateSelector(false);
    }, [
        dispatch,
        normalizeDocumentType,
        // updateProjectFromDocument,
        setSelectedDocument,
        setDocumentName,
        setDocumentType,
        setPreviewContent,
        setOriginalContent,
        setChatMdPreview,
        closeLibrary,
        setShowTemplateSelector,
        documentCategory,
    ]);

    // Handler for saving preview from chat mode
    const handleSavePreviewToLibrary = useCallback((
        content: string,
        name?: string,
        type?: string,
        options?: { forceNew?: boolean }
    ) => {
        if (!content) return;

        const timestamp = new Date().toISOString().split('T')[0];
        const baseName = name?.trim() || `AI Response ${timestamp}`;
        const documentType = type || 'ai-response';
        const forceNewDocument = options?.forceNew === true;

        const ensureUniqueName = (desiredName: string) => {
            if (!documents || documents.length === 0) return desiredName;
            if (!documents.some(doc => doc.name === desiredName)) return desiredName;
            let attempt = 2;
            let candidate = `${desiredName} (${attempt})`;
            while (documents.some(doc => doc.name === candidate)) {
                attempt += 1;
                candidate = `${desiredName} (${attempt})`;
            }
            return candidate;
        };

        const documentName = forceNewDocument ? ensureUniqueName(baseName) : baseName;

        // Check if a document with the same name already exists
        const existingDoc = !forceNewDocument
            ? documents?.find(doc => doc.name === documentName)
            : undefined;

        let newDoc: MarkdownDocument;
        let oldContent = '';

        if (existingDoc) {
            // Updating existing document - keep the same ID
            newDoc = {
                id: existingDoc.id,
                name: documentName,
                type: documentType,
                // Preserve or update domainCategory: prefer current UI selection for domain docs
                domainCategory: (documentType || '').trim().toLowerCase() === 'domain'
                    ? documentCategory
                    : existingDoc.domainCategory,
                content: content,
                createdAt: existingDoc.createdAt,
                updatedAt: new Date().toISOString()
            };
            oldContent = existingDoc.content;
        } else {
            // Creating new document
            newDoc = {
                id: `doc-${Date.now()}`,
                name: documentName,
                type: documentType,
                // Attach category for domain documents so reducer and domain slice can pick it up
                ...((documentType || '').trim().toLowerCase() === 'domain' ? { domainCategory: documentCategory } : {}),
                content: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        // Show diff modal
        setPendingSave({ doc: newDoc, oldContent });
        setShowDiffModal(true);
    }, [documents, documentCategory]); // documentCategory added to deps

    // Debug: Log chat state changes
    useEffect(() => {
        console.log('Chat input changed:', chatInput);
    }, [chatInput]);

    // Track selectedDocument changes with stack trace
    useEffect(() => {
        console.group('🔄 selectedDocument changed to:', {
            id: selectedDocument?.id,
            name: selectedDocument?.name,
            type: selectedDocument?.type
        });
        console.trace('Stack trace:');
        console.groupEnd();
    }, [selectedDocument]);

    // Compute panels directly per-mode. Left panels are delegated to the shared builder where appropriate.
    const editPanels = EditModeContent({
        documentName,
        setDocumentName,
        documentType,
        setDocumentType,
        currentDocument,
        handleSetCurrentDocument,
        isLibraryOpen,
        libraryTarget,
        openLibraryFor,
        closeLibrary,
        previewContent: currentDocument,
        setPreviewContent,
        domain,
        contextContent,
        setContextContent,
        documentCategory,
        setDocumentCategory: (c?: DomainCategory | undefined) => {
            if (c !== undefined) setDocumentCategory(c);
        },
        setDocumentId,
        onChatWithDocument: handleChatWithDocument,
        onClearDocument: handleClearCurrentDocument,
        showPreviewPanel: showEditPreviewPanel,
        onTogglePreviewPanel: () => setShowEditPreviewPanel((prev) => !prev),
    });

    const chatModalPanels = ChatModeContent({
        subMode: chatSubMode,
        domain,
        ontology,
        contextContent,
        setContextContent,
        additionalContext,
        setAdditionalContext,
        currentDocument,
        previewContent,
        isLibraryOpen,
        libraryTarget,
        openLibraryFor,
        closeLibrary,
        handleSetCurrentDocument,
        chatInput,
        setChatInput,
        chatSelectedModel,
        setChatSelectedModel,
        chatMdPreview,
        setChatMdPreview,
        chatShowLeftPanel,
        setChatShowLeftPanel,
        chatShowRightPanel,
        setChatShowRightPanel,
        chatMessages,
        setChatMessages,
        includeDomainContext,
        setIncludeDomainContext,
        documentName,
        documentType,
        onSavePreviewToLibrary: handleSavePreviewToLibrary,
        onCreateDocumentFromTemplate: handleOpenTemplateSelector,
        onSelectDocument: handleSelectDocument,
        includePreviewPanel: showAIChatInlineModal,
        includeDocumentTabs: !showAIChatInlineModal,
    });

    const panelConfigs = (() => {
        const viewPanels = ViewModeContent({
            domain,
            currentDocument,
            selectedDocument,
            onSelectDocument: handleSelectDocument,
            onEditDocument: handleEditDocument,
            onChatWithDocument: handleChatWithDocument,
            onClearCurrentDocument: handleClearCurrentDocument,
            previewContent,
            projectDocument,
            onCreateDocumentFromTemplate: handleOpenTemplateSelector,
            additionalContext,
            setAdditionalContext,
        });

        const baseMode = mode === 'edit' ? (showAIChatInlineModal ? 'chat' : 'view') : mode;

        if (baseMode === 'view') return viewPanels;

        if (baseMode === 'chat') {
            const chatLeftPanel = buildLeftPanelTabs({
                domain,
                projectDocument,
                currentDocument,
                onSelectDocument: handleSelectDocument,
                onCreateDocumentFromTemplate: handleOpenTemplateSelector,
                includeLibrary: false,
                includeAdditional: true,
                additionalContext,
                setAdditionalContext,
                onSetCurrentDocument: handleSetCurrentDocument,
            });

            return { ...chatModalPanels, leftPanelContent: chatLeftPanel };
        }

        return viewPanels;
    })();

    // Helper to safely extract renderable content from a PanelGroup or plain JSX
    const getPanelContent = (panel: any) => {
        if (!panel) return null;
        if (typeof panel === 'object' && 'tabs' in panel) {
            // prefer defaultTab if present, otherwise first tab
            const key = panel.defaultTab || panel.tabs?.[0]?.key;
            const found = panel.tabs?.find((t: any) => t.key === key) || panel.tabs?.[0];
            return found ? found.content : null;
        }
        return panel;
    };

    const renderPanelTabs = (panel: any) => {
        if (!panel || typeof panel !== 'object' || !Array.isArray(panel.tabs)) return panel;
        const defaultValue = panel.defaultTab || panel.tabs[0]?.key;
        return (
            <Tabs defaultValue={defaultValue} className="flex flex-col h-full">
                <TabsList
                    className="grid w-full pt-0"
                    style={{ gridTemplateColumns: `repeat(${panel.tabs.length}, minmax(0, 1fr))` }}
                >
                    {panel.tabs.map((tab: any) => (
                        <TabsTrigger key={tab.key} value={tab.key} className="text-[12px] py-1">
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className="flex-1 min-h-0 overflow-hidden">
                    {panel.tabs.map((tab: any) => (
                        <TabsContent key={tab.key} value={tab.key} className="h-full">
                            {tab.content}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        );
    };

    // Precompute panel prop values to avoid large inline ternaries in JSX (prevents parser/hydration errors).
    const leftPanelProp = (() => {
        const lp = panelConfigs.leftPanelContent;
        if (lp && typeof lp === 'object' && 'tabs' in lp) return lp as any;
        return { tabs: [{ key: 'domain', label: 'Domain', content: lp as React.ReactElement }], defaultTab: 'domain' };
    })();

    const middlePanelProp = (() => {
        const mp = panelConfigs.middlePanelContent;

        // If panel is a tabs object, remove any 'chat' tab so the AI Chat tab is moved into the modal
        if (mp && typeof mp === 'object' && 'tabs' in mp) {
            const filteredTabs = (mp.tabs || []).filter((t: any) => t.key !== 'chat');
            // Use defaultTab only if it exists on mp, otherwise fallback to first filtered tab's key
            const defaultTab = (mp as any).defaultTab ?? (filteredTabs.length > 0 ? filteredTabs[0]?.key : undefined);
            return { ...mp, tabs: filteredTabs, defaultTab } as any;
        }

        // Default: provide a single placeholder tab (no chat)
        return { tabs: [{ key: 'main', label: 'Main', content: mp as React.ReactElement }], defaultTab: 'main' };
    })();

    const rightPanelProp = (() => {
        const rp = panelConfigs.rightPanelContent;
        if (rp && typeof rp === 'object' && 'tabs' in rp) return rp as any;
        return { tabs: [{ key: 'preview', label: 'Preview', content: rp as React.ReactElement }], defaultTab: 'preview' };
    })();

    const modeConfig = MODE_CONFIGS[mode];
    const containerClassName = modeConfig.showBorder
        ? `flex flex-col h-screen max-h-screen overflow-hidden border-[16px] ${modeConfig.borderColor} rounded-lg shadow-xl`
        : 'flex flex-col h-screen max-h-screen overflow-hidden';

    // Debug: Log what we're passing to ThreePanelLayout
    const modeHeaderComponent = (
        <ModeHeader
            mode={mode}
            chatSubMode={chatSubMode}
            onModeChange={switchMode}
            onChatSubModeChange={switchChatSubMode}
            showFileOperations={true}
            onOpenAIChat={() => {
                if (mode !== 'view') {
                    switchMode('view');
                }
                setShowChatPreviewPanel(true);
                setShowAIChatInlineModal(true);
                return true;
            }}
            aiChatOpen={showAIChatInlineModal}
            onCloseAIChat={() => {
                setShowChatPreviewPanel(true);
                setShowAIChatInlineModal(false);
            }}
        />
    );

    return (
        <div className={containerClassName}>
            {/* {showFileOperations && ( */}
            <div className="mb-2 pb-2 border-b border-gray-700">
                <FileOperations />
            </div>
            {/* )} */}
            <div className="flex-1 overflow-hidden bg-gray-900/60">
                <ThreePanelLayout
                    leftPanelContent={leftPanelProp}
                    middlePanelContent={middlePanelProp}
                    rightPanelContent={rightPanelProp}
                    showLeftPanel={showLeftPanel}
                    setShowLeftPanel={setShowLeftPanel}
                    showRightPanel={showRightPanel}
                    setShowRightPanel={setShowRightPanel}
                    className="h-full min-w-0 bg-background text-gray-100"
                    middlePanelHeader={modeHeaderComponent}
                >
                    {/* Render middle panel if it's plain JSX */}
                    {panelConfigs.middlePanelContent && !(typeof panelConfigs.middlePanelContent === 'object' && 'tabs' in panelConfigs.middlePanelContent)
                        ? <div className="h-full">{panelConfigs.middlePanelContent}</div>
                        : null}
                    {/* Inline AI Chat modal: positioned inside middle panel and anchored to right edge */}
                    {showAIChatInlineModal && mode === 'view' && (
                        <div
                            className="fixed top-[calc(var(--header-height,56px)+0.5rem)] right-4 z-50"
                            style={{ width: 'min(840px,96vw)', maxHeight: 'calc(100vh - var(--header-height,56px) - 1rem)' }}
                        >
                            {/* Reuse ModalThreePanelLayout inline rendering - full height */}
                            <div
                                className="bg-popover rounded-md shadow-lg overflow-hidden flex flex-col border-2 border-orange-400/70"
                                style={{ height: '100%', maxHeight: 'calc(100vh - var(--header-height,56px) - 1rem)' }}
                            >
                                {/* header / title / close row */}
                                <div className="flex items-center justify-between gap-2 px-2 border-b border-gray-700 flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-orange-400 ms-2">AI Chat</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowChatPreviewPanel((prev) => !prev)}
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors"
                                        >
                                            {showChatPreviewPanel ? (
                                                <>
                                                    <EyeOff className="h-3.5 w-3.5" />
                                                    Hide Preview
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Show Preview
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowChatPreviewPanel(true);
                                                setShowAIChatInlineModal(false);
                                            }}
                                            className="text-gray-400 hover:text-white p-1"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                                {/* content area - fill remaining height; let the chat component itself handle scrolling for messages */}
                                <div className="p- flex-1 overflow-hidden min-h-0">
                                    <div className="h-full min-h-0 flex overflow-hidden bg-background">
                                        <div className="flex-1 min-w-0 h-full overflow-hidden">
                                            {getPanelContent(chatModalPanels.middlePanelContent)}
                                        </div>
                                        {showChatPreviewPanel && chatModalPanels.rightPanelContent && (
                                            <div className="w-[30%] min-w-[220px] h-full overflow-auto bg-gray-900/70 border-l border-gray-700">
                                                {renderPanelTabs(chatModalPanels.rightPanelContent)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {mode === 'edit' && (
                        <div
                            className="fixed top-[calc(var(--header-height,56px)+0.5rem)] right-4 z-50"
                            style={{ width: 'min(840px,96vw)', maxHeight: 'calc(100vh - var(--header-height,56px) - 1rem)' }}
                        >
                            <div
                                className="bg-popover rounded-md shadow-lg overflow-hidden flex flex-col border-2 border-orange-400/70"
                                style={{ height: '100%', maxHeight: 'calc(100vh - var(--header-height,56px) - 1rem)' }}
                            >
                                <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-700 flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-orange-400 ms-2">
                                        Edit Document: <span className="text-white">{documentName || 'Untitled Document'}</span>
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveToLibrary}
                                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                                        >
                                            Save to Library
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowEditPreviewPanel(true);
                                                switchMode('view');
                                            }}
                                            className="text-gray-400 hover:text-white p-1"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                                <div className="p-0 flex-1 overflow-hidden min-h-0">
                                    <div className="h-full min-h-0 flex overflow-hidden bg-background">
                                        <div className="flex-1 min-w-0 h-full overflow-hidden">
                                            {editPanels.middlePanel}
                                        </div>
                                        {showEditPreviewPanel && (
                                            <div className="w-[30%] min-w-[220px] h-full overflow-auto bg-gray-900/70 border-l border-gray-700">
                                                {editPanels.rightPanel}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </ThreePanelLayout>
            </div>

            <DiffModal
                isOpen={showDiffModal}
                onClose={handleCancelSave}
                onConfirm={handleConfirmSave}
                oldContent={pendingSave?.oldContent || ''}
                newContent={pendingSave?.doc.content || ''}
                title="Save Changes to Library"
            />

            {isLibraryOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeLibrary}>
                    <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeLibrary} className="absolute right-4 top-4 text-gray-400 hover:text-white" aria-label="Close library">
                            <X className="h-6 w-6" />
                        </button>
                        <div className="p-6">
                            <MarkdownLibrary
                                onSelect={handleLibrarySelect}
                                hideExportLibraryButton={false}
                                onSetCurrentDocument={(content, name, doc) => {
                                    if (doc) handleSelectDocument(doc);
                                    else handleSetCurrentDocument(content);
                                }}
                                onSetAdditionalContext={setAdditionalContext}
                                currentDocument={currentDocument}
                                onCreateFromTemplate={handleOpenTemplateSelector}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showTemplateSelector && (
                <DocumentTemplateSelector
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}
        </div>
    );
};

export default AIChatPage;
