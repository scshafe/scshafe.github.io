'use client';

interface TitleComponentProps {
  title: string;
  level?: 'h1' | 'h2' | 'h3';
  showTitle?: boolean;
}

export function TitleComponent({ title, level = 'h1', showTitle = true }: TitleComponentProps) {
  if (!showTitle) {
    return null;
  }

  const HeadingTag = level;
  const className =
    HeadingTag === 'h1'
      ? 'text-[length:var(--text-3xl)] font-bold mb-4 text-[var(--foreground)]'
      : HeadingTag === 'h2'
        ? 'text-[length:var(--text-2xl)] font-bold mb-3 text-[var(--foreground)]'
        : 'text-[length:var(--text-xl)] font-semibold mb-2 text-[var(--foreground)]';

  return <HeadingTag className={className}>{title}</HeadingTag>;
}
