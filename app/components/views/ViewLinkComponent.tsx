'use client';

import Link from 'next/link';
import type { ViewLinkComponent as ViewLinkConfig } from '@/lib/content/views';
import { useAppSelector } from '@/lib/store/hooks';
import { selectAllViews } from '@/lib/store/slices/viewSlice';

interface ViewLinkComponentProps {
  config: ViewLinkConfig['config'];
}

export function ViewLinkComponent({ config }: ViewLinkComponentProps) {
  // Get all views from Redux
  const views = useAppSelector(selectAllViews);

  // Resolve the target view
  const targetView = views.find(v => v.id === config.targetViewId);
  const viewPath = targetView?.path || '/';
  const viewName = targetView?.name || config.targetViewId || 'Unknown View';

  if (!config.targetViewId) {
    return (
      <div className="p-4 border border-dashed border-[var(--border)] rounded-md">
        <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
          No target view selected
        </p>
      </div>
    );
  }

  if (!targetView) {
    return (
      <div className="p-4 border border-dashed border-[var(--border)] rounded-md">
        <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
          View not found: {config.targetViewId}
        </p>
      </div>
    );
  }

  const baseClassName =
    'inline-flex items-center gap-2 text-[var(--link)] hover:text-[var(--link-hover)] transition-colors';

  if (config.displayStyle === 'button') {
    return (
      <Link
        href={viewPath}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
      >
        <span>{viewName}</span>
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
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </Link>
    );
  }

  if (config.displayStyle === 'card') {
    return (
      <Link
        href={viewPath}
        className="block p-4 border border-[var(--border)] rounded-md hover:border-[var(--link)] hover:bg-[var(--background-secondary)] transition-colors"
      >
        <h3 className="font-semibold text-[var(--foreground)]">
          {viewName}
        </h3>
        {config.showDescription && targetView.browserTitle && (
          <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] mt-1">
            {targetView.browserTitle}
          </p>
        )}
      </Link>
    );
  }

  // Default: link style
  return (
    <Link href={viewPath} className={baseClassName}>
      <span>{viewName}</span>
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
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </Link>
  );
}
