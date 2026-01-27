'use client';

import type { InformationComponent as InformationConfig } from '@/lib/content/views';

interface InformationComponentProps {
  config: InformationConfig['config'];
}

export function InformationComponent({ config }: InformationComponentProps) {
  const baseClassName =
    'text-[length:var(--text-lg)] text-[var(--foreground-secondary)] leading-relaxed';

  if (config.style === 'callout') {
    return (
      <div className="p-4 border-l-4 border-[var(--link)] bg-[var(--background-secondary)] rounded-r-md mb-4">
        <p className={baseClassName}>{config.content}</p>
      </div>
    );
  }

  if (config.style === 'card') {
    return (
      <div className="p-4 border border-[var(--border)] rounded-md bg-[var(--background-secondary)] mb-4">
        <p className={baseClassName}>{config.content}</p>
      </div>
    );
  }

  // Default style
  return (
    <p className={`${baseClassName} max-w-2xl mb-4`}>{config.content}</p>
  );
}
