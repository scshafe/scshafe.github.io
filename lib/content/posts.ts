import fs from 'fs';
import path from 'path';
import { processMarkdown } from './markdown';
import type { Post, PostFrontMatter, Series } from './types';

const contentDirectory = path.join(process.cwd(), 'content');
const postsDirectory = path.join(contentDirectory, 'posts');
const metadataPath = path.join(contentDirectory, 'metadata.json');

interface Metadata {
  posts: Record<string, PostFrontMatter>;
  experiences: { order: string[]; [key: string]: unknown };
  about: { title: string; description: string };
  home: { title: string; description: string };
}

function loadMetadata(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      posts: {},
      experiences: { order: [] },
      about: { title: 'About', description: '' },
      home: { title: 'Home', description: '' },
    };
  }
}

function parseCategories(categories: string | string[] | undefined): string[] {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories;
  return categories
    .split(/[,\s]+/)
    .map((cat) => cat.trim())
    .filter(Boolean);
}

function parseDate(dateStr: string): Date {
  // Handle ISO format or formats like "2023-11-30 13:00:00 -0700"
  const cleanDate = dateStr.replace(/\s+[-+]\d{4}$/, '');
  return new Date(cleanDate);
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

  const metadata = loadMetadata();
  const filenames = fs.readdirSync(postsDirectory);
  const markdownFiles = filenames.filter((name) => name.endsWith('-post.md'));

  const posts: Post[] = [];

  for (const filename of markdownFiles) {
    const slug = getSlugFromFilename(filename);
    const postMetadata = metadata.posts[slug];

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
