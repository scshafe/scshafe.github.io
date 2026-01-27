'use client';

import { useState, useMemo } from 'react';
import type { Post } from '@/lib/content/types';
import PostCard from '@/components/posts/PostCard';
import CategoryTags from '@/components/posts/CategoryTags';

interface BlogPostsListProps {
  posts: Post[];
  tagsWithCounts: { tag: string; count: number }[];
}

export function BlogPostsList({ posts, tagsWithCounts }: BlogPostsListProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Create counts map for CategoryTags
  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    tagsWithCounts.forEach(({ tag, count }) => {
      map.set(tag.toLowerCase(), count);
    });
    return map;
  }, [tagsWithCounts]);

  // Filter posts by active tag
  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts;
    return posts.filter((post) =>
      post.categories.some((cat) => cat.toLowerCase() === activeTag.toLowerCase())
    );
  }, [posts, activeTag]);

  // Get all unique tags sorted by count
  const allTags = useMemo(() => {
    return tagsWithCounts.map(({ tag }) => tag);
  }, [tagsWithCounts]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag || null);
  };

  return (
    <>
      {/* Tag Filter Section */}
      {allTags.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-[length:var(--text-sm)] font-medium text-[var(--foreground-muted)]">
              Filter by tag:
            </h3>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="text-[length:var(--text-xs)] text-[var(--link)] hover:text-[var(--link-hover)] transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
          <CategoryTags
            categories={allTags}
            counts={countsMap}
            onTagClick={handleTagClick}
            activeTag={activeTag}
            size="md"
          />
        </section>
      )}

      {/* Posts Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[length:var(--text-2xl)] font-bold text-[var(--foreground)]">
          {activeTag ? `Posts tagged "${activeTag}"` : 'Posts'}
        </h2>
        <span className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
          {activeTag && posts.length !== filteredPosts.length && (
            <span className="text-[var(--foreground-muted)]"> of {posts.length}</span>
          )}
        </span>
      </div>

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div role="feed" aria-label="Blog posts">
          {filteredPosts.map((post) => (
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
          {activeTag ? (
            <>
              <p className="text-[length:var(--text-lg)]">No posts with tag &quot;{activeTag}&quot;</p>
              <button
                onClick={() => setActiveTag(null)}
                className="text-[length:var(--text-sm)] text-[var(--link)] hover:text-[var(--link-hover)] mt-2 transition-colors"
              >
                Clear filter to see all posts
              </button>
            </>
          ) : (
            <>
              <p className="text-[length:var(--text-lg)]">No posts yet.</p>
              <p className="text-[length:var(--text-sm)] mt-1">Check back soon for new content!</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
