import { combineReducers } from '@reduxjs/toolkit';
import modelReducer from '../features/model-universe/modelSlice';
import markdownReducer from '../features/documents/markdownSlice';
import promptReducer from '../features/documents/promptSlice';

const rootReducer = combineReducers({
    modelUniverse: modelReducer,
    markdown: markdownReducer,
    prompt: promptReducer,
    // Add other reducers here
});

export default rootReducer;