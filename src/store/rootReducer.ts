import { combineReducers } from '@reduxjs/toolkit';
import modelReducer from '@/features/model-universe/modelSlice';
import chatReducer from '@/features/chat/chatSlice';
import uiReducer from './uiSlice';

const rootReducer = combineReducers({
    modelUniverse: modelReducer,
    chat: chatReducer,
    ui: uiReducer,
});

export default rootReducer;