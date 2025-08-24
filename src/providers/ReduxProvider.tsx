'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/store';
import AppBootstrap from './AppBootstrap';
import GlobalCurrentDomainDialog from './GlobalCurrentDomainDialog';

import type { RootState } from '@/store/store';
import { openCurrentDomainDialog } from '@/store/uiSlice';

const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <PersistGate
      loading={null}
      persistor={persistor}
      onBeforeLift={() => {
        const s = store.getState() as RootState;
        const d = s.modelUniverse?.phData?.domain;
        const hasDomain =
          !!d &&
          Boolean(
            d.name?.trim() ||
            d.description?.trim() ||
            d.presentation?.trim() ||
            d.prompt?.trim() ||
            d.additionalContext?.trim()
          );
        if (hasDomain) {
          store.dispatch(openCurrentDomainDialog());
        }
      }}
    >
      <AppBootstrap />
      <GlobalCurrentDomainDialog />
      {children}
    </PersistGate>
  </Provider>
);

export default ReduxProvider;