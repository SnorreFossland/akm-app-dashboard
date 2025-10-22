'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';

import { RootState } from '@/store';
import { FileOperations } from '@/components/FileOperations';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
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

const AIChatPage = () => {
    const dispatch = useDispatch();
    const { mode, chatSubMode, switchMode, switchChatSubMode } = useAIChatMode();

    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);
    const documents = useSelector((state: RootState) => state.modelUniverse?.phData?.documents);
    const focusDoc = useSelector((state: RootState) => state.modelUniverse?.phFocus?.focusDoc);
    const focusProject = useSelector((state: RootState) => state.modelUniverse?.phFocus?.focusProj);
    const [projectDocument, setProjectDocument] = useState<MarkdownDocument | null>(null);
    const ontology = useSelector((state: RootState) => state.modelUniverse?.phData?.domain.ontology);

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
    const [showRightPanel, setShowRightPanel] = useState(true);

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
                dispatch(setFocusDoc({ id: doc.id , name: doc.name }));
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
    const panelConfigs = (() => {
        // Use shared builder for the edit-mode left panel (Domain, Project Plan, Context)
        const editLeftPanel = buildLeftPanelTabs({
            domain,
            projectDocument,
            currentDocument,
            onSelectDocument: handleSelectDocument,
            onCreateDocumentFromTemplate: handleOpenTemplateSelector,
            includeLibrary: false,
            includeContext: true, // show Context Docs (DocumentPanel)
            contextContent,
            setContextContent,
            isLibraryOpen,
            libraryTarget,
            openLibraryFor,
            closeLibrary,
            onSetCurrentDocument: handleSetCurrentDocument,
        });

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
        });

        if (mode === 'view') return viewPanels;

        if (mode === 'chat') {
            const chatPanels = ChatModeContent({
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
            });

            const chatLeftPanel = buildLeftPanelTabs({
                domain,
                projectDocument,
                currentDocument,
                onSelectDocument: handleSelectDocument,
                onCreateDocumentFromTemplate: handleOpenTemplateSelector,
                includeLibrary: true,
                includeAdditional: true,
                additionalContext,
                setAdditionalContext,
                onSetCurrentDocument: handleSetCurrentDocument,
            });

            return { ...chatPanels, leftPanelContent: chatLeftPanel };
        }

        if (mode === 'edit') {
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
                onSaveToLibrary: handleSaveToLibrary,
                // pass the category state so the editor UI can display/edit it
                documentCategory,
                setDocumentCategory: (c?: DomainCategory | undefined) => {
                    if (c !== undefined) setDocumentCategory(c);
                },
            });

            return {
                leftPanelContent: viewPanels?.leftPanelContent || editLeftPanel,
                middlePanelContent: editPanels.middlePanel,
                rightPanelContent: editPanels.rightPanel,
            };
        }

        return {
            leftPanelContent: editLeftPanel,
            middlePanelContent: <div>Unknown mode</div>,
            rightPanelContent: <div>Unknown mode</div>,
        };
    })();

    // Precompute panel prop values to avoid large inline ternaries in JSX (prevents parser/hydration errors).
    const leftPanelProp = (() => {
        const lp = panelConfigs.leftPanelContent;
        if (lp && typeof lp === 'object' && 'tabs' in lp) return lp as any;
        return { tabs: [{ key: 'domain', label: 'Domain', content: lp as React.ReactElement }], defaultTab: 'domain' };
    })();

    const middlePanelProp = (() => {
        const mp = panelConfigs.middlePanelContent;
        if (mp && typeof mp === 'object' && 'tabs' in mp) return mp as any;
        return { tabs: [{ key: 'chat', label: 'AI Chat', content: mp as React.ReactElement }], defaultTab: 'chat' };
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
