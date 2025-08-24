import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    currentDomainDialogOpen: boolean;
}

const initialState: UiState = {
    currentDomainDialogOpen: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        openCurrentDomainDialog(state) {
            state.currentDomainDialogOpen = true;
        },
        closeCurrentDomainDialog(state) {
            state.currentDomainDialogOpen = false;
        },
        setCurrentDomainDialogOpen(state, action: PayloadAction<boolean>) {
            state.currentDomainDialogOpen = action.payload;
        },
    },
});

export const {
    openCurrentDomainDialog,
    closeCurrentDomainDialog,
    setCurrentDomainDialogOpen,
} = uiSlice.actions;

export default uiSlice.reducer;