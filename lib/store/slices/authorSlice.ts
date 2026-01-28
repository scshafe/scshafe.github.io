/**
 * Author Slice
 *
 * Manages author/dev mode state for content editing.
 * Only active in development mode when NEXT_PUBLIC_BUILD_MODE=author.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface EditingContent {
  type: 'markdown' | 'component' | 'view';
  id: string;
  contentKey?: string;
}

interface AuthorState {
  isAuthorMode: boolean;
  editingContent: EditingContent | null;
}

const initialState: AuthorState = {
  isAuthorMode: false,
  editingContent: null,
};

const authorSlice = createSlice({
  name: 'author',
  initialState,
  reducers: {
    // Initialize author mode from environment
    initializeAuthorMode: (state, action: PayloadAction<boolean>) => {
      state.isAuthorMode = action.payload;
    },

    // Set what content is being edited
    setEditingContent: (state, action: PayloadAction<EditingContent | null>) => {
      state.editingContent = action.payload;
    },

    // Start editing markdown content
    startEditingMarkdown: (
      state,
      action: PayloadAction<{ id: string; contentKey: string }>
    ) => {
      state.editingContent = {
        type: 'markdown',
        id: action.payload.id,
        contentKey: action.payload.contentKey,
      };
    },

    // Start editing a component
    startEditingComponent: (state, action: PayloadAction<string>) => {
      state.editingContent = {
        type: 'component',
        id: action.payload,
      };
    },

    // Start editing a view
    startEditingView: (state, action: PayloadAction<string>) => {
      state.editingContent = {
        type: 'view',
        id: action.payload,
      };
    },

    // Stop editing
    stopEditing: (state) => {
      state.editingContent = null;
    },
  },
});

// Export actions
export const {
  initializeAuthorMode,
  setEditingContent,
  startEditingMarkdown,
  startEditingComponent,
  startEditingView,
  stopEditing,
} = authorSlice.actions;

// Selectors
export const selectIsAuthorMode = (state: RootState) => state.author.isAuthorMode;
export const selectEditingContent = (state: RootState) => state.author.editingContent;
export const selectIsEditing = (state: RootState) => state.author.editingContent !== null;

// Check if a specific content is being edited
export const selectIsEditingContent = (
  state: RootState,
  type: EditingContent['type'],
  id: string
): boolean => {
  const editing = state.author.editingContent;
  return editing !== null && editing.type === type && editing.id === id;
};

export default authorSlice.reducer;
