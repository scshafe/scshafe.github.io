'use client';

import { useState, useEffect } from 'react';
import type { ExperienceListComponent as ExperienceListConfig } from '@/lib/content/views';
import { ExperienceList } from '@/components/about';
import { useAuthorMode } from '@/components/author/DevModeProvider';

interface Experience {
  id: string;
  frontmatter: {
    title: string; // Now represents "Role"
    company?: string;
    startDate?: string;
    endDate?: string;
    image?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
  content: string;
  htmlContent: string;
}

interface ExperienceListViewComponentProps {
  config: ExperienceListConfig['config'];
}

export function ExperienceListViewComponent({
  config,
}: ExperienceListViewComponentProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded ?? true);
  const { isAuthorMode } = useAuthorMode();

  useEffect(() => {
    async function fetchExperiences() {
      try {
        // Fetch experiences from the API
        const res = await fetch('/api/experiences');
        if (!res.ok) {
          // If API doesn't exist, try to fetch from dev server
          const devRes = await fetch('http://localhost:3001/experiences');
          if (devRes.ok) {
            const data = await devRes.json();
            // Transform the data format
            const order = data.order || [];
            const expList: Experience[] = [];

            for (const id of order) {
              if (data[id]) {
                expList.push({
                  id,
                  frontmatter: data[id],
                  content: '',
                  htmlContent: '',
                });
              }
            }

            // Apply maxItems limit
            if (config.maxItems && config.maxItems > 0) {
              setExperiences(expList.slice(0, config.maxItems));
            } else {
              setExperiences(expList);
            }
            return;
          }
          throw new Error('Failed to fetch experiences');
        }
        const data = await res.json();
        if (config.maxItems && config.maxItems > 0) {
          setExperiences(data.slice(0, config.maxItems));
        } else {
          setExperiences(data);
        }
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError('Failed to load experiences');
      } finally {
        setLoading(false);
      }
    }

    fetchExperiences();
  }, [config.maxItems]);

  // Reset expanded state when defaultExpanded changes
  useEffect(() => {
    setIsExpanded(config.defaultExpanded ?? true);
  }, [config.defaultExpanded]);

  const showHeader = config.showName && config.name;
  const isCollapsible = !isAuthorMode && config.collapsible && showHeader;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 border border-[var(--border)] rounded-md animate-pulse"
            >
              <div className="h-6 bg-[var(--background-secondary)] rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-[var(--background-secondary)] rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-md">
          <p className="text-red-400">{error}</p>
        </div>
      );
    }

    if (experiences.length === 0) {
      return (
        <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-md text-center">
          <p className="text-[var(--foreground-muted)]">No experiences yet</p>
        </div>
      );
    }

    return <ExperienceList experiences={experiences} />;
  };

  return (
    <div className="mb-6">
      {/* Header with optional name and chevron */}
      {showHeader && (
        <div
          className={`flex items-center gap-2 mb-4 ${
            isCollapsible ? 'cursor-pointer select-none' : ''
          }`}
          onClick={isCollapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          {/* Chevron for collapsible mode */}
          {isCollapsible && (
            <button
              className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Name/Header */}
          <h2 className="text-[length:var(--text-xl)] font-semibold text-[var(--foreground)]">
            {config.name}
          </h2>

          {/* Item count badge */}
          {!loading && experiences.length > 0 && (
            <span className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
              ({experiences.length})
            </span>
          )}
        </div>
      )}

      {/* Content - collapsible in publish mode */}
      {isCollapsible ? (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {renderContent()}
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
