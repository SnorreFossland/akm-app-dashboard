// src/features/featureA/featureASlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchFeatureADataFromGitHub, saveFeatureADataToGitHub } from './featureAAPI';
// import type { RootState } from '@/store/store';



interface DataType {
  project: {
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
      console.log('129 currentModel', currentModel, state.data?.project.phFocus);
      if (currentModel && currentModel.objects) {
        action.payload.map(object => {
          const objectIndex = currentModel?.objects?.findIndex(object => object.id === state.data?.project?.phFocus?.focusObject?.id);
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
    setRelationships(state, action: PayloadAction<DataType['project']['phData']['metis']['models'][number]['relships'][number][]>) {
      let currentModel = state.data?.project.phData.metis.models.find(model => model.id === state.data?.project.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.project.phData.metis.models[0];
      console.log('145 action.payload', action.payload, 'currentModel', currentModel,);
      if (currentModel && currentModel.relships) {
        action.payload.map((relationship, index) => {
          const relationshipIndex = currentModel?.relships?.findIndex(r => r.id === relationship?.id);
          if (index === 1) console.log('149 relationship', relationship,'index',  relationshipIndex);
          if (relationshipIndex === undefined || relationshipIndex === -1) {
            currentModel.relships.push(relationship);
          } else {
            currentModel.relships[relationshipIndex] = relationship;
          }
        });
      }
    },
    setModelview(state, action: PayloadAction<DataType['project']['phData']['metis']['models'][number]['modelviews'][number][]>) { 
      let currentModel = state.data?.project.phData.metis.models.find(model => model.id === state.data?.project.phFocus.focusModel.id);
      if (!currentModel) currentModel = state.data?.project.phData.metis.models[0];
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
    clearModel(state, action) {
      // let currentModel = state.data?.project.phData.metis.models.find(model => model.id === state.data?.project.phFocus.focusModel.id);
      // if (!currentModel) currentModel = state.data?.project.phData.metis.models[0];
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
      .addCase(getFeatureAData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getFeatureAData.fulfilled, (state, action: PayloadAction<DataType>) => {
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

export const { setFileData, setObjects, setRelationships, setModelview, clearModel, clearStore } = featureASlice.actions;
export default featureASlice.reducer;