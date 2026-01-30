'use client';

import { useState, useEffect } from 'react';

interface TagWithCount {
  tag: string;
  count: number;
}

interface TagListComponentProps {
  customTags?: string[];
}

export function TagListComponent({
  customTags,
}: TagListComponentProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use custom tags directly
    if (customTags) {
      setTags(customTags.map((tag) => ({ tag, count: 0 })));
    } else {
      setTags([]);
    }
    setLoading(false);
  }, [customTags]);

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-6 w-16 bg-[var(--background-secondary)] rounded animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
        No tags available
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map(({ tag }) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-secondary)] text-[var(--foreground-secondary)] text-[length:var(--text-sm)] rounded-full"
        >
          <svg
            className="w-3 h-3 text-[var(--foreground-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          {tag}
        </span>
      ))}
    </div>
  );
}
