import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllViews,
  resolveViewByPath,
  getAllViewPaths,
  getResolvedViewByPath,
} from '@/lib/content/views.server';
import { ViewPageClient } from '@/components/views/ViewPageClient';

interface ViewPageProps {
  params: Promise<{
    viewPath?: string[];
  }>;
}

// Generate static params for all defined views
export async function generateStaticParams(): Promise<{ viewPath: string[] }[]> {
  try {
    const paths = await getAllViewPaths();
    // For optional catch-all [[...viewPath]] with output: export,
    // we must always include the root path (empty array)
    const params = paths.map((viewPath) => ({
      viewPath: viewPath,
    }));

    // Always include root path for optional catch-all with static export
    // (will show 404 if no view matches "/")
    const hasRoot = params.some((p) => p.viewPath.length === 0);
    if (!hasRoot) {
      params.unshift({ viewPath: [] });
    }

    console.log('[generateStaticParams] Returning', params.length, 'paths');
    return params;
  } catch (error) {
    console.error('[generateStaticParams] Error:', error);
    // Return at least the root path to satisfy static export requirement
    return [{ viewPath: [] }];
  }
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { viewPath } = await params;
  const path = viewPath ? '/' + viewPath.join('/') : '/';

  const views = await getAllViews();
  const view = resolveViewByPath(path, views);

  if (!view) {
    return { title: 'Not Found' };
  }

  return {
    title: view.browser_title,
    description: view.description,
  };
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { viewPath } = await params;
  const path = viewPath ? '/' + viewPath.join('/') : '/';

  // Get the resolved view (with components) for rendering
  const view = await getResolvedViewByPath(path);

  if (!view) {
    notFound();
  }

  return <ViewPageClient initialView={view} />;
}
