import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OntologyType {
    name: string,
    description: string,
    concepts: any[],
    relationships: any[],
    presentation: string,
}

interface OntologyState {
    data: {
        phData: {
            ontology: OntologyType | null;
        };
    };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

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

const initialState: OntologyState = {
    data: {
        phData: {
            ontology: null,
        },
    },
    status: 'idle',
    error: null,
};

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
                    phData: {
                        ...state.data.phData,
                        ontology: {
                            ...state.data.phData.ontology,
                            name: action.payload.name,  
                            description: action.payload.description,
                            presentation: action.payload.presentation,            
                            concepts: [
                                ...(state.data?.phData.ontology.concepts || []),
                                ...newConcepts
                            ],
                            relationships: [
                                ...(state.data?.phData.ontology.relationships || []),
                                ...newRelationships
                            ]
                        },
                    },
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

                state = {
                    ...initialState,
                    data: {
                        ...initialState.data,
                        phData: {
                            metis: {
                                ...action.payload.metis,
                                color: 'gray'
                            },
                            ontology: {
                                ...action.payload,
                                concepts: newConcepts,
                                relationships: newRelationships
                            }
                        }
                    },
                };
            }
        },
        editConcept: (state, action: PayloadAction<DataType>) => {
            const index = state.data.phData.ontology.concepts.findIndex(concept => concept.id === action.payload.id);
            if (index !== -1) {
                state.data.phData.ontology.concepts[index] = action.payload;
            }
        },
        deleteConcept: (state, action: PayloadAction<string>) => {
            state.data.phData.ontology.concepts = state.data?.phData.ontology.concepts.filter(concept => concept.id !== action.payload);
        },
        editRelationship: (state, action: PayloadAction<string>) => {
            const index = state.data.phData.ontology.relationships.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.data.phData.ontology.relationships[index] = action.payload;
            }
        },
        deleteRelationship: (state, action: PayloadAction<string>) => {
            state.data.phData.ontology.relationships = state.data?.phData.ontology.relationships.filter(r => r.id !== action.payload);
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
