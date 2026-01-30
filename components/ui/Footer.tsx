'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  selectColorScheme,
  toggleColorScheme,
} from '@/lib/store/slices/themeSlice';
import {
  selectSiteName,
  selectFooterItems,
} from '@/lib/store/slices/navigationSlice';
import { selectAllViews } from '@/lib/store/slices/viewSlice';
import type { NavItem } from '@/lib/content/navigation';
import type { NodeId } from '@/lib/content/views';
import { asNodeId } from '@/lib/content/types';

export default function Footer() {
  const dispatch = useAppDispatch();

  // Redux state
  const siteName = useAppSelector(selectSiteName);
  const navItems = useAppSelector(selectFooterItems);
  const views = useAppSelector(selectAllViews);
  const colorScheme = useAppSelector(selectColorScheme);

  // Create a map of view root_node_ids to paths for quick lookup
  const viewPathMap = new Map<NodeId, string>();
  views.forEach((view) => {
    if (view.root_node_id) {
      viewPathMap.set(view.root_node_id, view.path);
    }
  });

  // Helper to get URL for a nav item
  const getNavItemUrl = (item: NavItem): string => {
    const linkType = item.linkType || 'url';
    if (linkType === 'view' && item.viewId) {
      return viewPathMap.get(item.viewId) || '/';
    }
    return item.url || '/';
  };

  // Default footer items if none provided
  const defaultNavItems: NavItem[] = [
    { id: asNodeId(9000000002), label: 'GitHub', linkType: 'url', url: 'https://github.com/scshafe', icon: 'github', external: true },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  const handleToggleColorScheme = useCallback(() => {
    dispatch(toggleColorScheme());
  }, [dispatch]);

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
      case 'linkedin':
        return (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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

  // Theme toggle button for footer
  const ThemeToggleButton = () => {
    return (
      <button
        onClick={handleToggleColorScheme}
        className="hover:text-[var(--foreground)] transition-colors hover:no-underline inline-flex items-center gap-1.5 cursor-pointer"
        aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {colorScheme === 'dark' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Light</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>Dark</span>
          </>
        )}
      </button>
    );
  };

  const renderNavItem = (item: NavItem) => {
    const linkType = item.linkType || 'url';

    // Handle theme toggle items
    if (linkType === 'theme') {
      return <ThemeToggleButton key={item.id} />;
    }

    const baseClass = 'hover:text-[var(--foreground)] transition-colors hover:no-underline inline-flex items-center gap-1.5';
    const iconElement = renderIcon(item.icon);
    const url = getNavItemUrl(item);

    if (linkType === 'url' && item.external) {
      return (
        <a
          key={item.id}
          href={url}
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
        href={url}
        className={baseClass}
      >
        {iconElement}
        {item.label}
      </Link>
    );
  };

  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--background-secondary)] mt-auto safe-area-bottom"
      role="contentinfo"
    >
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
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
