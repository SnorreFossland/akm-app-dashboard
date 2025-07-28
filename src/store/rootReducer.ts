import { combineReducers } from '@reduxjs/toolkit';
import modelReducer from '../features/model-universe/modelSlice';
import promptReducer from '../features/documents/promptSlice';
import chatReducer from '../features/chat/chatSlice';

const rootReducer = combineReducers({
    modelUniverse: modelReducer,
    prompt: promptReducer,
    chat: chatReducer,
    // Add other reducers here
});

export default rootReducer;