'use client';

import { GeneralChatPanels } from './GeneralChatPanels';
import { AdvancedChatPanels } from './AdvancedChatPanels';
import type { ChatSubMode } from '@/types/aiChatModes';
import type { DomainData } from '@/features/model-universe/modelSlice';

interface ChatModeContentProps {
  subMode: ChatSubMode;
  domain: DomainData | null;
  contextContent: string;
  setContextContent: (content: string) => void;
  additionalContext: string;
  setAdditionalContext: (content: string) => void;
  currentDocument: string;
  previewContent: string;
  isLibraryOpen: boolean;
  libraryTarget: 'context' | 'document' | null;
  openLibraryFor: (target: 'context' | 'document') => void;
  closeLibrary: () => void;
  handleSetCurrentDocument: (content: string) => void;
}

export function ChatModeContent({
  subMode,
  domain,
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
}: ChatModeContentProps) {
  if (subMode === 'general') {
    return GeneralChatPanels({
      domain,
      contextContent,
      setContextContent,
      currentDocument,
      previewContent,
      isLibraryOpen,
      libraryTarget,
      openLibraryFor,
      closeLibrary,
      handleSetCurrentDocument,
    });
  }

  return AdvancedChatPanels({
    domain,
    contextContent,
    setContextContent,
    additionalContext,
    setAdditionalContext,
    currentDocument,
    isLibraryOpen,
    libraryTarget,
    openLibraryFor,
    closeLibrary,
  });
}
