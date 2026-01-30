'use client';

import { useState } from 'react';

interface AlertComponentProps {
  content: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
  dismissible?: boolean;
}

const variantStyles = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
};

export function AlertComponent({ content, variant = 'info', dismissible = false }: AlertComponentProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const styles = variantStyles[variant];

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-md mb-4 ${styles.bg} ${styles.border}`}
      role="alert"
    >
      <svg
        className={`w-5 h-5 flex-shrink-0 ${styles.text}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {styles.icon}
      </svg>
      <p className="flex-1 text-[var(--foreground)]">{content}</p>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-[var(--background)] rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <svg
            className="w-4 h-4 text-[var(--foreground-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
