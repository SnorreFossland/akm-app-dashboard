// src/features/featureA/featureASlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchFeatureADataFromGitHub, saveFeatureADataToGitHub } from './featureAAPI';
// import type { RootState } from '@/store/store';



interface DataType {
  project: {
    phData: {
      metis: {
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
          }[]
        }[]
      }
    };
    phFocus: {
      focusModel: {
        id: string;
        name: string;
      };
      focusObject?: {
        id: string;
        name: string;
      };
    };
    phUser: {
      id: string;
      name: string;
      email: string;
    };
    phSource: string;
  };
}

interface FeatureAState {
  data: DataType | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FeatureAState = {
  data: null,
  status: 'idle',
  error: null,
};

// Thunk to fetch data from GitHub
export const getFeatureAData = createAsyncThunk(
  'featureA/getFeatureAData',
  async () => {
    const response = await fetchFeatureADataFromGitHub();
    console.log('32 fetchFeatureADataFromGitHub response', response);
    return response;
  }
);

// Thunk to save data to GitHub
export const saveFeatureAData = createAsyncThunk(
  'featureA/saveFeatureAData',
  async (data: DataType) => {
    const response = await saveFeatureADataToGitHub(data);
    return response;
  }
);

const featureASlice = createSlice({
  name: 'featureA',
  initialState,
  reducers: {
    setFileData(state, action: PayloadAction<DataType>) {
      state.data = action.payload;
    },
    setObjects(state, action: PayloadAction<DataType['project']['phData']['metis']['models'][number]['objects'][number][]>) {
      let currentModel = state.data?.project.phData.metis.models.find(model => model.id === state.data?.project.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.project.phData.metis.models[0];
      console.log('84 currentModel', currentModel, state.data?.project.phFocus);
      if (currentModel && currentModel.objects) {
        action.payload.map(object => {
          const objectIndex = currentModel?.objects?.findIndex(object => object.id === state.data?.project?.phFocus?.focusObject?.id);
          if (objectIndex === undefined || objectIndex === -1) {
            currentModel.objects.push(object);
          } else {
            currentModel.objects[objectIndex] = object;
          }
        });
      }
    },
    // ToDo: rename setRelationships to setRelships
    setRelationships(state, action: PayloadAction<DataType['project']['phData']['metis']['models'][number]['relships'][number][]>) {
      let currentModel = state.data?.project.phData.metis.models.find(model => model.id === state.data?.project.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.project.phData.metis.models[0];
      console.log('93 action.payload', action.payload, 'currentModel', currentModel,);
      if (currentModel && currentModel.relships) {
        action.payload.map((relationship, index) => {
          const relationshipIndex = currentModel?.relships?.findIndex(r => r.id === relationship?.id);
          if (index === 1) console.log('114 relationship', relationship,'index',  relationshipIndex);
          if (relationshipIndex === undefined || relationshipIndex === -1) {
            currentModel.relships.push(relationship);
          } else {
            currentModel.relships[relationshipIndex] = relationship;
          }
        });
      }
    },
    clearStore() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFeatureAData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getFeatureAData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(getFeatureAData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(saveFeatureAData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveFeatureAData.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(saveFeatureAData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export const { setFileData, setObjects, setRelationships, clearStore } = featureASlice.actions;
export default featureASlice.reducer;