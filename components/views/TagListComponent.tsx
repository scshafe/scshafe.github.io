'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TagListComponent as TagListConfig } from '@/lib/content/views';

interface TagWithCount {
  tag: string;
  count: number;
}

interface TagListComponentProps {
  config: TagListConfig['config'];
}

export function TagListComponent({ config }: TagListComponentProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      if (config.sourceType === 'custom' && config.customTags) {
        setTags(config.customTags.map((tag) => ({ tag, count: 0 })));
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from dev server
        const res = await fetch('http://localhost:3001/tags');
        if (res.ok) {
          const data = await res.json();
          setTags(data.tags?.map((tag: string) => ({ tag, count: 0 })) || []);
        }
      } catch {
        // Fallback to empty
        setTags([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, [config.sourceType, config.customTags]);

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
      {tags.map(({ tag, count }) => {
        if (config.linkToFilter) {
          return (
            <Link
              key={tag}
              href={`/category/${encodeURIComponent(tag.toLowerCase())}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-secondary)] text-[var(--foreground-secondary)] text-[length:var(--text-sm)] rounded-full hover:bg-[var(--background)] hover:text-[var(--link)] transition-colors"
            >
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {tag}
              {count > 0 && (
                <span className="text-[var(--foreground-muted)]">({count})</span>
              )}
            </Link>
          );
        }

        return (
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
        );
      })}
    </div>
  );
}
