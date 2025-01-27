import { combineReducers } from '@reduxjs/toolkit';
// import featureAReducer from '../features/featureA/featureASlice';
import modelReducer from '../features/model-universe/modelSlice';
// Import other feature reducers
// import ontologyReducer from '../features/model-universe/modelSlice';
// import featureBReducer from '../features/featureB/featureBSlice';

const rootReducer = combineReducers({
    // featureA: featureAReducer,
    modelUniverse: modelReducer,
    // featureB: featureBReducer,
    // Add other reducers here
});

export default rootReducer;