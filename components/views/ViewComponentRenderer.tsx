'use client';

import type { View, ViewComponent } from '@/lib/content/views';
import { useAuthorMode } from '@/components/author/DevModeProvider';
import { TitleComponent } from './TitleComponent';
import { ViewLinkComponent } from './ViewLinkComponent';
import { InformationComponent } from './InformationComponent';
import { AlertComponent } from './AlertComponent';
import { MultiMediaPlaceholder } from './MultiMediaPlaceholder';
import { MarkdownViewComponent } from './MarkdownViewComponent';
import { ExperienceListViewComponent } from './ExperienceListViewComponent';
import { PDFViewerComponent } from './PDFViewerComponent';
import { TagListComponent } from './TagListComponent';
import { BlogPostsListViewComponent } from './BlogPostsListViewComponent';

interface ViewComponentRendererProps {
  component: ViewComponent;
  view: View;
  onContentUpdate?: (contentKey: string, content: string) => Promise<void>;
  onComponentUpdate?: (component: ViewComponent) => Promise<void>;
}

export function ViewComponentRenderer({
  component,
  view,
  onContentUpdate,
  onComponentUpdate,
}: ViewComponentRendererProps) {
  const { isAuthorMode } = useAuthorMode();

  switch (component.type) {
    case 'Title':
      return <TitleComponent config={component.config} view={view} />;

    case 'View':
      return <ViewLinkComponent config={component.config} />;

    case 'Information':
      return <InformationComponent config={component.config} />;

    case 'Alert':
      return <AlertComponent config={component.config} />;

    case 'MultiMedia':
      return <MultiMediaPlaceholder config={component.config} />;

    case 'MarkdownEditor':
      return (
        <MarkdownViewComponent
          config={component.config}
          content={view.content?.[component.config.contentKey] || ''}
          viewId={view.id}
          onSave={
            onContentUpdate
              ? (content) => onContentUpdate(component.config.contentKey, content)
              : undefined
          }
        />
      );

    case 'ExperienceList':
      return <ExperienceListViewComponent config={component.config} />;

    case 'PDFViewer':
      return (
        <PDFViewerComponent
          config={component.config}
          componentId={component.id}
          isAuthorMode={isAuthorMode}
          onConfigUpdate={
            onComponentUpdate
              ? (config) => onComponentUpdate({ ...component, config })
              : undefined
          }
        />
      );

    case 'TagList':
      return <TagListComponent config={component.config} />;

    case 'BlogPostsList':
      return <BlogPostsListViewComponent config={component.config} />;

    default:
      return (
        <div className="p-4 border border-[var(--border)] rounded-md bg-[var(--background-secondary)]">
          <p className="text-[var(--foreground-muted)]">
            Unknown component type: {(component as ViewComponent).type}
          </p>
        </div>
      );
  }
}
