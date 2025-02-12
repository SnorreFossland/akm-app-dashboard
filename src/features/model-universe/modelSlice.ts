import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchModelDataFromGitHub, saveModelDataToGitHub } from './modelAPI';

export interface DataType {
  phData: {
    metis: {
      name: string,
      description: string,
      metamodels: []
      models: {
        id: string,
        name: string,
        description: string,
        metamodelRef: string,
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
          }[],
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
    domain: { name: string, description: string, summary: string },
    ontology: { name: string, description: string, presentation: string, concepts: { name: string, description: string }[], relationships: { name: string, description: string, nameFrom: string, nameTo: string }[] },
  },
  phFocus: {
    focusModel: {
      id: string;
      name: string;
    };
    focusModelview: {
      id: string;
      name: string;
    };
    focusObject?: {
      id: string;
      name: string;
    };
    focusObjectview?: {
      id: string;
      name: string;
    };
    focusRelship?: {
      id: string;
      name: string;
    };
    focusRelshipview?: {
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
  // status: 'idle', // or any initial status value
  // error: string | null,
};

export const initialState: DataType = { 
  phData: {
    metis: {
      name: 'AKMM Blank',
      description: 'AKMM blank model',  
      models: [
        {
          id: 'm1',
          name: 'Blank Model 1',
          description: 'Blank Model 1 Description',
          metamodelRef: '42c16e69-49ec-45b9-080e-0ca3ab8e0223',
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
              id: 'mv1',
              name: 'Model View 1',
              description: 'Model View 1 Description',
              modelRef: 'm1',
              modified: false,
              markedAsDeleted: false,
              objectviews: [
                {
                  id: 'ov1',
                  name: 'Blank Object View 1',
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
                  id: 'rv1',
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
      metamodels: [],
    },
    domain: { name: 'domain blank', description: 'domain blank description', summary: 'domain blank summary' },
    ontology: {
      name: 'Ontology blank domain',
      description: 'Ontology blank initial domain.',
      presentation: 'Domain blank Presentation',
      concepts: [],
      relationships: [],  
    },
  },
  phFocus: {
    focusModel: {
      id: 'm1',
      name: 'Model 1',
    },
    focusModelview: {
      id: 'mv1',
      name: 'Model View 1',
    },
  },
  phUser: {
    id: '1',
    name: 'User 1',
    email: 'user@email.com'
  },
  phSource: 'AKM Blank',
  // status: 'idle',
  // error: null,
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
    try {
      const response = await fetchModelDataFromGitHub();
      console.log('32 fetchmodelDataFromGitHub response', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch model data from GitHub:', error);
      throw error;
    }
  }
);

// Thunk to save data to GitHub
export const savemodelData = createAsyncThunk(
  'model-universe/savemodelData',
  async (data: DataType) => {
    try {
      const response = await saveModelDataToGitHub(data);
      return response;
    } catch (error) {
      console.error('Failed to save model data to GitHub:', error);
      throw error;
    }
  }
);


const modelSlice = createSlice({
  name: 'modelUniverse',
  initialState,
  reducers: {
    setFileData(state, action: PayloadAction<DataType>) {
      state.phData = { ...action.payload.phData };
      state.phFocus = { ...action.payload.phFocus };
      state.phUser = { ...action.payload.phUser };
      state.phSource = action.payload.phSource;
    },
 
    setNewModel(state, action: PayloadAction<DataType['phData']['metis']['models'][number]>) { 
      let currentModel = state?.phData.metis.models.find(model => model.id === action.payload.id);
      console.log('283 currentModel', action.payload, currentModel, state, state?.phFocus.focusModel.id);
      if (!currentModel) currentModel = state?.phData.metis.models[0];
      if (currentModel) {
        currentModel = {...currentModel}
        currentModel.name = action.payload.name;
        currentModel.description = action.payload.description;
        currentModel.metamodelRef = currentModel.metamodelRef;
        currentModel.objects = action.payload.objects;
        currentModel.relships = action.payload.relships;
        currentModel.modelviews = currentModel.modelviews;
      }
      console.log('295 currentModel', currentModel);
      const modelIndex = state.phData.metis.models.findIndex(model => model.id === currentModel.id);
      if (modelIndex !== -1) {
        state.phData.metis.models[modelIndex] = currentModel;
      } else {
        state.phData.metis.models.push(currentModel);
      }
      console.log('297 state', state);
    },
    setObjects(state, action: PayloadAction<DataType['phData']['metis']['models'][number]['objects'][number][]>) {
      let currentModel = state?.phData.metis.models.find(model => model.id === state?.phFocus.focusModel.id);
      if (!currentModel) currentModel = state?.phData.metis.models[0];
      console.log('129 currentModel', currentModel, state?.phFocus);
      if (currentModel && currentModel.objects) {
        action.payload.map(object => {
          const objectIndex = currentModel?.objects?.findIndex(object => object.id === state?.phFocus?.focusObject?.id);
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
      let currentModel = state?.phData.metis.models.find(model => model.id === state?.phFocus.focusModel.id);
      if (!currentModel) currentModel = state?.phData.metis.models[0];
      console.log('145 action.payload', action.payload, 'currentModel', currentModel,);
      if (currentModel && currentModel.relships) {
        action.payload?.map((relationship, index) => {
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
    setNewModelview(state, action: PayloadAction<DataType['phData']['metis']['models'][number]['modelviews'][number][]>) {
      if (!state) return;
      let currentModel = state.phData.metis.models.find(model => model.id === state.phFocus.focusModel.id);
      if (!currentModel) currentModel = state?.phData.metis.models[0];
      console.log('161 action.payload', action.payload, 'currentModel', currentModel,);
      if (currentModel && currentModel.modelviews) {
        action.payload.forEach(modelview => {
          if (modelview?.id) {
            console.log('164 modelview', modelview);
            const modelviewIndex = currentModel.modelviews.findIndex(mv => mv.id === modelview.id);
            if (modelviewIndex === -1) {
              currentModel.modelviews.push(modelview);
            } else {
              currentModel.modelviews[modelviewIndex] = modelview;
            }
          }
        });
      }
    },
    setFocusModel(state, action: PayloadAction<DataType['phFocus']['focusModel']>) {
      console.log('344 action.payload', action.payload, state);
      state.phFocus.focusModel = action.payload;
    },
    setFocusModelview(state, action: PayloadAction<DataType['phFocus']['focusModelview']>) {
      console.log('344 action.payload', action.payload, state);
      state.phFocus.focusModelview = action.payload;
    },
    setSource(state, action: PayloadAction<DataType['phSource']>) {
      state.phSource = action.payload;
    },
    setDomainData(state, action: PayloadAction<DataType['phData']['domain']>) {
      state.phData.domain = action.payload || state.phData.domain;
    },
    setOntologyData(state, action: PayloadAction<DataType>) {
      console.log('348 action.payload', action.payload, state);
      const newConcepts = (action.payload.phData.ontology?.concepts || []).map((concept: any) => ({
        ...concept,
        color: 'lightgreen'
      }));

      const newRelationships = (action.payload.phData.ontology?.relationships || []).map((relationship: any) => ({
        ...relationship,
        color: 'lightgreen'
      }));

      state.phData.ontology = {
        ...state.phData.ontology,
        name: action.payload.phData.ontology.name,
        description: action.payload.phData.ontology.description,
        presentation: action.payload.phData.ontology.presentation,
        concepts: [
          ...(state.phData.ontology?.concepts || []),
          ...newConcepts
        ],
        relationships: [
          ...(state.phData.ontology?.relationships || []),
          ...newRelationships
        ]
      };
    },
    editConcept: (state, action: PayloadAction<DataType['phData']['ontology']['concepts'][number]>) => {
      const index = state.phData.ontology.concepts?.findIndex(concept => concept?.name === action.payload.name);
      if (index !== -1) {
        state.phData.ontology.concepts[index] = action.payload;
      }
    },
    deleteConcept: (state, action: PayloadAction<string>) => {
      state.phData.ontology.concepts = state?.phData.ontology.concepts.filter(concept => concept.name !== action.payload);
    },
    editRelationship: (state, action: PayloadAction<{ id: string }>) => {
      const index = state.phData.ontology.relationships.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.phData.ontology.relationships[index] = action.payload;
      }
    },

    clearModel(state, action) {
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
        state = action.payload;
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

export const { 
  setFileData, 
  setNewModel, 
  setObjects, 
  setRelationships, 
  setNewModelview, 
  setFocusModel, 
  setFocusModelview, 
  setSource, 
  setDomainData,
  setOntologyData, 
  editConcept, 
  deleteConcept, 
  editRelationship, 
  clearModel, 
  clearStore 
} = modelSlice.actions;
export default modelSlice.reducer;