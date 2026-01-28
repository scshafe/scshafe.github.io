'use client';

import { useState, useEffect } from 'react';
import type { MarkdownEditorComponent as MarkdownEditorConfig, NodeId } from '@/lib/content/views';
import { useAuthorMode } from '@/app/components/author/DevModeProvider';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface MarkdownViewComponentProps {
  config: MarkdownEditorConfig['config'];
  content: string;
  viewId: NodeId;
  onSave?: (content: string) => Promise<void>;
}

export function MarkdownViewComponent({
  config,
  content: initialContent,
  viewId,
  onSave,
}: MarkdownViewComponentProps) {
  const { isAuthorMode } = useAuthorMode();
  const [content, setContent] = useState(initialContent);
  const [htmlContent, setHtmlContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Process markdown to HTML on client
  useEffect(() => {
    async function processMarkdown() {
      try {
        // Simple markdown to HTML conversion for display
        // In a real implementation, you'd use a proper markdown processor
        const html = content
          .split('\n\n')
          .map((para) => {
            if (para.startsWith('# ')) {
              return `<h1 class="text-[length:var(--text-2xl)] font-bold mb-4">${para.slice(2)}</h1>`;
            }
            if (para.startsWith('## ')) {
              return `<h2 class="text-[length:var(--text-xl)] font-semibold mb-3">${para.slice(3)}</h2>`;
            }
            if (para.startsWith('### ')) {
              return `<h3 class="text-[length:var(--text-lg)] font-medium mb-2">${para.slice(4)}</h3>`;
            }
            return `<p class="mb-4">${para}</p>`;
          })
          .join('');
        setHtmlContent(html);
      } finally {
        setLoading(false);
      }
    }
    processMarkdown();
  }, [content]);

  const handleSave = async () => {
    if (editValue === content) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      // Save via the views content endpoint
      const res = await fetch(`${DEV_EDITOR_URL}/views/${viewId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentKey: config.contentKey,
          content: editValue,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setContent(editValue);
      setIsEditing(false);

      if (onSave) {
        await onSave(editValue);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(content);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-[var(--background-secondary)] rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-[var(--background-secondary)] rounded w-full mb-4"></div>
        <div className="h-4 bg-[var(--background-secondary)] rounded w-5/6"></div>
      </div>
    );
  }

  // Non-author mode or not editing: display content
  if (!isAuthorMode || !isEditing) {
    if (!content && !isAuthorMode) {
      return null;
    }

    return (
      <div className="relative group mb-6">
        {content ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <p className="text-[var(--foreground-muted)] italic">
            {config.placeholder || 'No content yet...'}
          </p>
        )}
        {isAuthorMode && (
          <button
            onClick={() => {
              setEditValue(content);
              setIsEditing(true);
            }}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-amber-500/20 rounded-md text-amber-400 hover:bg-amber-500/30"
            title="Edit content"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Editing mode
  return (
    <div className="mb-6">
      <div className="border border-amber-500/50 rounded-md overflow-hidden">
        <div className="bg-amber-500/10 px-3 py-2 border-b border-amber-500/30 flex items-center justify-between">
          <span className="text-[length:var(--text-sm)] text-amber-400 font-medium">
            Editing Markdown
          </span>
          <span className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
            Supports GitHub Flavored Markdown
          </span>
        </div>
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full min-h-[300px] p-4 bg-[var(--background)] text-[var(--foreground)] font-mono text-[length:var(--text-sm)] resize-y focus:outline-none"
          placeholder={config.placeholder || 'Add content...'}
          disabled={saving}
        />
        <div className="bg-[var(--background-secondary)] px-3 py-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-3 py-1.5 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--background)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-[length:var(--text-sm)] bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
