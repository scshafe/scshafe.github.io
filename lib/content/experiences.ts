import fs from 'fs';
import path from 'path';
import { processMarkdown } from './markdown';

const contentDirectory = path.join(process.cwd(), 'content');
const experiencesDir = path.join(contentDirectory, 'experiences');
const metadataPath = path.join(contentDirectory, 'metadata.json');

export interface ExperienceFrontmatter {
  title: string;
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface Experience {
  id: string;
  frontmatter: ExperienceFrontmatter;
  content: string;
  htmlContent: string;
}

interface Metadata {
  experiences: {
    order: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function loadMetadata(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      experiences: { order: [] },
    };
  }
}

function getSlugFromFilename(filename: string): string {
  // New format: {slug}-experience.md
  return filename.replace(/-experience\.md$/, '');
}

export async function getAllExperiences(): Promise<Experience[]> {
  if (!fs.existsSync(experiencesDir)) {
    return [];
  }

  const metadata = loadMetadata();
  const order = metadata.experiences?.order || [];

  // Get all markdown files
  const files = fs.readdirSync(experiencesDir).filter(f => f.endsWith('-experience.md'));

  const experiences: Experience[] = await Promise.all(
    files.map(async (filename) => {
      const id = getSlugFromFilename(filename);
      const expMetadata = metadata.experiences?.[id] as ExperienceFrontmatter | undefined;

      const filePath = path.join(experiencesDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const { html } = await processMarkdown(content);

      return {
        id,
        frontmatter: {
          title: expMetadata?.title || id,
          company: expMetadata?.company,
          role: expMetadata?.role,
          startDate: expMetadata?.startDate,
          endDate: expMetadata?.endDate,
          image: expMetadata?.image,
          backgroundColor: expMetadata?.backgroundColor,
          textColor: expMetadata?.textColor,
          accentColor: expMetadata?.accentColor,
        },
        content,
        htmlContent: html,
      };
    })
  );

  // Sort by order in metadata, unordered items go to the end
  const orderedExperiences = [...experiences].sort((a, b) => {
    const aIndex = order.indexOf(a.id);
    const bIndex = order.indexOf(b.id);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return orderedExperiences;
}

export async function getExperience(id: string): Promise<Experience | null> {
  const filePath = path.join(experiencesDir, `${id}-experience.md`);

  try {
    const metadata = loadMetadata();
    const expMetadata = metadata.experiences?.[id] as ExperienceFrontmatter | undefined;

    const content = fs.readFileSync(filePath, 'utf8');
    const { html } = await processMarkdown(content);

    return {
      id,
      frontmatter: {
        title: expMetadata?.title || id,
        company: expMetadata?.company,
        role: expMetadata?.role,
        startDate: expMetadata?.startDate,
        endDate: expMetadata?.endDate,
        image: expMetadata?.image,
        backgroundColor: expMetadata?.backgroundColor,
        textColor: expMetadata?.textColor,
        accentColor: expMetadata?.accentColor,
      },
      content,
      htmlContent: html,
    };
  } catch {
    return null;
  }
}

export function getExperiencesOrder(): string[] {
  const metadata = loadMetadata();
  return metadata.experiences?.order || [];
}
