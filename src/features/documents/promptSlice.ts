import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PromptDocument {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

interface PromptState {
    documents: PromptDocument[];
}

const initialState: PromptState = {
    documents: [],
};

export const promptSlice = createSlice({
    name: 'prompt',
    initialState,
    reducers: {
        savePromptDocument: (state, action: PayloadAction<PromptDocument>) => {
            // Check if document with same name exists
            const existingIndex = state.modelUniverse.phData.documents.findIndex(
                doc => doc.name === action.payload.name
            );

            if (existingIndex >= 0) {
                // Update existing document
                state.modelUniverse.phData.documents[existingIndex] = action.payload;
            } else {
                // Add new document
                state.modelUniverse.phData.documents.push(action.payload);
            }
        },
        deletePromptDocument: (state, action: PayloadAction<string>) => {
            state.modelUniverse.phData.documents = state.modelUniverse.phData.documents.filter(doc => doc.id !== action.payload);
        },
    },
});

export const { savePromptDocument, deletePromptDocument } = promptSlice.actions;
export default promptSlice.reducer;