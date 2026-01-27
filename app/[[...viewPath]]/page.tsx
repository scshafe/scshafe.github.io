import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getViewsConfig, resolveViewByPath, getAllViewPaths } from '@/lib/content/views.server';
import { ViewPageClient } from '@/components/views/ViewPageClient';

interface ViewPageProps {
  params: Promise<{
    viewPath?: string[];
  }>;
}

// Generate static params for all defined views
export async function generateStaticParams(): Promise<{ viewPath: string[] }[]> {
  const paths = await getAllViewPaths();
  // For optional catch-all [[...viewPath]] with output: export,
  // we need to include all paths. Empty array represents root "/"
  const params = paths.map((viewPath) => ({
    viewPath: viewPath,
  }));

  // Ensure we always have the root path
  const hasRoot = params.some((p) => p.viewPath.length === 0);
  if (!hasRoot) {
    params.unshift({ viewPath: [] });
  }

  return params;
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { viewPath } = await params;
  const path = viewPath ? '/' + viewPath.join('/') : '/';

  const viewsConfig = await getViewsConfig();
  const view = resolveViewByPath(path, viewsConfig);

  if (!view) {
    return { title: 'Not Found' };
  }

  return {
    title: view.browserTitle,
    description: view.description,
  };
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { viewPath } = await params;
  const path = viewPath ? '/' + viewPath.join('/') : '/';

  const viewsConfig = await getViewsConfig();
  const view = resolveViewByPath(path, viewsConfig);

  if (!view) {
    notFound();
  }

  return <ViewPageClient initialView={view} />;
}
