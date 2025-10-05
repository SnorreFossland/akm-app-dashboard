export type AIChatMode = 'view' | 'chat' | 'edit';
export type ChatSubMode = 'general' | 'advanced';

export interface AIChatModeState {
    mode: AIChatMode;
    chatSubMode: ChatSubMode;
    previousMode: AIChatMode | null;
}

export interface ModeConfig {
    title: string;
    description?: string;
    showBorder?: boolean;
    borderColor?: string;
}

export const MODE_CONFIGS: Record<AIChatMode, ModeConfig> = {
    view: {
        title: 'Document Viewer',
        description: 'Browse and manage documents',
    },
    chat: {
        title: 'AI Chat',
        description: 'Chat with AI using document context',
    },
    edit: {
        title: 'Document Editor',
        description: 'Focused edit session',
        showBorder: true,
        borderColor: 'border-orange-800/80',
    },
};
