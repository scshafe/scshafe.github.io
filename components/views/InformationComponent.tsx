'use client';

interface InformationComponentProps {
  content: string;
  style?: 'default' | 'callout' | 'card';
}

export function InformationComponent({ content, style = 'default' }: InformationComponentProps) {
  const baseClassName =
    'text-[length:var(--text-lg)] text-[var(--foreground-secondary)] leading-relaxed';

  if (style === 'callout') {
    return (
      <div className="p-4 border-l-4 border-[var(--link)] bg-[var(--background-secondary)] rounded-r-md mb-4">
        <p className={baseClassName}>{content}</p>
      </div>
    );
  }

  if (style === 'card') {
    return (
      <div className="p-4 border border-[var(--border)] rounded-md bg-[var(--background-secondary)] mb-4">
        <p className={baseClassName}>{content}</p>
      </div>
    );
  }

  // Default style
  return (
    <p className={`${baseClassName} max-w-2xl mb-4`}>{content}</p>
  );
}
