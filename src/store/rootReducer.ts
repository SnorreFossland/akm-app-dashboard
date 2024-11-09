import { combineReducers } from '@reduxjs/toolkit';
import featureAReducer from '../features/featureA/featureASlice';
import ontologyReducer from '../features/ontology/ontologySlice';
// Import other feature reducers
// import featureBReducer from '../features/featureB/featureBSlice';

const rootReducer = combineReducers({
    featureA: featureAReducer,
    ontology: ontologyReducer,
    // featureB: featureBReducer,
    // Add other reducers here
});

export default rootReducer;