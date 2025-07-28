import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

interface ChatState {
    currentMessages: Message[];
    conversations: Conversation[];
    activeConversationId: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ChatState = {
    currentMessages: [],
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Message management
        addMessage: (state, action: PayloadAction<Message>) => {
            const messageWithTimestamp = {
                ...action.payload,
                timestamp: new Date().toISOString(),
            };
            state.currentMessages.push(messageWithTimestamp);

            // If there's an active conversation, update it
            if (state.activeConversationId) {
                const conversation = state.conversations.find(c => c.id === state.activeConversationId);
                if (conversation) {
                    conversation.messages = [...state.currentMessages];
                    conversation.updatedAt = new Date().toISOString();
                }
            }
        },

        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.currentMessages = action.payload;

            // If there's an active conversation, update it
            if (state.activeConversationId) {
                const conversation = state.conversations.find(c => c.id === state.activeConversationId);
                if (conversation) {
                    conversation.messages = action.payload;
                    conversation.updatedAt = new Date().toISOString();
                }
            }
        },

        clearCurrentMessages: (state) => {
            state.currentMessages = [];
            state.activeConversationId = null;
        },

        // Conversation management
        saveConversation: (state, action: PayloadAction<{ title?: string }>) => {
            if (state.currentMessages.length === 0) return;

            const conversationId = state.activeConversationId || Date.now().toString();
            let title = action.payload.title;

            // Auto-generate title if not provided
            if (!title) {
                const firstUserMessage = state.currentMessages.find(m => m.role === 'user');
                if (firstUserMessage) {
                    const match = firstUserMessage.content.match(/^.*?[.!?]/);
                    title = match ? match[0].trim() : firstUserMessage.content.trim().substring(0, 50);
                    if (title.length > 50) {
                        title = title.substring(0, 47) + '...';
                    }
                } else {
                    title = `Conversation ${new Date().toLocaleString()}`;
                }
            }

            const existingIndex = state.conversations.findIndex(c => c.id === conversationId);
            const conversation: Conversation = {
                id: conversationId,
                title,
                messages: [...state.currentMessages],
                createdAt: existingIndex >= 0 ? state.conversations[existingIndex].createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                state.conversations[existingIndex] = conversation;
            } else {
                state.conversations.unshift(conversation);
            }

            state.activeConversationId = conversationId;
        },

        loadConversation: (state, action: PayloadAction<string>) => {
            const conversation = state.conversations.find(c => c.id === action.payload);
            if (conversation) {
                state.currentMessages = [...conversation.messages];
                state.activeConversationId = conversation.id;
            }
        },

        deleteConversation: (state, action: PayloadAction<string>) => {
            state.conversations = state.conversations.filter(c => c.id !== action.payload);
            if (state.activeConversationId === action.payload) {
                state.currentMessages = [];
                state.activeConversationId = null;
            }
        },

        startNewConversation: (state) => {
            state.currentMessages = [];
            state.activeConversationId = null;
        },

        // Loading and error states
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const {
    addMessage,
    setMessages,
    clearCurrentMessages,
    saveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation,
    setLoading,
    setError,
} = chatSlice.actions;

export default chatSlice.reducer;