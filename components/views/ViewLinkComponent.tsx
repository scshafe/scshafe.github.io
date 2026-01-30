'use client';

import Link from 'next/link';
import type { NodeId } from '@/lib/content/types';
import { useAppSelector } from '@/lib/store/hooks';
import { selectAllViews } from '@/lib/store/slices/viewSlice';

interface ViewLinkComponentProps {
  label?: string;
  targetNodeId?: NodeId;
  targetUrl?: string;
  displayStyle?: 'link' | 'card' | 'button';
  icon?: string;
  showDescription?: boolean;
}

export function ViewLinkComponent({
  label,
  targetNodeId,
  targetUrl,
  displayStyle = 'link',
  icon,
  showDescription = false,
}: ViewLinkComponentProps) {
  // Get all views from Redux
  const views = useAppSelector(selectAllViews);

  // Resolve the target view by root_node_id
  const targetView = targetNodeId
    ? views.find(v => v.root_node_id === targetNodeId)
    : undefined;

  // Use target URL if provided, otherwise use view path
  const viewPath = targetUrl || targetView?.path || '/';
  const viewName = label || targetView?.name || 'Unknown View';

  if (!targetNodeId && !targetUrl) {
    return (
      <div className="p-4 border border-dashed border-[var(--border)] rounded-md">
        <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
          No target view or URL selected
        </p>
      </div>
    );
  }

  if (targetNodeId && !targetView && !targetUrl) {
    return (
      <div className="p-4 border border-dashed border-[var(--border)] rounded-md">
        <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
          View not found: {targetNodeId}
        </p>
      </div>
    );
  }

  const baseClassName =
    'inline-flex items-center gap-2 text-[var(--link)] hover:text-[var(--link-hover)] transition-colors';

  if (displayStyle === 'button') {
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

  if (displayStyle === 'card') {
    return (
      <Link
        href={viewPath}
        className="block p-4 border border-[var(--border)] rounded-md hover:border-[var(--link)] hover:bg-[var(--background-secondary)] transition-colors"
      >
        <h3 className="font-semibold text-[var(--foreground)]">
          {viewName}
        </h3>
        {showDescription && targetView?.browser_title && (
          <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] mt-1">
            {targetView.browser_title}
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
