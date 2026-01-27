import fs from 'fs';
import path from 'path';
import { processMarkdown } from './markdown';

const contentDirectory = path.join(process.cwd(), 'content');
const metadataPath = path.join(contentDirectory, 'metadata.json');

export interface AboutContent {
  title: string;
  description: string;
  content: string;
  htmlContent: string;
}

interface Metadata {
  about: { title: string; description: string };
  [key: string]: unknown;
}

function loadMetadata(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      about: { title: 'About', description: '' },
    };
  }
}

export async function getAboutContent(): Promise<AboutContent> {
  const metadata = loadMetadata();
  const aboutPath = path.join(contentDirectory, 'about.md');

  let content = '';
  try {
    content = fs.readFileSync(aboutPath, 'utf8');
  } catch {
    content = '';
  }

  const { html } = await processMarkdown(content);

  return {
    title: metadata.about?.title || 'About',
    description: metadata.about?.description || '',
    content,
    htmlContent: html,
  };
}
