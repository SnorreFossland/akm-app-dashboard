// src/app/providers/ReduxProvider.tsx
'use client';

import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

interface ReduxProviderProps {
    children: ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
    return <Provider store={store}>{children}</Provider>;
}