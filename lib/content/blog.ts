import fs from 'fs';
import path from 'path';

const contentDirectory = path.join(process.cwd(), 'content');
const metadataPath = path.join(contentDirectory, 'metadata.json');

export interface BlogPageContent {
  title: string;
  description: string;
}

interface Metadata {
  blog: { title: string; description: string };
  [key: string]: unknown;
}

function loadMetadata(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      blog: { title: 'Blog', description: '' },
    };
  }
}

export async function getBlogPageContent(): Promise<BlogPageContent> {
  const metadata = loadMetadata();

  return {
    title: metadata.blog?.title || 'Blog',
    description: metadata.blog?.description || '',
  };
}
