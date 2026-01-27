'use client';

import { useState } from 'react';
import Image from 'next/image';
import { InlineText, InlineMarkdown, useAuthorMode } from '@/components/author';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface ExperienceCardProps {
  id: string;
  title: string; // Now represents "Role"
  company?: string;
  startDate?: string;
  endDate?: string;
  image?: string;
  content: string;
  htmlContent: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function ExperienceCard({
  id,
  title: initialTitle, // Now represents "Role"
  company: initialCompany,
  startDate: initialStartDate,
  endDate: initialEndDate,
  image,
  content: initialContent,
  htmlContent: initialHtmlContent,
  backgroundColor,
  textColor,
  accentColor,
  isDragging,
  dragHandleProps,
}: ExperienceCardProps) {
  const { isAuthorMode } = useAuthorMode();
  const [title, setTitle] = useState(initialTitle); // Now represents "Role"
  const [company, setCompany] = useState(initialCompany || '');
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [content, setContent] = useState(initialContent);

  const dateRange = startDate
    ? endDate
      ? `${startDate} - ${endDate}`
      : `${startDate} - Present`
    : null;

  const cardStyle: React.CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
    ...(textColor && { color: textColor }),
    ...(accentColor && { borderLeftColor: accentColor }),
  };

  const saveField = async (field: string, value: string) => {
    // Update local state
    if (field === 'title') setTitle(value);
    if (field === 'company') setCompany(value);
    if (field === 'startDate') setStartDate(value);
    if (field === 'endDate') setEndDate(value);
    if (field === 'content') setContent(value);

    // Build metadata
    const metadata = {
      title: field === 'title' ? value : title,
      company: field === 'company' ? value : company,
      startDate: field === 'startDate' ? value : startDate,
      endDate: field === 'endDate' ? value : endDate,
      image,
      backgroundColor,
      textColor,
      accentColor,
    };

    // Save to server
    const res = await fetch(`${DEV_EDITOR_URL}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'experience',
        slug: id,
        metadata,
        content: field === 'content' ? value : content,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to save');
    }

    // Reload if content changed to get fresh HTML
    if (field === 'content') {
      window.location.reload();
    }
  };

  return (
    <div
      className={`
        relative rounded-lg border border-[var(--border)] overflow-hidden
        transition-shadow duration-200
        ${isDragging ? 'shadow-lg ring-2 ring-[var(--link)] opacity-90' : 'hover:shadow-md'}
        ${accentColor ? 'border-l-4' : ''}
      `}
      style={cardStyle}
    >
      <div className="flex">
        {/* Image Section */}
        {image && (
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 relative">
            <Image
              src={image}
              alt={`${title} logo`}
              fill
              className="object-contain p-2"
            />
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                {dragHandleProps && (
                  <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] touch-none"
                    title="Drag to reorder"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                )}
                {isAuthorMode ? (
                  <InlineText
                    value={title}
                    onSave={(value) => saveField('title', value)}
                    as="h3"
                    className="text-[length:var(--text-lg)] font-semibold"
                    placeholder="Role"
                  />
                ) : (
                  <h3 className="text-[length:var(--text-lg)] font-semibold" style={textColor ? { color: textColor } : undefined}>
                    {title}
                  </h3>
                )}
              </div>

              {/* Company - inline editable */}
              {isAuthorMode ? (
                <div className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] mt-0.5">
                  <InlineText
                    value={company}
                    onSave={(value) => saveField('company', value)}
                    as="span"
                    className="font-medium"
                    placeholder="Company"
                  />
                </div>
              ) : (
                company && (
                  <p className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] mt-0.5" style={textColor ? { color: textColor, opacity: 0.8 } : undefined}>
                    <span className="font-medium">{company}</span>
                  </p>
                )
              )}

              {/* Dates - inline editable */}
              {isAuthorMode ? (
                <div className="flex items-center gap-1 text-[length:var(--text-xs)] text-[var(--foreground-muted)] mt-1 flex-wrap">
                  <InlineText
                    value={startDate}
                    onSave={(value) => saveField('startDate', value)}
                    as="span"
                    placeholder="Start date"
                  />
                  <span> - </span>
                  <InlineText
                    value={endDate}
                    onSave={(value) => saveField('endDate', value)}
                    as="span"
                    placeholder="Present"
                  />
                </div>
              ) : (
                dateRange && (
                  <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mt-1" style={textColor ? { color: textColor, opacity: 0.6 } : undefined}>
                    {dateRange}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Description - inline editable markdown */}
          <div className="mt-3">
            {isAuthorMode ? (
              <InlineMarkdown
                content={content}
                htmlContent={initialHtmlContent}
                onSave={(value) => saveField('content', value)}
                className="prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0"
                placeholder="Add description..."
              />
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0"
                style={textColor ? { color: textColor } : undefined}
                dangerouslySetInnerHTML={{ __html: initialHtmlContent }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
