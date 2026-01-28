'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getTagSuggestions } from '@/lib/utils/fuzzyMatch';

interface TagInputProps {
  /** Current list of tags */
  tags: string[];
  /** All available tags for suggestions */
  allTags: string[];
  /** Called when tags change */
  onChange: (tags: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label for accessibility */
  label?: string;
}

export function TagInput({
  tags,
  allTags,
  onChange,
  placeholder = 'Add a tag...',
  label = 'Tags',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter out already selected tags from suggestions
  const availableTags = allTags.filter(
    (tag) => !tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );

  // Update suggestions when input changes
  useEffect(() => {
    if (inputValue.trim()) {
      const matches = getTagSuggestions(inputValue, availableTags, 5);
      setSuggestions(matches);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, availableTags]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;

      // Check if tag already exists (case-insensitive)
      if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        setInputValue('');
        setSuggestions([]);
        return;
      }

      onChange([...tags, trimmed]);
      setInputValue('');
      setSuggestions([]);
      inputRef.current?.focus();
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((t) => t !== tagToRemove));
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div className="relative">
      <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-2">
        {label}
      </label>

      {/* Tags and input container */}
      <div
        className={`
          flex flex-wrap gap-2 p-2 bg-[var(--background)] border rounded-md
          transition-colors min-h-[42px]
          ${isFocused ? 'border-[var(--link)]' : 'border-[var(--border)]'}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing tags */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-[var(--background-secondary)] text-[var(--foreground-secondary)] px-2 py-0.5 rounded text-[length:var(--text-sm)]"
          >
            <svg
              className="w-3 h-3 text-[var(--foreground-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="p-0.5 hover:bg-[var(--border)] rounded transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setIsFocused(false), 150);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-[var(--foreground)] text-[length:var(--text-sm)] outline-none placeholder:text-[var(--foreground-muted)]"
          aria-label="Add new tag"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="tag-suggestions"
          role="combobox"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul
          ref={listRef}
          id="tag-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md shadow-lg max-h-48 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              role="option"
              aria-selected={index === selectedIndex}
              className={`
                px-3 py-2 cursor-pointer text-[length:var(--text-sm)] flex items-center gap-2
                ${
                  index === selectedIndex
                    ? 'bg-[var(--link)] text-white'
                    : 'text-[var(--foreground)] hover:bg-[var(--background)]'
                }
              `}
              onClick={() => addTag(suggestion)}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {suggestion}
            </li>
          ))}
          {inputValue.trim() &&
            !suggestions.some(
              (s) => s.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <li
                role="option"
                aria-selected={selectedIndex === suggestions.length}
                className={`
                  px-3 py-2 cursor-pointer text-[length:var(--text-sm)] flex items-center gap-2 border-t border-[var(--border)]
                  ${
                    selectedIndex === suggestions.length
                      ? 'bg-[var(--link)] text-white'
                      : 'text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                  }
                `}
                onClick={() => addTag(inputValue)}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create &quot;{inputValue.trim()}&quot;
              </li>
            )}
        </ul>
      )}

      <p className="mt-1 text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
        Press Enter to add, Backspace to remove last tag
      </p>
    </div>
  );
}
