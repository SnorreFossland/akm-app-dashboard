// src/features/model-universe/modelSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchmodelDataFromGitHub, savemodelDataToGitHub } from './modelAPI';
// import type { RootState } from '@/store/store';



export interface DataType {
  data: {
    phData: {
      metis: {
        name: string,
        description: string,
        models: {
          id: string,
          name: string,
          description: string,
          objects: {
            id: string,
            name: string,
            description: string,
            proposedType: string,
            typeRef: string,
            typeName: string,
            category: string,
          }[],
          relships: {
            id: string,
            name: string,
            typeRef: string,
            fromobjectRef: string,
            nameFrom: string,
            toobjectRef: string,
            nameTo: string,
          }[],
          modelviews: {
            id: string,
            name: string,
            description: string,
            modelRef: string,
            modified: boolean,
            markedAsDeleted: boolean,
            objectviews: {
              id: string,
              name: string,
              type: string,
              loc: string,
              size: string,
              memberscale: number,
              objectRef: string,
              modified: boolean,
              markedAsDeleted: boolean,
              isSelect: boolean,
              isGroup: boolean,
              isExpanded: boolean,
              image: string,
              icon: string,
              fillColor: string,
              strokeColor: string,
              strokeWidth: string,
              strokeColor2: string,
              textColor: string,
              textColor2: string,
              viewkind: string,
            },
            relshipviews: {
              id: string,
              name: string,
              relshipRef: string,
              fromobjviewRef: string,
              toobjviewRef: string,
              points: number[],
            }[],
          }[],
        }[],
      },
      ontology: { name: string, description: string, presentation: string, concepts: any[], relationships: any[] },
    },
    phFocus: {
      focusModel: {
        id: string;
        name: string;
      };
      focusObject?: {
        id: string;
        name: string;
      };
    },
    phUser: {
      id: string;
      name: string;
      email: string;
    };
    phSource: string;
  } | null;
}


export const initialState = { 
  data: {
    phData: {
      metis: {
        name: 'AKMM',
        description: 'AKMM Model',  
        models: [
          {
            id: '1',
            name: 'Model 1',
            description: 'Model 1 Description',
            objects: [
              {
                id: '1',
                name: 'Object 1',
                description: 'Object 1 Description',
                proposedType: 'Object',
                typeRef: '1',
                typeName: 'Object',
                category: 'Object',
              },
            ],
            relships: [
              {
                id: '1',
                name: 'Relationship 1',
                typeRef: '1',
                fromobjectRef: '1',
                nameFrom: 'Object 1',
                toobjectRef: '1',
                nameTo: 'Object 1',
              },
            ],
            modelviews: [
              {
                id: '1',
                name: 'Model View 1',
                description: 'Model View 1 Description',
                modelRef: '1',
                modified: false,
                markedAsDeleted: false,
                objectviews: [
                  {
                    id: '1',
                    name: 'Object View 1',
                    type: 'Object',
                    loc: '0,0',
                    size: '100,100',
                    memberscale: 1,
                    objectRef: '1',
                    modified: false,
                    markedAsDeleted: false,
                    isSelect: false,
                    isGroup: false,
                    isExpanded: false,
                    image: '',
                    icon: '',
                    fillColor: '',
                    strokeColor: '',
                    strokeWidth: '',
                    strokeColor2: '',
                    textColor: '',
                    textColor2: '',
                    viewkind: '',
                  },
                ],
                relshipviews: [
                  {
                    id: '1',
                    name: 'Relationship View 1',
                    relshipRef: '1',
                    fromobjviewRef: '1',
                    toobjviewRef: '1',
                    points: [1, 2, 3, 4],
                  },
                ],
              },
            ],
          },
        ],
      },
      ontology: {
        name: 'AKMO',
        description: 'AKMO Ontology',
        presentation: 'AKMO Presentation',
        concepts: [],
        relationships: [],  
      },
    },
    phFocus: {
      focusModel: {
        id: '1',
        name: 'Model 1',
      },
    },
    phUser: {
      id: '1',
      name: 'User 1',
      email: 'user@email.com'
    },
    phSource: 'AKM File',
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

// Thunk to fetch data from GitHub
export const getmodelData = createAsyncThunk(
  'model-universe/getmodelData',
  async () => {
    const response = await fetchmodelDataFromGitHub();
    console.log('32 fetchmodelDataFromGitHub response', response);
    return response;
  }
);

// Thunk to save data to GitHub
export const savemodelData = createAsyncThunk(
  'model-universe/savemodelData',
  async (data: DataType) => {
    const response = await savemodelDataToGitHub(data);
    return response;
  }
);

const modelSlice = createSlice({
  name: 'modelUniverse',
  initialState,
  reducers: {
    setFileData(state, action: PayloadAction<DataType>) {
      state.data = action.payload;
    },
    setObjects(state, action: PayloadAction<DataType['data']['phData']['metis']['models'][number]['objects'][number][]>) {
      let currentModel = state.data?.phData.metis.models.find(model => model.id === state.data?.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.phData.metis.models[0];
      console.log('129 currentModel', currentModel, state.data?.phFocus);
      if (currentModel && currentModel.objects) {
        action.payload.map(object => {
          const objectIndex = currentModel?.objects?.findIndex(object => object.id === state.data?.phFocus?.focusObject?.id);
          console.log('132 object', object, 'objectIndex', objectIndex);
          if (objectIndex === undefined || objectIndex === -1) {
            currentModel.objects.push(object);
          } else {
            currentModel.objects[objectIndex] = object;
          }
        });
      }
    },
    // ToDo: rename setRelationships to setRelships
    setRelationships(state, action: PayloadAction<DataType['phData']['metis']['models'][number]['relships'][number][]>) {
      let currentModel = state.data?.phData.metis.models.find(model => model.id === state.data?.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.phData.metis.models[0];
      console.log('145 action.payload', action.payload, 'currentModel', currentModel,);
      if (currentModel && currentModel.relships) {
        action.payload.map((relationship, index) => {
          const relationshipIndex = currentModel?.relships?.findIndex(r => r.id === relationship?.id);
          if (index === 1) console.log('149 relationship', relationship, 'index', relationshipIndex);
          if (relationshipIndex === undefined || relationshipIndex === -1) {
            currentModel.relships.push(relationship);
          } else {
            currentModel.relships[relationshipIndex] = relationship;
          }
        });
      }
    },
    setModelview(state, action: PayloadAction<DataType['phData']['metis']['models'][number]['modelviews'][number][]>) {
      let currentModel = state.data?.phData.metis.models.find(model => model.id === state.data?.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.phData.metis.models[0];
      console.log('161 action.payload', action.payload, 'currentModel', currentModel,);
      if (currentModel && currentModel.modelviews) {
        action.payload.forEach(modelview => {
          console.log('164 modelview', modelview);
          const modelviewIndex = currentModel.modelviews.findIndex(mv => mv.id === modelview.id);
          if (modelviewIndex === -1) {
            currentModel.modelviews.push(modelview);
          } else {
            currentModel.modelviews[modelviewIndex] = modelview;
          }
        });
      }
    },
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

    clearModel(state, action) {
      // let currentModel = state.data?.phData.metis.models.find(model => model.id === state.data?.phFocus.focusModel.id);
      // if (!currentModel) currentModel = state.data?.phData.metis.models[0];
      console.log('187 action.payload', action.payload, state);
      if (action.payload) {
        action.payload.objects = [];
        action.payload.relships = [];
        action.payload.modelviews = [];
      }
      return state;
    },
    clearStore() {
      return initialState;  //ToDo: should be only objects and relationships and modelviews so that the user dont have to reload the data from file
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getmodelData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getmodelData.fulfilled, (state, action: PayloadAction<DataType>) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(getmodelData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(savemodelData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(savemodelData.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(savemodelData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export const { setFileData, setObjects, setRelationships, setModelview, setOntologyData, editConcept, deleteConcept, editRelationship, deleteRelationship, clearModel, clearStore } = modelSlice.actions;
export default modelSlice.reducer;