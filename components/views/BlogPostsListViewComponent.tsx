'use client';

import { useState, useEffect, useMemo } from 'react';
import type { BlogPostsListComponent as BlogPostsListConfig } from '@/lib/content/views';
import type { Post } from '@/lib/content/types';
import PostCard from '@/components/posts/PostCard';
import CategoryTags from '@/components/posts/CategoryTags';

interface TagWithCount {
  tag: string;
  count: number;
}

interface BlogPostsListViewComponentProps {
  config: BlogPostsListConfig['config'];
}

export function BlogPostsListViewComponent({
  config,
}: BlogPostsListViewComponentProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tagsWithCounts, setTagsWithCounts] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Fetch posts from the dev server
        const res = await fetch('http://localhost:3001/posts');
        if (res.ok) {
          const postsData = await res.json();

          // Transform posts data
          const postsList: Post[] = Object.entries(postsData)
            .filter(([, meta]: [string, unknown]) => {
              const m = meta as { layout?: string };
              return m.layout !== 'hidden';
            })
            .map(([slug, meta]: [string, unknown]) => {
              const m = meta as {
                layout?: 'post' | 'page' | 'home' | 'hidden';
                title: string;
                date: string;
                categories?: string[];
                is_series?: boolean;
                series_title?: string;
              };
              return {
                slug,
                frontMatter: {
                  layout: m.layout || 'post',
                  title: m.title,
                  date: m.date,
                  categories: m.categories,
                  is_series: m.is_series,
                  series_title: m.series_title,
                },
                content: '',
                htmlContent: '',
                toc: [],
                url: `/posts/${slug}`,
                date: new Date(m.date),
                categories: m.categories || [],
              };
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime());

          // Apply category filter if configured
          let filteredPosts = postsList;
          if (config.filterByCategory) {
            filteredPosts = postsList.filter((post) =>
              post.categories.some(
                (cat) =>
                  cat.toLowerCase() === config.filterByCategory?.toLowerCase()
              )
            );
          }

          // Apply maxPosts limit
          if (config.maxPosts && config.maxPosts > 0) {
            filteredPosts = filteredPosts.slice(0, config.maxPosts);
          }

          setPosts(filteredPosts);

          // Calculate tag counts
          const tagCounts = new Map<string, number>();
          postsList.forEach((post) => {
            post.categories.forEach((cat) => {
              const lower = cat.toLowerCase();
              tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
            });
          });

          const tags: TagWithCount[] = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);

          setTagsWithCounts(tags);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [config.filterByCategory, config.maxPosts]);

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
      post.categories.some(
        (cat) => cat.toLowerCase() === activeTag.toLowerCase()
      )
    );
  }, [posts, activeTag]);

  // Get all unique tags sorted by count
  const allTags = useMemo(() => {
    return tagsWithCounts.map(({ tag }) => tag);
  }, [tagsWithCounts]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag || null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-[var(--border)] rounded-md animate-pulse"
          >
            <div className="h-6 bg-[var(--background-secondary)] rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-[var(--background-secondary)] rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Tag Filter Section */}
      {config.showTags && allTags.length > 0 && (
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
          {filteredPosts.length}{' '}
          {filteredPosts.length === 1 ? 'article' : 'articles'}
          {activeTag && posts.length !== filteredPosts.length && (
            <span className="text-[var(--foreground-muted)]">
              {' '}
              of {posts.length}
            </span>
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
              <p className="text-[length:var(--text-lg)]">
                No posts with tag &quot;{activeTag}&quot;
              </p>
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
              <p className="text-[length:var(--text-sm)] mt-1">
                Check back soon for new content!
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
