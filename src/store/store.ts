import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistStore, persistReducer } from 'redux-persist';
import rootReducer from './rootReducer'; // Import rootReducer

const persistConfig = {
    key: 'root',
    storage,
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