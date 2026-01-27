import { Feed } from 'feed';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content', 'posts');
const publicDirectory = path.join(process.cwd(), 'public');

function parseCategories(categories) {
  if (!categories) return [];
  return categories
    .split(/[,\s]+/)
    .map((cat) => cat.trim())
    .filter(Boolean);
}

function parseDate(dateStr) {
  const cleanDate = dateStr.replace(/\s+[-+]\d{4}$/, '');
  return new Date(cleanDate);
}

function getSlugFromFilename(filename) {
  return filename
    .replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
    .replace(/\.(md|markdown)$/, '');
}

function getUrlFromPost(date, slug) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `/${year}/${month}/${day}/${slug}/`;
}

async function generateFeed() {
  const siteUrl = 'https://scshafe.github.io';

  const feed = new Feed({
    title: "scshafe's Blog",
    description: 'A blog about Linux, embedded systems, and software engineering.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, scshafe`,
    author: {
      name: 'Cole',
      email: 'scshafe@umich.edu',
      link: 'https://github.com/scshafe',
    },
  });

  if (!fs.existsSync(postsDirectory)) {
    console.log('No posts directory found');
    return;
  }

  const filenames = fs.readdirSync(postsDirectory);
  const markdownFiles = filenames.filter(
    (name) => name.endsWith('.md') || name.endsWith('.markdown')
  );

  const posts = [];

  for (const filename of markdownFiles) {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    if (!data.title || !data.date) continue;
    if (data.layout === 'hidden') continue;

    const slug = getSlugFromFilename(filename);
    const date = parseDate(data.date);

    posts.push({
      slug,
      title: data.title,
      date,
      content: content.slice(0, 200) + '...',
      url: data.permalink || getUrlFromPost(date, slug),
    });
  }

  posts.sort((a, b) => b.date.getTime() - a.date.getTime());

  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${siteUrl}${post.url}`,
      link: `${siteUrl}${post.url}`,
      description: post.content,
      date: post.date,
      author: [
        {
          name: 'Cole',
          email: 'scshafe@umich.edu',
        },
      ],
    });
  });

  fs.writeFileSync(path.join(publicDirectory, 'feed.xml'), feed.rss2());
  console.log('RSS feed generated at public/feed.xml');
}

generateFeed();
