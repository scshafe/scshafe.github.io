'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import type { BlogPostComponent } from '@/lib/content/views';
import type { Post } from '@/lib/content/types';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import CategoryTags from '@/app/components/posts/CategoryTags';

interface PostOption {
  slug: string;
  title: string;
}

interface BlogPostViewComponentProps {
  config: BlogPostComponent['config'];
  onConfigUpdate?: (config: BlogPostComponent['config']) => void;
}

// Simple fuzzy match function
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

export function BlogPostViewComponent({ config, onConfigUpdate }: BlogPostViewComponentProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown state for author mode
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all posts for the dropdown
  useEffect(() => {
    async function fetchAllPosts() {
      try {
        const res = await fetch('http://localhost:3001/posts');
        if (res.ok) {
          const postsData = await res.json();
          const posts: PostOption[] = Object.entries(postsData)
            .filter(([, meta]: [string, unknown]) => {
              const m = meta as { layout?: string };
              return m.layout !== 'hidden';
            })
            .map(([slug, meta]: [string, unknown]) => {
              const m = meta as { title: string };
              return { slug, title: m.title };
            })
            .sort((a, b) => a.title.localeCompare(b.title));
          setAllPosts(posts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    }

    if (isAuthorMode) {
      fetchAllPosts();
    }
  }, [isAuthorMode]);

  // Fetch the selected post
  useEffect(() => {
    async function fetchPost() {
      if (!config.postSlug) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/posts');
        if (res.ok) {
          const postsData = await res.json();
          const postMeta = postsData[config.postSlug];

          if (postMeta) {
            const m = postMeta as {
              layout?: 'post' | 'page' | 'home' | 'hidden';
              title: string;
              date: number;
              categories?: string[];
              is_series?: boolean;
              series_title?: string;
            };

            setPost({
              slug: config.postSlug,
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
              url: `/posts/${config.postSlug}`,
              date: new Date(m.date),
              categories: m.categories || [],
            });
            setError(null);
          } else {
            setError(`Post "${config.postSlug}" not found`);
            setPost(null);
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [config.postSlug]);

  // Filter posts based on search query with fuzzy matching
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return allPosts;
    return allPosts.filter(p =>
      fuzzyMatch(p.title, searchQuery) || fuzzyMatch(p.slug, searchQuery)
    );
  }, [allPosts, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPost = (slug: string) => {
    if (onConfigUpdate) {
      onConfigUpdate({ ...config, postSlug: slug });
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Author mode: show post selector
  if (isAuthorMode && !config.postSlug) {
    return (
      <div ref={dropdownRef} className="relative">
        <div className="p-4 border border-dashed border-[var(--border)] rounded-md">
          <label className="block text-[length:var(--text-sm)] text-[var(--foreground-muted)] mb-2">
            Select a blog post
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search posts..."
              className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--link)]"
            />
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => handleSelectPost(p.slug)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--background-secondary)] transition-colors border-b border-[var(--border)] last:border-b-0"
                    >
                      <div className="font-medium text-[var(--foreground)]">{p.title}</div>
                      <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">{p.slug}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[var(--foreground-muted)]">
                    No posts found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 border border-[var(--border)] rounded-md animate-pulse">
        <div className="h-6 bg-[var(--background-secondary)] rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-4 border border-[var(--border-error,#dc2626)] rounded-md text-[var(--foreground-error,#dc2626)]">
        {error || 'Post not found'}
      </div>
    );
  }

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
      <Link
        href={post.url}
        className="block hover:no-underline focus-visible:outline-none"
      >
        <h2 className="text-[length:var(--text-xl)] font-semibold mb-2 text-[var(--foreground)] group-hover:text-[var(--link)] group-focus-visible:text-[var(--link)] transition-colors">
          {post.frontMatter.title}
        </h2>
      </Link>

      <div className="flex flex-wrap items-center gap-3 text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
        {config.showDate !== false && (
          <time
            dateTime={post.date.toISOString()}
            className="inline-flex items-center gap-1.5"
          >
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
        )}

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

      {config.showTags !== false && post.categories.length > 0 && (
        <div className="mt-3">
          <CategoryTags categories={post.categories} />
        </div>
      )}
    </article>
  );
}
