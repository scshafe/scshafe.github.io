/**
 * Posts Content Utilities
 *
 * Server-side functions for loading blog posts.
 * - In development: fetches metadata from Flask API (localhost:3001)
 * - In production: reads metadata from metadata.json (generated at build time)
 * - Markdown files are always read from disk
 */

import fs from 'fs';
import path from 'path';
import { processMarkdown } from './markdown';
import type { Post, PostFrontMatter, Series } from './types';

const contentDirectory = path.join(process.cwd(), 'content');
const postsDirectory = path.join(contentDirectory, 'posts');
const metadataPath = path.join(contentDirectory, 'metadata.json');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = 'http://localhost:3001';

// New posts structure with items
interface PostItem extends PostFrontMatter {
  id: string;
  type: 'Post';
  parentId: string;
  slug: string;
}

interface PostsConfig {
  id: string;
  type: 'Posts';
  items: Record<string, PostItem>;
}

// Legacy posts structure
type LegacyPostsConfig = Record<string, PostFrontMatter>;

interface Metadata {
  posts: PostsConfig | LegacyPostsConfig;
  experiences: { order: string[]; items?: Record<string, unknown>; [key: string]: unknown };
  about: { title: string; description: string };
  home: { title: string; description: string };
}

/**
 * Load metadata from JSON file (production only)
 */
function loadMetadataFromFile(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      posts: { id: 'posts', type: 'Posts', items: {} },
      experiences: { order: [] },
      about: { title: 'About', description: '' },
      home: { title: 'Home', description: '' },
    };
  }
}

/**
 * Fetch metadata from Flask API (development only)
 */
async function fetchMetadataFromAPI(): Promise<Metadata> {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata`, {
      cache: 'no-store', // Always get fresh data in dev
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch from API, falling back to file:', error);
    // Fallback to file if API is not available
    return loadMetadataFromFile();
  }
}

/**
 * Load metadata - uses API in dev, file in production
 */
async function loadMetadata(): Promise<Metadata> {
  if (isDevelopment) {
    return fetchMetadataFromAPI();
  }
  return loadMetadataFromFile();
}

/**
 * Helper to get posts record from metadata (supports both new and legacy formats)
 */
function getPostsRecord(posts: PostsConfig | LegacyPostsConfig): Record<string, PostFrontMatter> {
  // New format has 'items' property
  if ('items' in posts && typeof posts.items === 'object') {
    const result: Record<string, PostFrontMatter> = {};
    for (const [, post] of Object.entries(posts.items)) {
      if (post.slug) {
        result[post.slug] = post;
      }
    }
    return result;
  }
  // Legacy format - posts directly keyed by slug
  return posts as LegacyPostsConfig;
}

function parseCategories(categories: string | string[] | undefined): string[] {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories;
  return categories
    .split(/[,\s]+/)
    .map((cat) => cat.trim())
    .filter(Boolean);
}

function parseDate(dateTicks: number): Date {
  // Date is stored as ticks (milliseconds since epoch)
  return new Date(dateTicks);
}

function getSlugFromFilename(filename: string): string {
  // New format: {slug}-post.md
  return filename.replace(/-post\.md$/, '');
}

function getUrlFromPost(slug: string): string {
  return `/posts/${slug}/`;
}

export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const metadata = await loadMetadata();
  const postsRecord = getPostsRecord(metadata.posts);
  const filenames = fs.readdirSync(postsDirectory);
  const markdownFiles = filenames.filter((name) => name.endsWith('-post.md'));

  const posts: Post[] = [];

  for (const filename of markdownFiles) {
    const slug = getSlugFromFilename(filename);
    const postMetadata = postsRecord[slug];

    // Skip files without metadata
    if (!postMetadata || !postMetadata.title || !postMetadata.date) {
      continue;
    }

    const filePath = path.join(postsDirectory, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const date = parseDate(postMetadata.date);
    const { html, toc } = await processMarkdown(content);

    posts.push({
      slug,
      frontMatter: postMetadata,
      content,
      htmlContent: html,
      toc,
      url: getUrlFromPost(slug),
      date,
      categories: parseCategories(postMetadata.categories),
    });
  }

  // Sort by date descending
  posts.sort((a, b) => b.date.getTime() - a.date.getTime());

  return posts;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.frontMatter.layout !== 'hidden');
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const allPosts = await getAllPosts();
  return allPosts.find((post) => post.slug === slug);
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) =>
    post.categories.map((c) => c.toLowerCase()).includes(category.toLowerCase())
  );
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getPublishedPosts();
  const categories = new Set<string>();
  posts.forEach((post) => {
    post.categories.forEach((cat) => categories.add(cat.toLowerCase()));
  });
  return Array.from(categories).sort();
}

export interface TagWithCount {
  tag: string;
  count: number;
}

export async function getTagsWithCounts(): Promise<TagWithCount[]> {
  const posts = await getPublishedPosts();
  const tagCounts = new Map<string, { original: string; count: number }>();

  posts.forEach((post) => {
    post.categories.forEach((tag) => {
      const lower = tag.toLowerCase();
      const existing = tagCounts.get(lower);
      if (existing) {
        existing.count++;
      } else {
        tagCounts.set(lower, { original: tag, count: 1 });
      }
    });
  });

  return Array.from(tagCounts.values())
    .map(({ original, count }) => ({ tag: original, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getSeriesMap(): Promise<Map<string, Series>> {
  const posts = await getAllPosts();
  const seriesMap = new Map<string, Series>();

  posts
    .filter((p) => p.frontMatter.is_series && p.frontMatter.series_title)
    .forEach((post) => {
      const seriesTitle = post.frontMatter.series_title!;
      const seriesSlug = seriesTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!seriesMap.has(seriesTitle)) {
        seriesMap.set(seriesTitle, {
          title: seriesTitle,
          slug: seriesSlug,
          posts: [],
        });
      }
      seriesMap.get(seriesTitle)!.posts.push(post);
    });

  // Sort posts within each series by date
  seriesMap.forEach((series) => {
    series.posts.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  return seriesMap;
}

export async function getPostsInSeries(seriesTitle: string): Promise<Post[]> {
  const seriesMap = await getSeriesMap();
  const series = seriesMap.get(seriesTitle);
  return series ? series.posts : [];
}
