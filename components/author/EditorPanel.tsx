'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthorMode } from './DevModeProvider';
import { FrontmatterEditor } from './FrontmatterEditor';
import { MarkdownEditor } from './MarkdownEditor';

// Development editor server URL - runs separately from Next.js
const DEV_EDITOR_URL = 'http://localhost:3001';

export function EditorPanel() {
  const { editingContent, setEditingContent } = useAuthorMode();
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [content, setContent] = useState('');
  const [filename, setFilename] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [frontmatter, content]);

  // Fetch content when editing starts
  useEffect(() => {
    if (!editingContent) {
      // Reset state when closing
      setFrontmatter({});
      setContent('');
      setFilename('');
      setError(null);
      setHasChanges(false);
      setIsNew(false);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ type: editingContent.type });
        if (editingContent.slug) params.set('slug', editingContent.slug);

        const res = await fetch(`${DEV_EDITOR_URL}/content?${params}`);
        if (res.ok) {
          const data = await res.json();
          setFrontmatter(data.metadata || {});
          setContent(data.content || '');
          setFilename(data.filename || '');
          setIsNew(data.isNew || false);
          setHasChanges(false);
        } else {
          setError('Failed to load content. Is the dev editor server running?');
        }

        // Fetch all tags for autocomplete (for posts)
        if (editingContent.type === 'post') {
          try {
            const tagsRes = await fetch(`${DEV_EDITOR_URL}/tags`);
            if (tagsRes.ok) {
              const tagsData = await tagsRes.json();
              setAllTags(tagsData.tags || []);
            }
          } catch {
            // Tags autocomplete is optional, don't show error
          }
        }
      } catch {
        setError('Cannot connect to dev editor server. Run: npm run dev:editor');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [editingContent]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingContent) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editingContent, hasChanges]);

  // Lock body scroll when open
  useEffect(() => {
    if (editingContent) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingContent]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    setEditingContent(null);
  }, [hasChanges, setEditingContent]);

  const handleSave = async () => {
    if (!editingContent) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${DEV_EDITOR_URL}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingContent.type,
          slug: editingContent.slug,
          metadata: frontmatter,
          content,
          filename,
          isNew,
        }),
      });

      if (res.ok) {
        setHasChanges(false);
        setEditingContent(null);
        // Trigger a page refresh to see changes
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Cannot connect to dev editor server');
    } finally {
      setSaving(false);
    }
  };

  if (!editingContent) return null;

  const getTitle = () => {
    if (editingContent.type === 'about') return 'About Page';
    if (editingContent.type === 'home') return 'Home Page';
    if (editingContent.type === 'experience') {
      if (isNew) return 'New Experience';
      return (frontmatter.title as string) || editingContent.slug || 'Experience';
    }
    return editingContent.slug || 'Post';
  };
  const title = getTitle();

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-[var(--background-secondary)] shadow-2xl flex flex-col border-l border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-amber-400">
                Author Mode
              </span>
              {hasChanges && (
                <span className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                  (unsaved changes)
                </span>
              )}
            </div>
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
              Editing: {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close editor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--foreground-muted)]">Loading...</div>
            </div>
          ) : (
            <>
              <FrontmatterEditor
                frontmatter={frontmatter}
                onChange={setFrontmatter}
                contentType={editingContent.type}
                allTags={allTags}
              />
              <MarkdownEditor content={content} onChange={setContent} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
          {error && (
            <span className="text-[length:var(--text-sm)] text-red-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </span>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--background)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
