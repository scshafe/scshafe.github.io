'use client';

import Link from 'next/link';

interface NavItem {
  id: string;
  label: string;
  url: string;
  position?: 'left' | 'right';
  icon?: string | null;
  external?: boolean;
}

interface FooterProps {
  siteName?: string;
  navItems?: NavItem[];
}

export default function Footer({ siteName = "scshafe's Blog", navItems }: FooterProps) {
  // Default footer items if none provided
  const defaultNavItems: NavItem[] = [
    { id: 'rss', label: 'RSS Feed', url: '/feed.xml', icon: 'rss', external: false },
    { id: 'github', label: 'GitHub', url: 'https://github.com/scshafe', icon: 'github', external: true },
  ];

  const items = navItems || defaultNavItems;

  const renderIcon = (icon: string | null | undefined) => {
    if (!icon) return null;

    switch (icon) {
      case 'rss':
        return (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z" />
            <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1z" />
            <path d="M3 15a2 2 0 114 0 2 2 0 01-4 0z" />
          </svg>
        );
      case 'github':
        return (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'external':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNavItem = (item: NavItem) => {
    const baseClass = 'hover:text-[var(--foreground)] transition-colors hover:no-underline inline-flex items-center gap-1.5';
    const iconElement = renderIcon(item.icon);

    if (item.external) {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClass}
        >
          {iconElement}
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.url}
        className={baseClass}
      >
        {iconElement}
        {item.label}
      </Link>
    );
  };

  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--background-secondary)] mt-auto"
      role="contentinfo"
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
          <p>&copy; {new Date().getFullYear()} {siteName}</p>
          <nav className="flex gap-6" aria-label="Footer navigation">
            {items.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
