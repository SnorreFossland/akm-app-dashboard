import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { set } from 'zod';

interface DataType {
    name: string,
    description: string,
    concepts: any[],
    relationships: any[],
    presentation: string,
}

interface OntologyState {
    data: DataType | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}
const initialState: OntologyState = {
    data: {
        name: '',
        description: '',
        concepts: [],
        relationships: [],
        presentation: ''
    },
    status: 'idle',
    error: null,
};

// Define the async thunk
export const fetchOntology = createAsyncThunk(
    'ontology/fetchOntology',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/ontology'); // Replace with your API endpoint
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            } else {
                return rejectWithValue('An unknown error occurred');
            }
        }
    }
);

const ontologySlice = createSlice({
    name: 'ontology',
    initialState,
    reducers: {
        setOntologyData(state, action) {
            if (state.data) {
                const newConcepts = (action.payload.concepts || []).map((concept: any) => ({
                    ...concept,
                    color: 'lightgreen'
                }));

                const newRelationships = (action.payload.relationships || []).map((relationship: any) => ({
                    ...relationship,
                    color: 'lightgreen'
                }));

                state.data = {
                    ...state.data,
                    ...action.payload,
                    concepts: [
                        ...(state.data?.concepts || []),
                        ...newConcepts
                    ],
                    relationships: [
                        ...(state.data?.relationships || []),
                        ...newRelationships
                    ]
                };
            } else {
                const newConcepts = (action.payload.concepts || []).map((concept: any) => ({
                    ...concept,
                    color: 'gray'
                }));

                const newRelationships: { [key: string]: any }[] = (action.payload.relationships || []).map((relationship: any) => ({
                    ...relationship,
                    color: 'gray'
                }));

                state.data = {
                    ...action.payload,
                    concepts: newConcepts,
                    relationships: newRelationships
                };
            }
        },
        editConcept: (state, action: PayloadAction<Concept>) => {
            const index = state.data.concepts.findIndex(concept => concept.id === action.payload.id);
            if (index !== -1) {
                state.data.concepts[index] = action.payload;
            }
        },
        deleteConcept: (state, action: PayloadAction<string>) => {
            state.data.concepts = state.data.concepts.filter(concept => concept.id !== action.payload);
        },
        editRelationship: (state, action: PayloadAction<string>) => {
            const index = state.relationships.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.relationships[index] = action.payload;
            }
        },
        deleteRelationship: (state, action: PayloadAction<string>) => {
            state.relationships = state.relationships.filter(r => r.id !== action.payload);
        },
        clearStore() {
            return initialState;  //ToDo: should be only concepts and relationships
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOntology.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchOntology.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const newConcepts: { [key: string]: any }[] = (action.payload.concepts || []).map((concept: any) => ({
                    ...concept,
                    color: 'green'
                }));

                const newRelationships: { [key: string]: any }[] = (action.payload.relationships || []).map((relationship: any) => ({
                    ...relationship,
                    color: 'green'
                }));

                state.data = {
                    ...state.data,
                    ...action.payload,
                    concepts: [
                        ...(state.data?.concepts || []),
                        ...newConcepts
                    ],
                    relationships: [
                        ...(state.data?.relationships || []),
                        ...newRelationships
                    ],
                    loading: false,
                    error: null
                };
            })
            .addCase(fetchOntology.rejected, (state, action) => {
                state.status = 'failed';
                state.error = typeof action.payload === 'string' ? action.payload : null;
            });
    },
});

export const { setOntologyData, editConcept, editRelationship, deleteConcept, deleteRelationship, clearStore } = ontologySlice.actions;
export default ontologySlice.reducer;
