import { combineReducers } from '@reduxjs/toolkit';
import featureAReducer from '../features/featureA/featureASlice';
// Import other feature reducers
// import featureBReducer from '../features/featureB/featureBSlice';

const rootReducer = combineReducers({
    featureA: featureAReducer,
    // featureB: featureBReducer,
    // Add other reducers here
});

export default rootReducer;