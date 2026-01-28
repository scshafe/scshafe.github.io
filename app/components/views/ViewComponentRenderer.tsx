'use client';

import type {
  View,
  ViewComponent,
  NodeId,
  TitleComponent as TitleComponentType,
  ViewLinkComponent as ViewLinkComponentType,
  InformationComponent as InformationComponentType,
  AlertComponent as AlertComponentType,
  MultiMediaComponent as MultiMediaComponentType,
  MarkdownEditorComponent as MarkdownEditorComponentType,
  ListComponent as ListComponentType,
  ExperienceComponent as ExperienceComponentType,
  BlogPostComponent as BlogPostComponentType,
  PDFViewerComponent as PDFViewerComponentType,
  TagListComponent as TagListComponentType,
} from '@/lib/content/views';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { TitleComponent } from './TitleComponent';
import { ViewLinkComponent } from './ViewLinkComponent';
import { InformationComponent } from './InformationComponent';
import { AlertComponent } from './AlertComponent';
import { MultiMediaPlaceholder } from './MultiMediaPlaceholder';
import { MarkdownViewComponent } from './MarkdownViewComponent';
import { ListComponent } from './ListComponent';
import { PDFViewerComponent } from './PDFViewerComponent';
import { TagListComponent } from './TagListComponent';
import { BlogPostViewComponent } from './BlogPostViewComponent';
import { ExperienceCard } from '@/app/components/about/ExperienceCard';

interface ViewComponentRendererProps {
  component: ViewComponent;
  view: View;
  onContentUpdate?: (contentKey: string, content: string) => Promise<void>;
  onComponentUpdate?: (component: ViewComponent) => Promise<void>;
  onAddChild?: (parentId: NodeId, child: ViewComponent) => Promise<void>;
  onDeleteChild?: (childId: NodeId) => Promise<void>;
  onMoveChild?: (childId: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function ViewComponentRenderer({
  component,
  view,
  onContentUpdate,
  onComponentUpdate,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: ViewComponentRendererProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);

  // Get component type (handle both 'type' and 'component_type' fields)
  const componentType = component.type || (component as { component_type?: string }).component_type;

  switch (componentType) {
    case 'Title': {
      const titleComp = component as TitleComponentType;
      return <TitleComponent config={titleComp.config} view={view} />;
    }

    case 'View': {
      const viewLinkComp = component as ViewLinkComponentType;
      return <ViewLinkComponent config={viewLinkComp.config} />;
    }

    case 'Information': {
      const infoComp = component as InformationComponentType;
      return <InformationComponent config={infoComp.config} />;
    }

    case 'Alert': {
      const alertComp = component as AlertComponentType;
      return <AlertComponent config={alertComp.config} />;
    }

    case 'MultiMedia': {
      const mediaComp = component as MultiMediaComponentType;
      return <MultiMediaPlaceholder config={mediaComp.config} />;
    }

    case 'MarkdownEditor': {
      const mdComp = component as MarkdownEditorComponentType;
      return (
        <MarkdownViewComponent
          config={mdComp.config}
          content={view.content?.[mdComp.config.contentKey] || ''}
          viewId={view.id}
          onSave={
            onContentUpdate
              ? (content) => onContentUpdate(mdComp.config.contentKey, content)
              : undefined
          }
        />
      );
    }

    case 'List': {
      const listComp = component as ListComponentType;
      return (
        <ListComponent
          component={listComp}
          view={view}
          onContentUpdate={onContentUpdate}
          onComponentUpdate={onComponentUpdate}
          onAddChild={onAddChild}
          onDeleteChild={onDeleteChild}
          onMoveChild={onMoveChild}
        />
      );
    }

    case 'Experience': {
      const expComp = component as ExperienceComponentType;
      return (
        <ExperienceCard
          id={expComp.id}
          title={expComp.config.title}
          company={expComp.config.company}
          startDate={expComp.config.startDate}
          endDate={expComp.config.endDate}
          image={expComp.config.image}
          content=""
          htmlContent=""
          backgroundColor={expComp.config.backgroundColor}
          textColor={expComp.config.textColor}
          accentColor={expComp.config.accentColor}
        />
      );
    }

    case 'PDFViewer': {
      const pdfComp = component as PDFViewerComponentType;
      return (
        <PDFViewerComponent
          config={pdfComp.config}
          componentId={pdfComp.id}
          isAuthorMode={isAuthorMode}
          onConfigUpdate={
            onComponentUpdate
              ? (config) => onComponentUpdate({ ...pdfComp, config })
              : undefined
          }
        />
      );
    }

    case 'TagList': {
      const tagComp = component as TagListComponentType;
      return <TagListComponent config={tagComp.config} />;
    }

    case 'BlogPost': {
      const blogComp = component as BlogPostComponentType;
      return (
        <BlogPostViewComponent
          config={blogComp.config}
          onConfigUpdate={
            onComponentUpdate
              ? (config) => onComponentUpdate({ ...blogComp, config })
              : undefined
          }
        />
      );
    }

    default:
      return (
        <div className="p-4 border border-[var(--border)] rounded-md bg-[var(--background-secondary)]">
          <p className="text-[var(--foreground-muted)]">
            Unknown component type: {componentType}
          </p>
        </div>
      );
  }
}
