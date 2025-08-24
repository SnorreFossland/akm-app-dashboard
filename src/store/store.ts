import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistStore, persistReducer } from 'redux-persist';
import rootReducer from './rootReducer'; // Import rootReducer

const persistConfig = {
    key: 'root',
    storage,
    blacklist: ['ui'], // ensure dialog open/close doesn’t persist
    migrate: (state: any) => {
        // Handle migration from old state structure
        if (state && state.documents) {
            // Move documents from old location to new location
            if (!state.modelUniverse) {
                state.modelUniverse = {
                    phData: {
                        metis: { name: '', description: '', models: [], metamodels: [] },
                        domain: { name: '', description: '', prompt: '', presentation: '', additionalContext: '' },
                        ontology: { name: '', description: '', presentation: '', concepts: [], relationships: [] },
                        documents: []
                    },
                    phFocus: { focusModel: { id: '', name: '' }, focusModelview: { id: '', name: '' } },
                    phUser: { id: '', name: '', email: '' },
                    phSource: '',
                    status: 'idle',
                    error: null
                };
            }

            // Migrate documents to new location
            if (state.documents && Array.isArray(state.documents)) {
                state.modelUniverse.phData.documents = state.documents;
            } else if (state.documents && state.documents.documents) {
                state.modelUniverse.phData.documents = state.documents.documents;
            }

            // Remove old documents key
            delete state.documents;

            // Also remove old markdown key if it exists
            if (state.markdown) {
                if (state.markdown.documents) {
                    state.modelUniverse.phData.documents = state.markdown.documents;
                }
                delete state.markdown;
            }
        }

        return Promise.resolve(state);
    },
    version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // Disable the middleware that's causing performance issues in development
            immutableCheck: process.env.NODE_ENV === 'production' ? true : false,
            serializableCheck: process.env.NODE_ENV === 'production' ? true : {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                // Increase the warning threshold or disable warnings
                warnAfter: 128, // Increase from default 32ms to 128ms
            },
        }),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;