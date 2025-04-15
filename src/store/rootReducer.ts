import { combineReducers } from '@reduxjs/toolkit';
import modelReducer from '../features/model-universe/modelSlice';
import markdownReducer from '../redux/features/markdownSlice';

const rootReducer = combineReducers({
    modelUniverse: modelReducer,
    markdown: markdownReducer,
    // Add other reducers here
});

export default rootReducer;