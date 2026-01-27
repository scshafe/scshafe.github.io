'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface EditingContent {
  type: 'post' | 'about' | 'experience' | 'home';
  slug?: string;
}

interface AuthorModeContextType {
  isAuthorMode: boolean;
  editingContent: EditingContent | null;
  setEditingContent: (content: EditingContent | null) => void;
}

const AuthorModeContext = createContext<AuthorModeContextType | null>(null);

export function AuthorModeProvider({ children }: { children: ReactNode }) {
  // Author mode is enabled via environment variable
  const isAuthorMode = process.env.NEXT_PUBLIC_AUTHOR_MODE === 'true';
  const [editingContent, setEditingContentState] = useState<EditingContent | null>(null);

  const setEditingContent = useCallback((content: EditingContent | null) => {
    setEditingContentState(content);
  }, []);

  // In publish mode (not author mode), render children without any context
  if (!isAuthorMode) {
    return <>{children}</>;
  }

  return (
    <AuthorModeContext.Provider value={{ isAuthorMode, editingContent, setEditingContent }}>
      {children}
    </AuthorModeContext.Provider>
  );
}

export function useAuthorMode() {
  const context = useContext(AuthorModeContext);
  // Return safe defaults for publish mode (context will be null)
  if (!context) {
    return {
      isAuthorMode: false,
      editingContent: null,
      setEditingContent: () => {},
    };
  }
  return context;
}

// Legacy alias for backwards compatibility during migration
export const DevModeProvider = AuthorModeProvider;
export const useDevMode = useAuthorMode;
