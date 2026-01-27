import { Feed } from 'feed';
import { getPublishedPosts } from './content/posts';

export async function generateRssFeed(): Promise<string> {
  const posts = await getPublishedPosts();
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

  posts.forEach((post) => {
    feed.addItem({
      title: post.frontMatter.title,
      id: `${siteUrl}${post.url}`,
      link: `${siteUrl}${post.url}`,
      description: post.content.slice(0, 200) + '...',
      date: post.date,
      author: [
        {
          name: 'Cole',
          email: 'scshafe@umich.edu',
        },
      ],
    });
  });

  return feed.rss2();
}
