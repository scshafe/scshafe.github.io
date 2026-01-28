'use client';

import Link from 'next/link';

interface CategoryTagsProps {
  categories: string[];
  /** Optional counts map (lowercase tag -> count) */
  counts?: Map<string, number>;
  /** If true, clicking a tag will filter instead of navigate */
  onTagClick?: (tag: string) => void;
  /** Currently active filter tag */
  activeTag?: string | null;
  /** Size variant */
  size?: 'sm' | 'md';
}

export default function CategoryTags({
  categories,
  counts,
  onTagClick,
  activeTag,
  size = 'sm',
}: CategoryTagsProps) {
  const sizeClasses = size === 'md'
    ? 'px-3 py-1.5 text-[length:var(--text-sm)]'
    : 'px-2.5 py-1 text-[length:var(--text-xs)]';

  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <ul className="flex flex-wrap gap-2 list-none p-0" aria-label="Tags">
      {categories.map((category) => {
        const lowerCategory = category.toLowerCase();
        const count = counts?.get(lowerCategory);
        const isActive = activeTag?.toLowerCase() === lowerCategory;

        const baseClasses = `inline-flex items-center gap-1.5 rounded-md transition-colors hover:no-underline ${sizeClasses}`;
        const colorClasses = isActive
          ? 'bg-[var(--link)] text-white hover:bg-[var(--link-hover)]'
          : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)] hover:text-[var(--foreground)]';

        const content = (
          <>
            <svg
              className={iconSize}
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
            <span>{category}</span>
            {count !== undefined && (
              <span
                className={`${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground-muted)]'
                } px-1.5 py-0.5 rounded text-[length:var(--text-xs)] font-medium min-w-[1.5rem] text-center`}
              >
                {count}
              </span>
            )}
          </>
        );

        // If onTagClick is provided, render as button for filtering
        if (onTagClick) {
          return (
            <li key={category}>
              <button
                onClick={() => onTagClick(isActive ? '' : category)}
                className={`${baseClasses} ${colorClasses}`}
                aria-pressed={isActive}
                aria-label={`${isActive ? 'Remove filter' : 'Filter by'} ${category}${count ? ` (${count} posts)` : ''}`}
              >
                {content}
              </button>
            </li>
          );
        }

        // Otherwise, render as link to category page
        return (
          <li key={category}>
            <Link
              href={`/category/${lowerCategory}/`}
              className={`${baseClasses} ${colorClasses}`}
            >
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
