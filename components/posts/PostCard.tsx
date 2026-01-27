import Link from 'next/link';
import type { Post } from '@/lib/content/types';
import CategoryTags from './CategoryTags';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const formattedDate = post.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article
      className="group border-b border-[var(--border)] py-6 last:border-b-0 transition-all hover:bg-[var(--background-secondary)]/30 -mx-4 px-4 rounded-lg"
      aria-label={`Blog post: ${post.frontMatter.title}`}
    >
      <Link href={post.url} className="block hover:no-underline focus-visible:outline-none">
        <h2 className="text-[length:var(--text-xl)] font-semibold mb-2 text-[var(--foreground)] group-hover:text-[var(--link)] group-focus-visible:text-[var(--link)] transition-colors">
          {post.frontMatter.title}
        </h2>
      </Link>
      <div className="flex flex-wrap items-center gap-3 text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
        <time dateTime={post.date.toISOString()} className="inline-flex items-center gap-1.5">
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
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formattedDate}
        </time>
        {post.frontMatter.is_series && post.frontMatter.series_title && (
          <span className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white px-2.5 py-0.5 rounded-full text-[length:var(--text-xs)] font-medium">
            <svg
              className="w-3 h-3"
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
            {post.frontMatter.series_title}
          </span>
        )}
      </div>
      {post.categories.length > 0 && (
        <div className="mt-3">
          <CategoryTags categories={post.categories} />
        </div>
      )}
    </article>
  );
}
