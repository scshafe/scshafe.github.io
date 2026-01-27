'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthorMode } from '@/components/author/DevModeProvider';
import { NavigationTab } from './NavigationTab';
import { ThemeTab } from './ThemeTab';
import { ViewsTab } from './ViewsTab';
import type { NavigationConfig } from '@/lib/content/navigation';
import type { ThemeConfig, ThemeColors } from '@/lib/content/themes';
import type { ViewsConfig } from '@/lib/content/views';
import { DEFAULT_THEMES, themeToCssVars, getThemeColors } from '@/lib/content/themes';

interface SettingsPageProps {
  initialNavConfig: NavigationConfig;
  initialThemeConfig: ThemeConfig;
  initialViewsConfig: ViewsConfig;
}

type TabId = 'views' | 'navigation' | 'theme';

const tabs: { id: TabId; label: string }[] = [
  { id: 'views', label: 'Views' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'theme', label: 'Theme' },
];

export function SettingsPage({ initialNavConfig, initialThemeConfig, initialViewsConfig }: SettingsPageProps) {
  const { isAuthorMode } = useAuthorMode();
  const [activeTab, setActiveTab] = useState<TabId>('views');

  // Apply theme changes dynamically
  const handleThemeChange = useCallback((colors: ThemeColors) => {
    const cssVars = themeToCssVars(colors);
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  // Apply initial theme on mount
  useEffect(() => {
    const allThemes = [...DEFAULT_THEMES, ...initialThemeConfig.customThemes];
    const activeTheme = allThemes.find(t => t.id === initialThemeConfig.activeThemeId) || DEFAULT_THEMES[0];
    // Use system preference to determine which color scheme to use
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const scheme = initialThemeConfig.colorSchemePreference === 'system'
      ? (prefersDark ? 'dark' : 'light')
      : initialThemeConfig.colorSchemePreference;
    const colors = getThemeColors(activeTheme, scheme);
    handleThemeChange(colors);
  }, [initialThemeConfig, handleThemeChange]);

  // Show error if not in author mode
  if (!isAuthorMode) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--foreground)] mb-4">
          Settings Unavailable
        </h1>
        <p className="text-[var(--foreground-secondary)] mb-6">
          The settings page is only available in Author Mode.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors rounded-md hover:bg-[var(--background-secondary)]"
            title="Back to site"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--foreground)]">
              Settings
            </h1>
            <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
              Configure your site&apos;s navigation and appearance
            </p>
          </div>
        </div>
        <span className="text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/30">
          Author Mode
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)] mb-6">
        <nav className="flex gap-4" aria-label="Settings tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-[length:var(--text-sm)] font-medium border-b-2 -mb-px transition-colors
                ${activeTab === tab.id
                  ? 'border-[var(--link)] text-[var(--link)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pb-12">
        {activeTab === 'views' && (
          <ViewsTab initialConfig={initialViewsConfig} />
        )}
        {activeTab === 'navigation' && (
          <NavigationTab initialConfig={initialNavConfig} />
        )}
        {activeTab === 'theme' && (
          <ThemeTab
            initialConfig={initialThemeConfig}
            onThemeChange={handleThemeChange}
          />
        )}
      </div>
    </div>
  );
}
