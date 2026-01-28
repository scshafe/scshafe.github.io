import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPosts, getPostsInSeries } from '@/lib/content/posts';
import TableOfContents from '@/app/components/posts/TableOfContents';
import SeriesBanner from '@/app/components/posts/SeriesBanner';
import { EditablePostPage } from '@/app/components/pages';

// Allow empty params array when there are no posts
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const posts = await getAllPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch {
    return [];
  }
}

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const posts = await getAllPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: `${post.frontMatter.title} - scshafe's Blog`,
    description: `${post.frontMatter.title} - A post about ${post.categories.join(', ') || 'various topics'}`,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const posts = await getAllPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const formattedDate = post.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let seriesPosts: typeof posts = [];
  if (post.frontMatter.is_series && post.frontMatter.series_title) {
    seriesPosts = await getPostsInSeries(post.frontMatter.series_title);
  }

  const showToc = post.frontMatter.toc && post.toc.length > 0;

  return (
    <div className={showToc ? 'lg:grid lg:grid-cols-[1fr_250px] lg:gap-12' : ''}>
      <div>
        {seriesPosts.length > 1 && (
          <SeriesBanner currentPost={post} seriesPosts={seriesPosts} />
        )}

        <EditablePostPage
          slug={post.slug}
          initialTitle={post.frontMatter.title}
          initialDate={post.frontMatter.date}
          initialDateFormatted={formattedDate}
          initialCategories={post.categories}
          initialContent={post.content}
          initialHtmlContent={post.htmlContent}
          initialToc={post.frontMatter.toc || false}
          initialIsSeries={post.frontMatter.is_series || false}
          initialSeriesTitle={post.frontMatter.series_title}
          initialLayout={post.frontMatter.layout}
        />

        {seriesPosts.length > 1 && (
          <div className="mt-[var(--space-xl)]">
            <SeriesBanner currentPost={post} seriesPosts={seriesPosts} />
          </div>
        )}
      </div>

      {showToc && <TableOfContents items={post.toc} />}
    </div>
  );
}
