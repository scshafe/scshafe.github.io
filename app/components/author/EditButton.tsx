'use client';

import { useAuthorMode } from './DevModeProvider';

interface EditButtonProps {
  contentType: 'post' | 'about' | 'experience' | 'home';
  slug?: string;
}

export function EditButton({ contentType, slug }: EditButtonProps) {
  const { isAuthorMode, setEditingContent } = useAuthorMode();

  if (!isAuthorMode) return null;

  return (
    <button
      onClick={() => setEditingContent({ type: contentType, slug })}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[length:var(--text-xs)] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md hover:bg-amber-500/30 hover:text-amber-200 transition-colors ml-3"
      aria-label={`Edit ${contentType === 'about' ? 'about page' : contentType === 'home' ? 'home page' : slug}`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Edit
    </button>
  );
}
