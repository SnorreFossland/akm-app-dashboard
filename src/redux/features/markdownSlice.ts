import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MarkdownDocument {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface MarkdownState {
  documents: MarkdownDocument[];
}

const initialState: MarkdownState = {
  documents: [],
};

export const markdownSlice = createSlice({
  name: 'markdown',
  initialState,
  reducers: {
    saveMarkdownDocument: (state, action: PayloadAction<MarkdownDocument>) => {
      // Check if document with same name exists
      const existingIndex = state.documents.findIndex(
        doc => doc.name === action.payload.name
      );
      
      if (existingIndex >= 0) {
        // Update existing document
        state.documents[existingIndex] = action.payload;
      } else {
        // Add new document
        state.documents.push(action.payload);
      }
    },
    deleteMarkdownDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
    },
  },
});

export const { saveMarkdownDocument, deleteMarkdownDocument } = markdownSlice.actions;
export default markdownSlice.reducer;