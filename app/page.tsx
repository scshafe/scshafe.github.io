import type { Metadata } from 'next';
import { getHomeContent } from '@/lib/content/home';
import { EditableHomePage } from '@/components/pages';

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomeContent();
  return {
    title: home.title,
    description: home.description,
  };
}

export default async function HomePage() {
  const home = await getHomeContent();

  return (
    <EditableHomePage
      initialTitle={home.title}
      initialDescription={home.description}
      initialContent={home.content}
      initialHtmlContent={home.htmlContent}
    />
  );
}
