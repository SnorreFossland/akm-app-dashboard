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
                        domain: {
                            name: '',
                            description: '',
                            prompt: '',
                            presentation: '',
                            additionalContext: '',
                            ontology: { name: '', description: '', concepts: [], relationships: [] }
                        },
                        documents: [],
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

        // Migrate old ontology location (top-level under phData) to domain.ontology
        try {
            const mu = state?.modelUniverse;
            if (mu?.phData) {
                const phData = mu.phData;
                // Ensure domain exists
                if (!phData.domain) {
                    phData.domain = {
                        name: '',
                        description: '',
                        prompt: '',
                        presentation: '',
                        additionalContext: '',
                        ontology: { name: '', description: '', concepts: [], relationships: [] }
                    };
                }

                // If domain was accidentally set to a string earlier, coerce to object
                if (typeof phData.domain === 'string') {
                    phData.domain = {
                        name: '',
                        description: '',
                        prompt: '',
                        presentation: phData.domain,
                        additionalContext: '',
                        ontology: { name: '', description: '', concepts: [], relationships: [] }
                    } as any;
                }

                // Remove any stray numeric keys (artifact of spreading a string into an object)
                if (phData.domain && typeof phData.domain === 'object') {
                    Object.keys(phData.domain)
                        .filter((k) => /^\d+$/.test(k))
                        .forEach((k) => { delete (phData.domain as any)[k]; });
                }

                // If old location exists, move and strip presentation
                if (phData.ontology) {
                    const { presentation, ...rest } = phData.ontology;
                    phData.domain.ontology = {
                        name: rest.name || '',
                        description: rest.description || '',
                        concepts: Array.isArray(rest.concepts) ? rest.concepts : [],
                        relationships: Array.isArray(rest.relationships) ? rest.relationships : [],
                    };
                    delete phData.ontology;
                }

                // If new location contains stray presentation, remove it
                if (phData.domain.ontology && 'presentation' in phData.domain.ontology) {
                    const { presentation: _p, ...restOnt } = phData.domain.ontology as any;
                    phData.domain.ontology = restOnt;
                }
            }
        } catch (e) {
            console.warn('Migration for ontology nesting failed:', e);
        }

        return Promise.resolve(state);
    },
    version: 2,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // Keep immutable check disabled in development to avoid extra cost there.
            immutableCheck: process.env.NODE_ENV === 'production' ? true : false,

            // Tune serializable state invariant middleware:
            // - keep it enabled (helps catch bugs), but ignore heavy branches
            // - increase the warn threshold to reduce noisy warnings for occasional long scans
            serializableCheck: process.env.NODE_ENV === 'production'
                ? true
                : {
                    // persist actions are already noisy and safe to ignore
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],

                    // Ignore deep, frequently-large state branches that cause long scan times.
                    // Adjust these paths to match your state shape if needed.
                    ignoredPaths: [
                        'modelUniverse.phData.documents',          // document library (large blobs)
                        'modelUniverse.phData.metis',             // whole metis object (models, metamodels)
                        'modelUniverse.phData.metis.models',      // models array (may be large)
                        'modelUniverse.phData.metis.metamodels', // metamodels array
                        'modelUniverse.phData.rawBlob',          // example: any raw large blob you store
                    ],

                    // Increase warning threshold in ms to avoid false positives during dev.
                    // If you still see warnings, raise this (e.g., 500) or refine ignoredPaths.
                    warnAfter: 250,
                },
        }),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
