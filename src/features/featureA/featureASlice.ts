// src/features/featureA/featureASlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchFeatureADataFromGitHub, saveFeatureADataToGitHub } from './featureAAPI';
import type { RootState } from '@/store/store';

interface DataType {
  project: {
    phData: { metis: any };
    phFocus: any;
    phUser: any;
    phSource: any;
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

export const { setFileData } = featureASlice.actions;
export default featureASlice.reducer;