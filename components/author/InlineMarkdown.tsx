'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthorMode } from './DevModeProvider';

interface InlineMarkdownProps {
  content: string;
  htmlContent: string;
  onSave: (content: string) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export function InlineMarkdown({
  content,
  htmlContent,
  onSave,
  className = '',
  placeholder = 'Click to add content...',
}: InlineMarkdownProps) {
  const { isAuthorMode } = useAuthorMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(content);
    }
  }, [content, isEditing]);

  // Focus and auto-resize textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize to fit content
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === content) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
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

  // In publish mode, just render the HTML content
  if (!isAuthorMode) {
    return (
      <div
        className={`prose ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // In edit mode
  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-amber-400">
            Editing Markdown
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] border border-[var(--border)] rounded hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-[length:var(--text-sm)] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.max(200, e.target.scrollHeight)}px`;
          }}
          className="w-full min-h-[200px] px-4 py-3 bg-[var(--background)] border border-amber-500/50 rounded-md text-[var(--foreground)] font-mono text-[length:var(--text-sm)] resize-y focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 leading-relaxed"
          spellCheck={false}
          placeholder={placeholder}
          disabled={saving}
        />
        <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
          Supports GitHub Flavored Markdown. Press Escape to cancel.
        </p>
      </div>
    );
  }

  // Display mode with edit affordance
  return (
    <div
      className={`prose ${className} cursor-pointer hover:bg-amber-500/5 rounded-lg p-2 -m-2 transition-colors group relative border border-transparent hover:border-amber-500/20`}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {htmlContent ? (
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      ) : (
        <p className="text-[var(--foreground-muted)] italic">{placeholder}</p>
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-[length:var(--text-xs)] flex items-center gap-1">
        <svg
          className="w-3 h-3"
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
        Edit
      </div>
    </div>
  );
}
