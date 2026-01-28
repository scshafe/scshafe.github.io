'use client';

import type { MultiMediaComponent as MultiMediaConfig } from '@/lib/content/views';

interface MultiMediaPlaceholderProps {
  config: MultiMediaConfig['config'];
}

export function MultiMediaPlaceholder({ config }: MultiMediaPlaceholderProps) {
  // Placeholder implementation - will be enhanced later
  if (config.src) {
    if (config.mediaType === 'image') {
      return (
        <figure className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.src}
            alt={config.alt || ''}
            className="max-w-full h-auto rounded-md"
          />
          {config.caption && (
            <figcaption className="mt-2 text-[length:var(--text-sm)] text-[var(--foreground-muted)] text-center">
              {config.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    if (config.mediaType === 'video') {
      return (
        <figure className="mb-4">
          <video
            src={config.src}
            controls
            className="max-w-full h-auto rounded-md"
          >
            Your browser does not support the video tag.
          </video>
          {config.caption && (
            <figcaption className="mt-2 text-[length:var(--text-sm)] text-[var(--foreground-muted)] text-center">
              {config.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    if (config.mediaType === 'embed') {
      return (
        <div className="mb-4 aspect-video">
          <iframe
            src={config.src}
            className="w-full h-full rounded-md border-0"
            allowFullScreen
            title={config.alt || 'Embedded content'}
          />
        </div>
      );
    }
  }

  return (
    <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-md bg-[var(--background-secondary)] mb-4">
      <div className="flex flex-col items-center justify-center text-center">
        <svg
          className="w-12 h-12 text-[var(--foreground-muted)] mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
          MultiMedia Component
        </p>
        <p className="text-[var(--foreground-muted)] text-[length:var(--text-xs)] mt-1">
          Configure a source to display media
        </p>
      </div>
    </div>
  );
}
