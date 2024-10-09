// src/features/featureA/featureASlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchFeatureADataFromGitHub, saveFeatureADataToGitHub } from './featureAAPI';
import type { RootState } from '@/store/store';

// Define or import DataType
interface DataType {
    id: number;
    name: string;
}

interface FeatureAState {
    data: { name: string; 
        items: DataType[] 
    };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: FeatureAState = {
    data: { name: 'Test Data', 
        items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
        ] 
    },
    status: 'idle',
    error: null,
};

// Thunk to fetch data from GitHub
export const getFeatureAData = createAsyncThunk(
  'featureA/getFeatureAData',
  async () => {
    const response = await fetchFeatureADataFromGitHub();
    return response;
  }
);

// Thunk to save data to GitHub
export const saveFeatureAData = createAsyncThunk(
  'featureA/saveFeatureAData',
    async (data: DataType[]) => {
    const response = await saveFeatureADataToGitHub(data);
    return response;
  }
);

const featureASlice = createSlice({
  name: 'featureA',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFeatureAData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getFeatureAData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data.items = action.payload;
      })
      .addCase(getFeatureAData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch data';
      })
      .addCase(saveFeatureAData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveFeatureAData.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(saveFeatureAData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to save data';
      });
  },
});

export default featureASlice.reducer;