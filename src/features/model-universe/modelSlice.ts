import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchModelDataFromGitHub, saveModelDataToGitHub } from './modelAPI';

// Define a specific type for the domain data
interface DomainData {
  name: string;
  description: string;
  presentation: string;
  prompt: string;
  additionalContext?: string; // Make this optional since it's a new field
}

// Export the ontology interface separately
export interface OntologyData {
  name: string;
  description: string;
  presentation: string;
  concepts: { name: string, description: string }[];
  relationships: { name: string, description: string, nameFrom: string, nameTo: string }[];
}

export interface ProjectInfo {
  id: string;
  projectNumber?: string;
  name: string;
  org?: string;
  repo?: string;
  path?: string;
  file?: string;
  branch?: string;
  username?: string;
  description: string;
}
// Export the document interface (moved from markdownSlice)
export interface MarkdownDocument {
  id: string;
  name: string;
  type?: string;               // made optional
  content: string;
  createdAt: string | Date;
  updatedAt?: string | Date;  // made optional
}

export interface DataType {
  phData: {
    metis: Metis,
    domain: DomainData,
    ontology: OntologyData,
    documents: MarkdownDocument[], // Add documents here
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
    focusProj: {
      id: string;
      name: string;
      description: string;

    };
  },
  phUser: {
    id: string;
    name: string;
    email: string;
  };
  phSource: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
};

export interface Metis {
  name: string;
  description: string;
  metamodels: [];
  models: Model[];
}
export interface Model {
  id: string;
  name: string;
  description: string;
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
}

export interface ModelView {
  id: string;
  name: string;
};


export const initialState: DataType = {
  phData: {
    metis: { name: '', description: '', models: [], metamodels: [] },
    domain: { name: '', description: '', prompt: '', presentation: '', additionalContext: '' },
    ontology: { name: '', description: '', presentation: '', concepts: [], relationships: [] },
    documents: [] // Add documents to initial state
  },
  phFocus: {
    focusModel: { id: '', name: '' },
    focusModelview: { id: '', name: '' },
    focusObject: { id: '', name: '' },
    focusObjectview: { id: '', name: '' },
    focusRelship: { id: '', name: '' },
    focusRelshipview: { id: '', name: '' },
    focusProj: { id: '', name: '', description: '' },

  },
  phUser: { id: '', name: '', email: '' },
  phSource: '', status: 'idle', error: null
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

// // Thunk to fetch data from GitHub
// export const getmodelData = createAsyncThunk<
//   Omit<DataType, 'status' | 'error'>,
//   void,
//   { rejectValue: string }
// >(
//   'model-universe/getmodelData',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await fetchModelDataFromGitHub();
//       console.log('32 fetchmodelDataFromGitHub response', response);
//       return response;
//     } catch (error: any) {
//       console.error('Failed to fetch model data from GitHub:', error);
//       return rejectWithValue(error.message || 'An unknown error occurred');
//     }
//   }
// );

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
      console.log('238 setFileData action.payload', action.payload, 'state', state);
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
        currentModel = { ...currentModel }
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
    setPhFocus(state, action: PayloadAction<DataType['phFocus']>) {
      console.log('344 action.payload', action.payload, state);
      state.phFocus = action.payload;
    },
    setFocusModelview(state, action: PayloadAction<DataType['phFocus']['focusModelview']>) {
      console.log('344 action.payload', action.payload, state);
      state.phFocus.focusModelview = action.payload;
    },
    setSource(state, action: PayloadAction<DataType['phSource']>) {
      state.phSource = action.payload;
    },
    setDomainData(state, action: PayloadAction<DomainData>) {
      if (typeof action.payload === 'object' && action.payload !== null) {
        state.phData.domain = {
          ...state.phData.domain,
          ...action.payload
        };
      } else {
        console.error("setDomainData received an invalid payload:", action.payload);
      }
    },
    setDomainPrompt(state, action: PayloadAction<DataType['phData']['domain']['prompt']>) {
      console.log('375 action.payload', action.payload, state);
      state.phData.domain.prompt = action.payload;
    },
    deleteDomainPrompt(state) {
      state.phData.domain.prompt = "";
    },
    setDomainAdditionalContext(state, action: PayloadAction<string>) {
      state.phData.domain.additionalContext = action.payload;
    },
    resetDomainData(state) {
      state.phData.domain = initialState.phData.domain;
    },
    setOntologyData(state, action: PayloadAction<DataType>) {
      console.log('348 action.payload', action.payload, state);
      const newConcepts = (action.payload.phData.ontology?.concepts || []).map((concept) => ({
        ...concept,
        color: 'lightgreen'
      }));

      const newRelationships = (action.payload.phData.ontology?.relationships || []).map((relationship) => ({
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
    editRelationship: (state, action: PayloadAction<DataType['phData']['ontology']['relationships'][number]>) => {
      const index = state.phData.ontology.relationships.findIndex(r => r.name === action.payload.name);
      if (index !== -1) {
        if (index !== -1) {
          state.phData.ontology.relationships[index] = action.payload;
        }
      }
    },

    updateMetisInfo(state, action: PayloadAction<{ name: string, description: string }>) {
      if (state.phData.metis) {
        state.phData.metis.name = action.payload.name;
        state.phData.metis.description = action.payload.description;
      }
    },
    updateModelInfo(state, action: PayloadAction<{ id: string, name: string, description: string }>) {
      const modelIndex = state.phData.metis.models.findIndex(model => model.id === action.payload.id);
      if (modelIndex !== -1) {
        state.phData.metis.models[modelIndex].name = action.payload.name;
        state.phData.metis.models[modelIndex].description = action.payload.description;
      }
    },
    updateProjectInfo(state, action: PayloadAction<Partial<DataType['phFocus']['focusProj']>>) {
      if (state.phFocus && 'focusProj' in state.phFocus) {
        state.phFocus.focusProj = {
          ...state.phFocus.focusProj,
          ...action.payload
        };
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

    // Add document management reducers
    saveMarkdownDocument: (state, action: PayloadAction<MarkdownDocument>) => {
      // Ensure documents array exists
      if (!state.phData.documents) {
        state.phData.documents = [];
      }

      // Check if document with same name exists
      const existingIndex = state.phData.documents.findIndex(
        doc => doc.name === action.payload.name
      );

      if (existingIndex >= 0) {
        // Update existing document
        state.phData.documents[existingIndex] = action.payload;
      } else {
        // Add new document
        state.phData.documents.push(action.payload);
      }
    },
    deleteMarkdownDocument: (state, action: PayloadAction<string>) => {
      // Ensure documents array exists before filtering
      if (!state.phData.documents) {
        state.phData.documents = [];
        return;
      }
      state.phData.documents = state.phData.documents.filter(doc => doc.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
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
  setPhFocus,
  setSource,
  setDomainPrompt,
  setDomainData,
  setOntologyData,
  editConcept,
  deleteConcept,
  editRelationship,
  clearModel,
  clearStore,
  deleteDomainPrompt,
  setDomainAdditionalContext,
  resetDomainData,
  updateMetisInfo,
  updateModelInfo,
  updateProjectInfo,
  // Add the new document actions
  saveMarkdownDocument,
  deleteMarkdownDocument,
} = modelSlice.actions;

export default modelSlice.reducer;