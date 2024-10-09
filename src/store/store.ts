// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import featureAReducer from '../features/featureA/featureASlice';
// import featureBReducer from '../features/featureB/featureBSlice';
// Import other feature reducers

export const store = configureStore({
    reducer: {
        featureA: featureAReducer,
        // featureB: featureBReducer,
        // Add other reducers here
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;