'use client';

import type { View, TitleComponent as TitleConfig } from '@/lib/content/views';

interface TitleComponentProps {
  config: TitleConfig['config'];
  view: View;
}

export function TitleComponent({ config, view }: TitleComponentProps) {
  if (!config.showTitle) {
    return null;
  }

  const HeadingTag = config.level || 'h1';
  const className =
    HeadingTag === 'h1'
      ? 'text-[length:var(--text-3xl)] font-bold mb-4 text-[var(--foreground)]'
      : HeadingTag === 'h2'
        ? 'text-[length:var(--text-2xl)] font-bold mb-3 text-[var(--foreground)]'
        : 'text-[length:var(--text-xl)] font-semibold mb-2 text-[var(--foreground)]';

  return <HeadingTag className={className}>{view.title}</HeadingTag>;
}
