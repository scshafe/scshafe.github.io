import type { Metadata } from 'next';
import { getPublishedPosts } from '@/lib/content/posts';
import PostCard from '@/components/posts/PostCard';

export const metadata: Metadata = {
  title: "Blog - scshafe's Blog",
  description: 'Browse posts about software engineering, embedded systems, and more.',
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div>
      <section className="mb-[var(--space-lg)]">
        <h1 className="text-[length:var(--text-3xl)] font-bold mb-4 text-[var(--foreground)]">
          Blog
        </h1>
        <p className="text-[length:var(--text-lg)] text-[var(--foreground-secondary)] leading-relaxed max-w-2xl">
          Posts about software engineering, embedded systems, and other interesting topics.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[length:var(--text-2xl)] font-bold text-[var(--foreground)]">
            Posts
          </h2>
          <span className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </span>
        </div>
        {posts.length > 0 ? (
          <div role="feed" aria-label="Blog posts">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--foreground-muted)]">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <p className="text-[length:var(--text-lg)]">No posts yet.</p>
            <p className="text-[length:var(--text-sm)] mt-1">Check back soon for new content!</p>
          </div>
        )}
      </section>
    </div>
  );
}
