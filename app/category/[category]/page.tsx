import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllCategories, getPostsByCategory } from '@/lib/content/posts';
import PostCard from '@/app/components/posts/PostCard';

// Allow empty params array when there are no categories
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ category: string }[]> {
  try {
    const categories = await getAllCategories();
    return categories.map((category) => ({
      category: category.toLowerCase(),
    }));
  } catch {
    return [];
  }
}

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${category} - scshafe's Blog`,
    description: `Posts about ${category}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const posts = await getPostsByCategory(category);

  return (
    <div>
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li aria-current="page" className="text-[var(--foreground)]">
            {category}
          </li>
        </ol>
      </nav>

      <header className="mb-[var(--space-lg)]">
        <div className="inline-flex items-center gap-2 text-[var(--link)] mb-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span className="text-[length:var(--text-sm)] font-medium uppercase tracking-wider">
            Category
          </span>
        </div>
        <h1 className="text-[length:var(--text-3xl)] font-bold mb-2 text-[var(--foreground)] capitalize">
          {category}
        </h1>
        <p className="text-[length:var(--text-base)] text-[var(--foreground-muted)]">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this category
        </p>
      </header>

      {posts.length > 0 ? (
        <div role="feed" aria-label={`Posts in ${category} category`}>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <p className="text-[length:var(--text-lg)]">No posts in this category.</p>
        </div>
      )}
    </div>
  );
}
