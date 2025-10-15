'use client';

import { GeneralChatPanels } from './GeneralChatPanels';
import { AdvancedChatPanels } from './AdvancedChatPanels';
import type { ChatSubMode } from '@/types/aiChatModes';
import type { DomainData } from '@/features/model-universe/modelSlice';

interface ChatModeContentParams {
    subMode: 'general' | 'advanced';
    domain: DomainData | null;
    ontology: any; // Add ontology prop
    contextContent: string;
    setContextContent: (content: string) => void;
    additionalContext?: string;
    setAdditionalContext?: (content: string) => void;
    currentDocument: string;
    previewContent?: string;
    isLibraryOpen: boolean;
    libraryTarget: 'context' | 'document' | null;
    openLibraryFor: (target: 'context' | 'document') => void;
    closeLibrary: () => void;
    handleSetCurrentDocument?: (content: string) => void;
    chatInput: string;
    setChatInput: (input: string) => void;
    chatSelectedModel: string;
    setChatSelectedModel: (model: string) => void;
    chatMdPreview: string;
    setChatMdPreview: (preview: string) => void;
    chatShowLeftPanel: boolean;
    setChatShowLeftPanel: (show: boolean) => void;
    chatShowRightPanel: boolean;
    setChatShowRightPanel: (show: boolean) => void;
    chatMessages: any[];
    setChatMessages: (messages: any[]) => void;
    includeDomainContext: boolean;
    setIncludeDomainContext: (include: boolean) => void;
    documentName?: string;
    documentType?: string;
    onSavePreviewToLibrary?: (content: string, name?: string, type?: string, options?: { forceNew?: boolean }) => void;
    onCreateDocumentFromTemplate?: () => void;
    projectDocument?: MarkdownDocument | null;
}

export function ChatModeContent(params: ChatModeContentParams) {
    // Get panels for both sub-modes
    const generalPanels = GeneralChatPanels({
        domain: params.domain,
        contextContent: params.contextContent,
        setContextContent: params.setContextContent,
        currentDocument: params.currentDocument,
        previewContent: params.previewContent ?? '',
        isLibraryOpen: params.isLibraryOpen,
        libraryTarget: params.libraryTarget,
        openLibraryFor: params.openLibraryFor,
        closeLibrary: params.closeLibrary,
        handleSetCurrentDocument: params.handleSetCurrentDocument ?? (() => { }),
        chatInput: params.chatInput,
        setChatInput: params.setChatInput,
        chatSelectedModel: params.chatSelectedModel,
        setChatSelectedModel: params.setChatSelectedModel,
        chatMdPreview: params.chatMdPreview,
        setChatMdPreview: params.setChatMdPreview,
        chatShowLeftPanel: params.chatShowLeftPanel,
        setChatShowLeftPanel: params.setChatShowLeftPanel,
        chatShowRightPanel: params.chatShowRightPanel,
        setChatShowRightPanel: params.setChatShowRightPanel,
        chatMessages: params.chatMessages,
        setChatMessages: params.setChatMessages,
        includeDomainContext: params.includeDomainContext,
        setIncludeDomainContext: params.setIncludeDomainContext,
        documentName: params.documentName,
        documentType: params.documentType,
        onSavePreviewToLibrary: params.onSavePreviewToLibrary,
        onCreateDocumentFromTemplate: params.onCreateDocumentFromTemplate,
        projectDocument: params.projectDocument,
    });

    // const advancedPanels = AdvancedChatPanels({
    //     domain: params.domain,
    //     contextContent: params.contextContent,
    //     setContextContent: params.setContextContent,
    //     additionalContext: params.additionalContext ?? '',
    //     setAdditionalContext: params.setAdditionalContext ?? (() => { }),
    //     currentDocument: params.currentDocument,
    //     isLibraryOpen: params.isLibraryOpen,
    //     libraryTarget: params.libraryTarget,
    //     openLibraryFor: params.openLibraryFor,
    //     closeLibrary: params.closeLibrary,
    //     chatInput: params.chatInput,
    //     setChatInput: params.setChatInput,
    //     chatSelectedModel: params.chatSelectedModel,
    //     setChatSelectedModel: params.setChatSelectedModel,
    //     chatMdPreview: params.chatMdPreview,
    //     setChatMdPreview: params.setChatMdPreview,
    //     chatShowLeftPanel: params.chatShowLeftPanel,
    //     setChatShowLeftPanel: params.setChatShowLeftPanel,
    //     chatShowRightPanel: params.chatShowRightPanel,
    //     setChatShowRightPanel: params.setChatShowRightPanel,
    //     chatMessages: params.chatMessages,
    //     setChatMessages: params.setChatMessages,
    //     includeDomainContext: params.includeDomainContext,
    //     setIncludeDomainContext: params.setIncludeDomainContext,
    //     documentName: params.documentName,
    //     documentType: params.documentType,
    //     onSavePreviewToLibrary: params.onSavePreviewToLibrary,
    //     onCreateDocumentFromTemplate: params.onCreateDocumentFromTemplate,
    // });

    // Return combined structure with tabs for both sub-modes
    return {
        leftPanelContent: params.subMode === 'general'
            ? generalPanels.leftPanelContent
            : null, //advancedPanels.leftPanelContent,

        middlePanelContent: {
            tabs: params.subMode === 'general'
                ? generalPanels.middlePanelContent.tabs
                : null, //advancedPanels.middlePanelContent.tabs,
        },

        rightPanelContent: params.subMode === 'general'
            ? generalPanels.rightPanelContent
            : null, //advancedPanels.rightPanelContent,
    };
}
