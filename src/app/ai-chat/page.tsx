'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';

import { RootState } from '@/store';
import { FileOperations } from '@/components/FileOperations';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { ModeHeader } from '@/components/ai-chat/ModeHeader';
import { ViewModeContent } from '@/components/ai-chat/modes/ViewModeContent';
import { ChatModeContent } from '@/components/ai-chat/modes/ChatModeContent';
import { EditModeContent } from '@/components/ai-chat/modes/EditModeContent';
import { setCurrentDocument, MarkdownDocument, saveMarkdownDocument, updateProjectInfo } from '@/features/model-universe/modelSlice';
import DocumentTemplateSelector, { DocumentTemplate } from '@/components/ai-chat/DocumentTemplateSelector';
import { useAIChatMode } from '@/hooks/useAIChatMode';
import { MODE_CONFIGS } from '@/types/aiChatModes';
import DiffModal from '@/components/ai-chat/DiffModal';

const AIChatPage = () => {
    const dispatch = useDispatch();
    const { mode, chatSubMode, switchMode, switchChatSubMode } = useAIChatMode();

    const domain = useSelector((state: RootState) => state.modelUniverse?.phData?.domain);
    const documents = useSelector((state: RootState) => state.modelUniverse?.phData?.documents);
    const currentDocument = useSelector((state: RootState) => state.modelUniverse.phData.currentDocument);
    const focusProject = useSelector((state: RootState) => state.modelUniverse?.phFocus?.focusProj);
    const [projectDocument, setProjectDocument] = useState<MarkdownDocument | null>(null);
    const ontology = useSelector((state: RootState) => state.modelUniverse?.phData?.domain.ontology);

    // Shared state across all modes
    const [contextContent, setContextContent] = useState('');
    const [additionalContext, setAdditionalContext] = useState('');
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // View mode state
    const [selectedDocument, setSelectedDocument] = useState<MarkdownDocument | undefined>();

    // Add useEffect to sync projectDocument with focusProject
    useEffect(() => {
        if (focusProject) {
            const matchingDoc = documents?.find(doc => doc.id === focusProject.id);
            setProjectDocument(matchingDoc || null);
        } else {
            setProjectDocument(null);
        }
    }, [focusProject, documents]);

    // Edit mode state
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('markdown');
    const [previewContent, setPreviewContent] = useState('');
    const [originalContent, setOriginalContent] = useState(''); // Add this to track original content

    // Library modal state
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState<'context' | 'document' | null>(null);

    // Panel visibility state
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);

    // Diff modal state
    const [showDiffModal, setShowDiffModal] = useState(false);
    const [pendingSave, setPendingSave] = useState<{
        doc: MarkdownDocument;
        oldContent: string;
    } | null>(null);

    const previousDocumentRef = useRef('');

    // Initialize from localStorage - ONLY RUN ONCE ON MOUNT
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storedContext = localStorage.getItem('aiChat_context');
        const storedAdditionalContext = localStorage.getItem('aiChat_additionalContext');
        const storedDocument = localStorage.getItem('currentDocument');

        if (storedContext) setContextContent(storedContext);
        if (storedAdditionalContext) setAdditionalContext(storedAdditionalContext);

        if (storedDocument) {
            dispatch(setCurrentDocument(storedDocument));
            setPreviewContent(storedDocument);
            previousDocumentRef.current = storedDocument;

            // Try to find matching document for edit mode
            // Only do this on initial mount, not when documents change
            const matchingDoc = documents?.find(doc => doc.content === storedDocument);
            if (matchingDoc) {
                setDocumentName(matchingDoc.name);
                setDocumentType(matchingDoc.type || 'markdown');
                setSelectedDocument(matchingDoc);
            }
        }
    }, [dispatch]); // <-- Removed 'documents' from dependencies

    useEffect(() => {
        if (focusProject) {
            const matchingDoc = documents?.find(doc => doc.id === focusProject.id);
            setProjectDocument(matchingDoc || null);
        } else {
            setProjectDocument(null);
        }
    }, [focusProject, documents]);

    // Persist context to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('aiChat_context', contextContent);
    }, [contextContent]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('aiChat_additionalContext', additionalContext);
    }, [additionalContext]);

    // Persist current document changes
    useEffect(() => {
        const oldValue = previousDocumentRef.current;
        if (oldValue === currentDocument) return;

        previousDocumentRef.current = currentDocument;

        if (typeof window !== 'undefined') {
            localStorage.setItem('currentDocument', currentDocument);
            window.dispatchEvent(new CustomEvent('localStorageChange', {
                detail: { key: 'currentDocument', newValue: currentDocument, oldValue },
            }));
        }
    }, [currentDocument]);

    const handleSetCurrentDocument = useCallback((content: string) => {
        dispatch(setCurrentDocument(content));
    }, [dispatch]);

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
            dispatch(setCurrentDocument(content));
            if (doc) {
                setSelectedDocument(doc);
                setDocumentName(doc.name);
                setDocumentType(doc.type || 'markdown');
            }
        }
        closeLibrary();
    }, [closeLibrary, libraryTarget, dispatch]);

    // View mode handlers
    const handleSelectDocument = useCallback((doc: MarkdownDocument) => {
        setSelectedDocument(doc);
        dispatch(setCurrentDocument(doc.content));
        setDocumentName(doc.name);
        setDocumentType(doc.type || 'markdown');
        setOriginalContent(doc.content); // Store original content when selecting
    }, [dispatch]);

    const handleEditDocument = useCallback(() => {
        if (selectedDocument) {
            setDocumentName(selectedDocument.name);
            setDocumentType(selectedDocument.type || 'markdown');
            setPreviewContent(selectedDocument.content);
            dispatch(setCurrentDocument(selectedDocument.content)); // Ensure currentDocument is set
            setOriginalContent(selectedDocument.content); // Store original content when entering edit mode
        }
        switchMode('edit');
    }, [selectedDocument, switchMode, dispatch]);

    const handleChatWithDocument = useCallback(() => {
        if (selectedDocument) {
            setContextContent(selectedDocument.content);
        }
        switchMode('chat');
    }, [selectedDocument, switchMode]);

    const handleDeleteDocument = useCallback(() => {
        if (!selectedDocument) return;

        const confirmed = window.confirm(`Delete "${selectedDocument.name}"?`);
        if (confirmed) {
            // TODO: Implement delete in Redux
            console.log('Delete document:', selectedDocument.id);
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
                content: contentToSave,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            // For new documents, oldContent remains empty or the originalContent
        }

        // Show diff modal
        setPendingSave({ doc: newDoc, oldContent });
        setShowDiffModal(true);
    }, [documentName, documentType, currentDocument, documents, originalContent]);

    const handleConfirmSave = useCallback(() => {
        if (!pendingSave) {
            console.error('No pending save data');
            return;
        }

        console.group('💾 Save Confirmation Flow');
        console.log('1. Pending save document:', {
            id: pendingSave.doc.id,
            name: pendingSave.doc.name,
            type: pendingSave.doc.type,
            contentLength: pendingSave.doc.content.length,
        });

        try {
            // Step 1: Save to library
            console.log('2. Dispatching saveMarkdownDocument with:', {
                name: pendingSave.doc.name,
                type: pendingSave.doc.type,
            });
            dispatch(saveMarkdownDocument(pendingSave.doc));
            console.log('   ✓ saveMarkdownDocument dispatched');

            // Step 2: Set as current document
            console.log('3. Dispatching setCurrentDocument...');
            dispatch(setCurrentDocument(pendingSave.doc.content));
            console.log('   ✓ setCurrentDocument dispatched');

            // Step 3: Update local state - CRITICAL: Set selectedDocument for View Mode
            console.log('4. Updating local state...');
            setSelectedDocument(pendingSave.doc);
            setDocumentName(pendingSave.doc.name);
            setDocumentType(pendingSave.doc.type || 'markdown');
            setOriginalContent(pendingSave.doc.content);
            setPreviewContent(pendingSave.doc.content);
            console.log('   ✓ Local state updated - selectedDocument set to:', pendingSave.doc.name);

            // Step 4: Persist to localStorage
            console.log('5. Persisting to localStorage...');
            if (typeof window !== 'undefined') {
                const previousValue = localStorage.getItem('currentDocument');
                localStorage.setItem('currentDocument', pendingSave.doc.content);
                window.dispatchEvent(new CustomEvent('localStorageChange', {
                    detail: {
                        key: 'currentDocument',
                        newValue: pendingSave.doc.content,
                        oldValue: previousValue,
                    }
                }));
                console.log('   ✓ localStorage updated');
            }

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
    }, [pendingSave, dispatch, switchMode]);

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
        };

        dispatch(saveMarkdownDocument(templateDoc));
        dispatch(setCurrentDocument(template.content));

        setSelectedDocument(templateDoc);
        setDocumentName(template.name);
        setDocumentType(normalizedType);
        setPreviewContent(template.content);
        setOriginalContent(template.content);
        setChatMdPreview(template.content);

        updateProjectFromDocument(templateDoc);
        closeLibrary();
        setShowTemplateSelector(false);
    }, [
        dispatch,
        normalizeDocumentType,
        updateProjectFromDocument,
        setSelectedDocument,
        setDocumentName,
        setDocumentType,
        setPreviewContent,
        setOriginalContent,
        setChatMdPreview,
        closeLibrary,
        setShowTemplateSelector,
    ]);

    // Handler for saving preview from chat mode
    const handleSavePreviewToLibrary = useCallback((
        content: string,
        name?: string,
        type?: string,
        options?: { forceNew?: boolean }
    ) => {
        if (!content) return;

        console.log('💾 Saving preview to library:', {
            name,
            type,
            contentLength: content.length,
            forceNew: options?.forceNew ?? false
        });

        const timestamp = new Date().toISOString().split('T')[0];
        const baseName = name?.trim() || `AI Response ${timestamp}`;
        const documentType = type || 'ai-response';
        const forceNewDocument = options?.forceNew === true;

        const ensureUniqueName = (desiredName: string) => {
            if (!documents || documents.length === 0) return desiredName;

            if (!documents.some(doc => doc.name === desiredName)) {
                return desiredName;
            }

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
            console.log('📝 Updating existing document:', existingDoc.name);
            newDoc = {
                id: existingDoc.id,
                name: documentName,
                type: documentType,
                content: content,
                createdAt: existingDoc.createdAt,
                updatedAt: new Date().toISOString()
            };
            oldContent = existingDoc.content;
        } else {
            // Creating new document
            console.log('✨ Creating new document:', documentName);
            newDoc = {
                id: `doc-${Date.now()}`,
                name: documentName,
                type: documentType,
                content: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        // Show diff modal
        setPendingSave({ doc: newDoc, oldContent });
        setShowDiffModal(true);
    }, [documents]);

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

    // Get panel configurations based on current mode
    const panelConfigs = useMemo(() => {
        // Shared left panel for edit mode
        const editLeftPanel = {
            tabs: [
                {
                    key: 'domain',
                    label: 'Domain',
                    content: (
                        <div className="h-full overflow-auto px-2 py-2">
                            {domain?.presentation ? (
                                <MarkdownPreview mdPreview={domain.presentation} variant="compact" />
                            ) : (
                                <div className="text-sm text-gray-400">No domain presentation available.</div>
                            )}
                        </div>
                    ),
                },
                {
                    key: 'projects',
                    label: 'Focus Project',
                    content: (
                        <div className="h-full flex flex-col overflow-hidden">
                            {projectDocument ? (
                                <>
                                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                                        <h3 className="text-base font-semibold text-gray-200 truncate">
                                            {documentName || 'Untitled Document'}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {documentType || 'Markdown'}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-auto px-4 py-4">
                                        {projectDocument.content ? (
                                            <MarkdownPreview mdPreview={projectDocument.content} variant="compact" />
                                        ) : (
                                            <div className="text-sm text-gray-400">Loading content...</div>
                                        )}
                                    </div>
                                </>
                            ) : focusProject ? (
                                <div className="h-full flex items-center justify-center px-4 py-4">
                                    <div className="text-center text-gray-400">
                                        <p className="text-sm">Project not found in library</p>
                                        <p className="text-xs mt-2">ID: {focusProject.id}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center px-4 py-4">
                                    <div className="text-center text-gray-400">
                                        <p className="text-sm">No focus project set</p>
                                        <p className="text-xs mt-2">Click "Focus" on a project in the Library to set it</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ),
                },
                {
                    key: 'context',
                    label: 'Context Docs',
                    content: (
                        <DocumentPanel
                            mdContent={contextContent}
                            setMdContent={setContextContent}
                            setIsLibraryOpen={(open) => {
                                if (open) openLibraryFor('context');
                                else closeLibrary();
                            }}
                            isLibraryOpen={isLibraryOpen && libraryTarget === 'context'}
                            panelType="left"
                        />
                    ),
                },
            ],
            defaultTab: projectDocument ? 'projects' : (domain?.presentation ? 'domain' : 'context'),
        };

        switch (mode) {
            case 'view':
                console.log('🔍 Rendering View Mode with:', {
                    hasCurrentDocument: !!currentDocument,
                    hasSelectedDocument: !!selectedDocument,
                    selectedDocName: selectedDocument?.name,
                    currentDocLength: currentDocument?.length
                });
                return ViewModeContent({
                    domain,
                    currentDocument,
                    selectedDocument,
                    onSelectDocument: handleSelectDocument,
                    onEditDocument: handleEditDocument,
                    onChatWithDocument: handleChatWithDocument,
                    onDeleteDocument: handleDeleteDocument,
                    previewContent,
                    projectDocument,
                    onCreateDocumentFromTemplate: handleOpenTemplateSelector,
                });

            case 'chat':
                console.log('💬 Rendering Chat Mode with:', {
                    documentName,
                    documentType,
                    subMode: chatSubMode
                });
                return ChatModeContent({
                    subMode: chatSubMode,
                    domain,
                    ontology, // Pass ontology as prop
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
                    // Pass chat state
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

            case 'edit':
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
                    previewContent: currentDocument, // Pass currentDocument for live preview
                    setPreviewContent,
                    onSaveToLibrary: handleSaveToLibrary,
                });

                return {
                    leftPanelContent: editLeftPanel,
                    middlePanelContent: editPanels.middlePanel,
                    rightPanelContent: editPanels.rightPanel,
                };

            default:
                return {
                    leftPanelContent: editLeftPanel,
                    middlePanelContent: <div>Unknown mode</div>,
                    rightPanelContent: <div>Unknown mode</div>,
                };
        }
    }, [
        mode,
        chatSubMode,
        domain,
        currentDocument,
        selectedDocument,
        contextContent,
        additionalContext,
        previewContent,
        documentName,
        documentType,
        isLibraryOpen,
        libraryTarget,
        focusProject,
        projectDocument, // Add projectDocument to dependencies
        handleSelectDocument,
        handleEditDocument,
        handleChatWithDocument,
        handleDeleteDocument,
        handleSetCurrentDocument,
        handleSaveToLibrary,
        openLibraryFor,
        closeLibrary,
        // Add chat state to dependencies
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
        handleSavePreviewToLibrary, // Add to dependencies
        handleOpenTemplateSelector,
    ]);

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
                    leftPanelContent={
                        panelConfigs.leftPanelContent && typeof panelConfigs.leftPanelContent === 'object' && 'tabs' in panelConfigs.leftPanelContent
                            ? panelConfigs.leftPanelContent
                            : { tabs: [{ key: 'domain', label: 'Domain', content: panelConfigs.leftPanelContent as React.ReactElement }], defaultTab: 'domain' }
                    }
                    middlePanelContent={
                        panelConfigs.middlePanelContent && typeof panelConfigs.middlePanelContent === 'object' && 'tabs' in panelConfigs.middlePanelContent
                            ? panelConfigs.middlePanelContent
                            : undefined
                    }
                    rightPanelContent={
                        (panelConfigs.rightPanelContent && 'tabs' in panelConfigs.rightPanelContent)
                            ? panelConfigs.rightPanelContent
                            : { tabs: [{ key: 'preview', label: 'Preview', content: panelConfigs.rightPanelContent as React.ReactElement }], defaultTab: 'preview' }
                    }
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
