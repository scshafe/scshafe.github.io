import Link from 'next/link';
import type { Post } from '@/lib/content/types';

interface SeriesBannerProps {
  currentPost: Post;
  seriesPosts: Post[];
}

export default function SeriesBanner({ currentPost, seriesPosts }: SeriesBannerProps) {
  const currentIndex = seriesPosts.findIndex((p) => p.slug === currentPost.slug);
  const prevPost = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null;

  return (
    <aside
      className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-5 mb-8"
      aria-label="Series navigation"
    >
      <div className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--foreground-muted)] mb-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span>
          Part {currentIndex + 1} of {seriesPosts.length} in series
        </span>
      </div>
      <h3 className="font-semibold text-[length:var(--text-lg)] text-[var(--accent)] mb-4">
        {currentPost.frontMatter.series_title}
      </h3>
      <nav className="flex flex-col sm:flex-row gap-3 text-[length:var(--text-sm)]" aria-label="Series posts">
        {prevPost && (
          <Link
            href={prevPost.url}
            className="flex-1 group flex items-center gap-2 p-3 bg-[var(--background)] rounded-md border border-[var(--border)] hover:border-[var(--link)] transition-colors hover:no-underline"
          >
            <svg
              className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--link)] transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="min-w-0">
              <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mb-0.5">Previous</div>
              <div className="text-[var(--foreground)] group-hover:text-[var(--link)] transition-colors truncate">
                {prevPost.frontMatter.title}
              </div>
            </div>
          </Link>
        )}
        {nextPost && (
          <Link
            href={nextPost.url}
            className="flex-1 group flex items-center justify-end gap-2 p-3 bg-[var(--background)] rounded-md border border-[var(--border)] hover:border-[var(--link)] transition-colors hover:no-underline text-right"
          >
            <div className="min-w-0">
              <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mb-0.5">Next</div>
              <div className="text-[var(--foreground)] group-hover:text-[var(--link)] transition-colors truncate">
                {nextPost.frontMatter.title}
              </div>
            </div>
            <svg
              className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--link)] transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </nav>
    </aside>
  );
}
