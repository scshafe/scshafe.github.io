'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthorMode } from '@/components/author/DevModeProvider';
import { useTheme } from '@/components/theme';
import { IconButton } from '@/components/ui';

interface NavItem {
  id: string;
  type?: 'NavLink'; // Type identifier
  parentId?: string; // Parent container ID
  label: string;
  url: string;
  position?: 'left' | 'right';
  icon?: string | null;
  external?: boolean;
}

interface HeaderProps {
  siteName?: string;
  navItems?: NavItem[];
}

export default function Header({ siteName = "scshafe's Blog", navItems }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthorMode } = useAuthorMode();
  const { colorScheme, toggleColorScheme } = useTheme();

  // Default nav items if none provided
  const defaultNavItems: NavItem[] = [
    { id: 'blog', label: 'Blog', url: '/blog/', position: 'right', external: false },
    { id: 'about', label: 'About', url: '/about/', position: 'right', external: false },
    { id: 'github', label: 'GitHub', url: 'https://github.com/scshafe', position: 'right', icon: 'external', external: true },
  ];

  const items = navItems || defaultNavItems;

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close menu on route change (link click) - memoized for performance
  const handleLinkClick = useCallback(() => setIsMenuOpen(false), []);

  const renderIcon = (icon: string | null | undefined) => {
    if (!icon) return null;

    switch (icon) {
      case 'external':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        );
      case 'github':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNavItem = (item: NavItem, mobile: boolean = false) => {
    const baseClass = mobile
      ? 'py-2 text-[length:var(--text-lg)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors hover:no-underline'
      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors hover:no-underline';

    const hasIcon = item.icon && renderIcon(item.icon);
    const iconClass = mobile ? 'inline-flex items-center gap-2' : 'inline-flex items-center gap-1';

    if (item.external) {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} ${hasIcon ? iconClass : ''}`}
          onClick={mobile ? handleLinkClick : undefined}
        >
          {item.label}
          {hasIcon}
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.url}
        className={`${baseClass} ${hasIcon ? iconClass : ''}`}
        onClick={mobile ? handleLinkClick : undefined}
      >
        {item.label}
        {hasIcon}
      </Link>
    );
  };

  // Theme toggle button component using accessible IconButton
  const ThemeToggle = () => (
    <IconButton
      onClick={toggleColorScheme}
      aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {colorScheme === 'dark' ? (
        // Sun icon for dark mode (clicking will switch to light)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon for light mode (clicking will switch to dark)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </IconButton>
  );

  // Settings icon component
  const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background-secondary)] sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[length:var(--text-xl)] font-bold hover:no-underline hover:text-[var(--foreground)] transition-colors"
            onClick={handleLinkClick}
          >
            {siteName}
          </Link>
          {isAuthorMode && (
            <span className="text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/30">
              Author Mode Active
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {/* Desktop Navigation */}
          <nav className="flex gap-6" aria-label="Main navigation">
            {items.map((item) => renderNavItem(item))}
          </nav>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings Button (Author Mode Only) */}
          {isAuthorMode && (
            <IconButton
              as="link"
              href="/settings/"
              aria-label="Settings (author only)"
              title="Settings"
              variant="accent"
            >
              <SettingsIcon />
            </IconButton>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-1">
          {/* Mobile Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Settings Button */}
          {isAuthorMode && (
            <IconButton
              as="link"
              href="/settings/"
              aria-label="Settings (author only)"
              title="Settings"
              variant="accent"
            >
              <SettingsIcon />
            </IconButton>
          )}

          <IconButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="-mr-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-40"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <nav
            id="mobile-menu"
            className="fixed top-[57px] left-0 right-0 bg-[var(--background-secondary)] border-b border-[var(--border)] md:hidden z-50 animate-in slide-in-from-top duration-200"
            aria-label="Mobile navigation"
          >
            <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col gap-4">
              {items.map((item) => renderNavItem(item, true))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
