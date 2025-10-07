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
    onSavePreviewToLibrary?: (content: string, name?: string, type?: string) => void;
}

export function ChatModeContent(params: ChatModeContentParams) {
    console.log('📝 ChatModeContent called with:', {
        hasDocumentName: !!params.documentName,
        documentName: params.documentName,
        documentType: params.documentType,
        subMode: params.subMode
    });

    // Get panels based on sub-mode - no tabs, just the content
    if (params.subMode === 'general') {
        return GeneralChatPanels({
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
        });
    }

    // Advanced mode
    return AdvancedChatPanels({
        domain: params.domain,
        ontology: params.ontology,
        contextContent: params.contextContent,
        setContextContent: params.setContextContent,
        additionalContext: params.additionalContext ?? '',
        setAdditionalContext: params.setAdditionalContext ?? (() => { }),
        currentDocument: params.currentDocument,
        isLibraryOpen: params.isLibraryOpen,
        libraryTarget: params.libraryTarget,
        openLibraryFor: params.openLibraryFor,
        closeLibrary: params.closeLibrary,
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
    });
}
