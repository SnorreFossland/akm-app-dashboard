import { combineReducers } from '@reduxjs/toolkit';
import modelReducer from '@/features/model-universe/modelSlice';
import chatReducer from '@/features/chat/chatSlice';
import domainChatReducer from '@/features/domainChat/domainChatSlice';
import uiReducer from './uiSlice';

const rootReducer = combineReducers({
    modelUniverse: modelReducer,
    chat: chatReducer,
    domainChat: domainChatReducer,
    ui: uiReducer,
});

export default rootReducer;
