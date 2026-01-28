'use client';

import { useState } from 'react';
import { InlineText, InlineMarkdown, useAuthorMode } from '@/app/components/author';
import CategoryTags from '@/app/components/posts/CategoryTags';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface EditablePostPageProps {
  slug: string;
  initialTitle: string;
  initialDate: number;
  initialDateFormatted: string;
  initialCategories: string[];
  initialContent: string;
  initialHtmlContent: string;
  initialToc: boolean;
  initialIsSeries: boolean;
  initialSeriesTitle?: string;
  initialLayout: string;
}

export function EditablePostPage({
  slug,
  initialTitle,
  initialDate,
  initialDateFormatted,
  initialCategories,
  initialContent,
  initialHtmlContent,
  initialToc,
  initialIsSeries,
  initialSeriesTitle,
  initialLayout,
}: EditablePostPageProps) {
  const { isAuthorMode } = useAuthorMode();
  const [title, setTitle] = useState(initialTitle);
  const [categories, setCategories] = useState(initialCategories);
  const [content, setContent] = useState(initialContent);
  const [date] = useState(initialDate);
  const [toc] = useState(initialToc);
  const [isSeries] = useState(initialIsSeries);
  const [seriesTitle] = useState(initialSeriesTitle);
  const [layout] = useState(initialLayout);

  const saveField = async (field: string, value: string | string[]) => {
    // Update local state first
    if (field === 'title') setTitle(value as string);
    if (field === 'categories') setCategories(value as string[]);
    if (field === 'content') setContent(value as string);

    // Build metadata object
    const metadata: Record<string, unknown> = {
      title: field === 'title' ? value : title,
      date,
      categories: field === 'categories' ? value : categories,
      layout,
      toc,
    };

    if (isSeries && seriesTitle) {
      metadata.is_series = isSeries;
      metadata.series_title = seriesTitle;
    }

    // Save to server
    const res = await fetch(`${DEV_EDITOR_URL}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'post',
        slug,
        metadata,
        content: field === 'content' ? value : content,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to save');
    }

    // If content changed, reload to get fresh HTML
    if (field === 'content') {
      window.location.reload();
    }
  };

  const handleCategoriesChange = async (newCategoriesStr: string) => {
    const newCategories = newCategoriesStr
      .split(/[,\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    await saveField('categories', newCategories);
  };

  return (
    <article>
      <header className="mb-[var(--space-lg)]">
        <div className="mb-4">
          <InlineText
            value={title}
            onSave={(value) => saveField('title', value)}
            as="h1"
            className="text-[length:var(--text-3xl)] font-bold text-[var(--foreground)] leading-tight"
            placeholder="Post Title"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
          <time className="inline-flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {initialDateFormatted}
          </time>
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--border)]">|</span>
              {isAuthorMode ? (
                <InlineText
                  value={categories.join(', ')}
                  onSave={handleCategoriesChange}
                  as="span"
                  className="text-[length:var(--text-sm)]"
                  placeholder="category1, category2"
                />
              ) : (
                <CategoryTags categories={categories} />
              )}
            </div>
          )}
          {isAuthorMode && categories.length === 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--border)]">|</span>
              <InlineText
                value=""
                onSave={handleCategoriesChange}
                as="span"
                className="text-[length:var(--text-sm)]"
                placeholder="Add categories..."
              />
            </div>
          )}
        </div>
      </header>

      <InlineMarkdown
        content={content}
        htmlContent={initialHtmlContent}
        onSave={(value) => saveField('content', value)}
        placeholder="Write your post content..."
      />
    </article>
  );
}
