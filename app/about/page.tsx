import type { Metadata } from 'next';
import { getAboutContent } from '@/lib/content/about';
import { getAllExperiences } from '@/lib/content/experiences';
import { EditableAboutPage } from '@/components/pages';
import { ExperienceList } from '@/components/about';

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutContent();
  return {
    title: `${about.title} - scshafe's Blog`,
    description: about.description,
  };
}

export default async function AboutPage() {
  const about = await getAboutContent();
  const experiences = await getAllExperiences();

  return (
    <div className="max-w-2xl">
      <EditableAboutPage
        initialTitle={about.title}
        initialDescription={about.description}
        initialContent={about.content}
        initialHtmlContent={about.htmlContent}
      />

      <ExperienceList experiences={experiences} />
    </div>
  );
}
