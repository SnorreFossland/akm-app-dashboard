import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchModelDataFromGitHub, saveModelDataToGitHub } from './modelAPI';

// Define a specific type for the domain data
export interface DomainData {
  name: string;
  description: string;
  presentation: string;
  prompt: string;
  additionalContext?: string; // Make this optional since it's a new field
  ontology?: OntologyData; // Ontology is now nested under domain
}

// Export the ontology interface separately
export interface OntologyData {
  name: string;
  description: string;
  concepts: { name: string, description: string, color?: string, type?: string }[];
  relationships: { name: string, description: string, nameFrom: string, nameTo: string, type?: string }[];
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
// Extend MarkdownDocument so domain docs can carry the category
export interface MarkdownDocument {
  id: string;
  name: string;
  type?: string;               // made optional
  content: string;
  createdAt: string | Date;
  updatedAt?: string | Date;  // made optional
  // Optional metadata for domain documents
  domainCategory?: DomainCategory;
}

export interface DataType {
  phData: {
    metis: Metis,
    domain: DomainData,
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
    focusDoc?: {
      id: string | null;
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
  modelviews: Modelview[]
}

export interface Modelview {
  id: string;
  name: string;
  description: string;
  modelRef: string;
  modified: boolean;
  markedAsDeleted: boolean;
  objectviews: {
    id: string;
    name: string;
    type: string;
    loc: string;
    size: string;
    objectRef: string;
    memberscale: number;
    modified: boolean;
    markedAsDeleted: boolean;
    isSelect: boolean;
    isGroup: boolean;
    isExpanded: boolean;
    image: string;
    icon: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: string;
    strokeColor2: string;
    textColor: string;
    textColor2: string;
    viewkind: string;
  }[];
  relshipviews?: {
    id: string;
    name: string;
    relshipRef: string;
    fromobjviewRef: string;
    fromName: string;
    toobjviewRef: string;
    toName: string;
    points: number[];
  }[];
};


// Add domain category enum/union for type-safety
export type DomainCategory =
	| 'Personal'
	| 'Business'
	| 'Technical'
	| 'Organizational'
	| 'Educational'
	| 'Public';

// Extend Domain shape to include the category
interface Domain {
	// ...existing properties...
	domainCategory?: DomainCategory;
}

// Initialize default category on domain in the slice initial state
const initialState = {
	// ...existing state...
	phData: {
		// ...existing phData...
		domain: {
			// ...existing domain fields (name, description, presentation, etc) ...
			domainCategory: 'Organizational' as DomainCategory, // sensible default
		},
		// ...existing phData...
	},
	// ...existing initialState...
};

export const initialState: DataType = {
  phData: {
    metis: { name: '', description: '', models: [], metamodels: [] },
    domain: {
      name: '',
      description: '',
      prompt: '',
      presentation: '',
      additionalContext: '',
      ontology: { name: '', description: '', concepts: [], relationships: [] },
      domainCategory: 'Organizational', // sensible default
    },
    documents: [], // Add documents to initial state
  },
  phFocus: {
    focusModel: { id: '', name: '' },
    focusModelview: { id: '', name: '' },
    focusObject: { id: '', name: '' },
    focusObjectview: { id: '', name: '' },
    focusRelship: { id: '', name: '' },
    focusRelshipview: { id: '', name: '' },
    focusProj: { id: '', name: '', description: '' },
    focusDoc: { id: null },

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
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('238 setFileData action.payload', action.payload, 'state', state);
      }
      // Migrate possible old shape where ontology was top-level under phData
      const incomingPhData: any = { ...action.payload.phData };
      // Coerce legacy string domain to object
      if (typeof incomingPhData.domain === 'string') {
        incomingPhData.domain = {
          name: '',
          description: '',
          prompt: '',
          presentation: incomingPhData.domain,
          additionalContext: '',
          ontology: { name: '', description: '', concepts: [], relationships: [] },
        };
      }
      // Remove stray numeric keys from domain if present
      if (incomingPhData?.domain && typeof incomingPhData.domain === 'object') {
        Object.keys(incomingPhData.domain)
          .filter((k) => /^\d+$/.test(k))
          .forEach((k) => { delete (incomingPhData.domain as any)[k]; });
      }
      if (incomingPhData.ontology) {
        // Ensure domain exists
        incomingPhData.domain = incomingPhData.domain || {
          name: '', description: '', prompt: '', presentation: '', additionalContext: ''
        };
        // Move ontology under domain if not already present
        if (!incomingPhData.domain.ontology) {
          const { presentation, ...restOntology } = incomingPhData.ontology;
          incomingPhData.domain.ontology = { ...restOntology };
        }
        delete incomingPhData.ontology;
      }
      // Ensure ontology.presentation is not present in new shape
      if (incomingPhData?.domain?.ontology && 'presentation' in incomingPhData.domain.ontology) {
        const { presentation, ...rest } = incomingPhData.domain.ontology;
        incomingPhData.domain.ontology = { ...rest };
      }
      const { currentDocument: _legacyCurrentDoc, ...restPhData } = incomingPhData;
      state.phData = {
        ...restPhData,
      };
      state.phFocus = {
        ...action.payload.phFocus,
        focusDoc: action.payload.phFocus?.focusDoc || { id: null },
      };
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
    setFocusDoc(state, action: PayloadAction<{ id: string | null }>) {
      state.phFocus.focusDoc = action.payload;
    },
    setSource(state, action: PayloadAction<DataType['phSource']>) {
      state.phSource = action.payload;
    },
    setDomainData(state, action: PayloadAction<DomainData | string>) {
      if (typeof action.payload === 'object' && action.payload !== null) {
        state.phData.domain = {
          ...state.phData.domain,
          ...action.payload
        };
      } else if (typeof action.payload === 'string') {
        // Gracefully handle accidental string payloads by treating as presentation text
        state.phData.domain = {
          ...state.phData.domain,
          presentation: action.payload
        } as any;
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
    setOntologyData(state, action: PayloadAction<OntologyData>) {
      console.log('348 setOntologyData payload', action.payload, state);
      const newConcepts = (action.payload?.concepts || []).map((concept) => ({
        ...concept,
        color: 'lightgreen'
      }));

      const newRelationships = (action.payload?.relationships || []).map((relationship) => ({
        ...relationship,
        color: 'lightgreen'
      }));

      // Initialize domain if absent
      if (!state.phData.domain) {
        state.phData.domain = { ...initialState.phData.domain };
      }

      // Merge into nested ontology under domain
      const currentOntology = state.phData.domain.ontology || { name: '', description: '', concepts: [], relationships: [] };
      state.phData.domain.ontology = {
        ...currentOntology,
        name: action.payload.name,
        description: action.payload.description,
        concepts: [
          ...(currentOntology?.concepts || []),
          ...newConcepts
        ],
        relationships: [
          ...(currentOntology?.relationships || []),
          ...newRelationships
        ]
      };
    },
    editConcept: (state, action: PayloadAction<OntologyData['concepts'][number]>) => {
      if (!state.phData.domain.ontology) {
        state.phData.domain.ontology = { name: '', description: '', concepts: [], relationships: [] };
      }
      const index = state.phData.domain.ontology.concepts?.findIndex(concept => concept?.name === action.payload.name);
      if (index !== -1) {
        state.phData.domain.ontology.concepts[index] = action.payload;
      }
    },
    deleteConcept: (state, action: PayloadAction<string>) => {
      if (!state.phData.domain.ontology) return;
      state.phData.domain.ontology.concepts = state?.phData.domain.ontology.concepts.filter(concept => concept.name !== action.payload);
    },
    editRelationship: (state, action: PayloadAction<OntologyData['relationships'][number]>) => {
      if (!state.phData.domain.ontology) {
        state.phData.domain.ontology = { name: '', description: '', concepts: [], relationships: [] };
      }
      const index = state.phData.domain.ontology.relationships.findIndex(r => r.name === action.payload.name);
      if (index !== -1) {
        state.phData.domain.ontology.relationships[index] = action.payload;
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

      const normalizeType = (type?: string) => {
        if (!type) return 'markdown';
        const trimmed = type.trim();
        return trimmed === '' ? 'markdown' : trimmed;
      };

      const updatedDoc: MarkdownDocument = {
        ...action.payload,
        type: normalizeType(action.payload.type),
      };

      let existingIndex = state.phData.documents.findIndex(
        (doc) => doc.id === updatedDoc.id
      );

      if (existingIndex === -1) {
        existingIndex = state.phData.documents.findIndex(
          (doc) => doc.name === updatedDoc.name
        );
      }

      if (existingIndex >= 0) {
        // Preserve original createdAt if the payload omitted it
        const existingDoc = state.phData.documents[existingIndex];
        state.phData.documents[existingIndex] = {
          ...existingDoc,
          ...updatedDoc,
          createdAt: updatedDoc.createdAt || existingDoc.createdAt,
          updatedAt: updatedDoc.updatedAt || new Date().toISOString(),
        };
      } else {
        state.phData.documents.push({
          ...updatedDoc,
          createdAt: updatedDoc.createdAt || new Date().toISOString(),
          updatedAt: updatedDoc.updatedAt || new Date().toISOString(),
        });
      }

      // If we saved a 'domain' type document, propagate its domainCategory into the live domain slice
      try {
        const doc = action.payload;
        if (doc.type === 'domain') {
          state.phData = state.phData || ({} as any);
          state.phData.domain = state.phData.domain || ({} as any);
          // Update domain presentation/content if desired
          state.phData.domain.presentation = doc.content ?? state.phData.domain.presentation;
          // Propagate explicit domainCategory if present, otherwise keep existing
          if (doc.domainCategory) {
            state.phData.domain.domainCategory = doc.domainCategory;
          }
        }
      } catch (e) {
        // preserve existing behavior on error
        console.warn('saveMarkdownDocument: domain propagation failed', e);
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
    // New: allow explicit updates to the domain category
    setDomainCategory(state, action: PayloadAction<DomainCategory>) {
			if (!state.phData) state.phData = {} as any;
			if (!state.phData.domain) state.phData.domain = {} as any;
			state.phData.domain.domainCategory = action.payload;
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
  setFocusDoc,
  setDomainCategory,
} = modelSlice.actions;

export default modelSlice.reducer;
