'use client';

/**
 * DevModeProvider - Legacy compatibility wrapper
 *
 * This module provides backwards compatibility for components that
 * still use the old useAuthorMode hook. It now reads from Redux state
 * instead of maintaining its own context.
 */

import { ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  selectIsAuthorMode,
  selectEditingContent,
  setEditingContent as setEditingContentAction,
} from '@/lib/store/slices/authorSlice';

// Legacy content types (file-based editing via EditorPanel)
type LegacyContentType = 'about' | 'experience' | 'home';

// New content types (view system editing via Redux)
type ViewContentType = 'markdown' | 'component' | 'view';

interface EditingContent {
  type: LegacyContentType | ViewContentType;
  slug?: string;
  id?: string;
  contentKey?: string;
}

// Type guard to check if content is legacy type
export function isLegacyContentType(type: string): type is LegacyContentType {
  return ['about', 'experience', 'home'].includes(type);
}

interface AuthorModeContextType {
  isAuthorMode: boolean;
  editingContent: EditingContent | null;
  setEditingContent: (content: EditingContent | null) => void;
}

/**
 * AuthorModeProvider - No longer needed as state is in Redux
 * Kept for backwards compatibility - just renders children
 */
export function AuthorModeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * useAuthorMode - Hook that reads from Redux state
 * Provides backwards compatibility for components using the old API
 */
export function useAuthorMode(): AuthorModeContextType {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const editingContent = useAppSelector(selectEditingContent);
  const dispatch = useAppDispatch();

  const setEditingContent = (content: EditingContent | null) => {
    if (content) {
      dispatch(
        setEditingContentAction({
          type: content.type as 'markdown' | 'component' | 'view',
          id: content.id || content.slug || '',
          contentKey: content.contentKey,
        })
      );
    } else {
      dispatch(setEditingContentAction(null));
    }
  };

  return {
    isAuthorMode,
    editingContent: editingContent as EditingContent | null,
    setEditingContent,
  };
}

// Legacy aliases for backwards compatibility
export const DevModeProvider = AuthorModeProvider;
export const useDevMode = useAuthorMode;
