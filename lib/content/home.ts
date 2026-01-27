import fs from 'fs';
import path from 'path';
import { processMarkdown } from './markdown';

const contentDirectory = path.join(process.cwd(), 'content');
const metadataPath = path.join(contentDirectory, 'metadata.json');

export interface HomeContent {
  title: string;
  description: string;
  content: string;
  htmlContent: string;
}

interface Metadata {
  home: { title: string; description: string };
  [key: string]: unknown;
}

function loadMetadata(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      home: { title: "scshafe's Blog", description: '' },
    };
  }
}

export async function getHomeContent(): Promise<HomeContent> {
  const metadata = loadMetadata();
  const homePath = path.join(contentDirectory, 'home.md');

  let content = '';
  try {
    content = fs.readFileSync(homePath, 'utf8');
  } catch {
    content = '';
  }

  const { html } = await processMarkdown(content);

  return {
    title: metadata.home?.title || "scshafe's Blog",
    description: metadata.home?.description || '',
    content,
    htmlContent: html,
  };
}
