'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAuthorMode } from './DevModeProvider';

interface InlineTextProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export function InlineText({
  value,
  onSave,
  as: Component = 'span',
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
}: InlineTextProps) {
  const { isAuthorMode } = useAuthorMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Reset to original value on error
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // In publish mode, just render the content
  if (!isAuthorMode) {
    return <Component className={className}>{value}</Component>;
  }

  // In edit mode
  if (isEditing) {
    const inputClassName =
      'w-full bg-amber-500/10 border border-amber-500/50 rounded px-2 py-1 text-inherit font-inherit focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50';

    return (
      <div className="inline-flex items-center gap-2 w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`${inputClassName} ${className} min-h-[100px] resize-y`}
            disabled={saving}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`${inputClassName} ${className}`}
            disabled={saving}
          />
        )}
        {saving && (
          <span className="text-amber-400 text-sm animate-pulse">Saving...</span>
        )}
      </div>
    );
  }

  // Display mode with edit affordance
  return (
    <Component
      className={`${className} cursor-pointer hover:bg-amber-500/10 hover:outline hover:outline-1 hover:outline-amber-500/30 rounded px-1 -mx-1 transition-colors group relative`}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value || <span className="text-[var(--foreground-muted)] italic">{placeholder}</span>}
      <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-4 h-4 text-amber-400"
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
      </span>
    </Component>
  );
}
