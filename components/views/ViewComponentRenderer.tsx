'use client';

import { useEffect } from 'react';
import type {
  ResolvedView,
  ResolvedNode,
  NodeId,
  ComponentType,
} from '@/lib/content/types';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { TitleComponent } from './TitleComponent';
import { ViewLinkComponent } from './ViewLinkComponent';
import { InformationComponent } from './InformationComponent';
import { AlertComponent } from './AlertComponent';
import { MultiMediaPlaceholder } from './MultiMediaPlaceholder';
import { MarkdownViewComponent } from './MarkdownViewComponent';
import { ListComponent } from './ListComponent';
import { StyleContainerComponent } from './StyleContainerComponent';
import { PDFViewerComponent } from './PDFViewerComponent';
import { TagListComponent } from './TagListComponent';
import { ExperienceCard } from './ExperienceCard';

interface ViewComponentRendererProps {
  node: ResolvedNode;
  view: ResolvedView;
  onComponentUpdate?: (node: ResolvedNode, config: Record<string, unknown>) => Promise<void>;
  onAddChild?: (parent_node_id: NodeId, component_type: ComponentType, config: Record<string, unknown>) => Promise<void>;
  onDeleteChild?: (node_id: NodeId) => Promise<void>;
  onMoveChild?: (node_id: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function ViewComponentRenderer({
  node,
  view,
  onComponentUpdate,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: ViewComponentRendererProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const config = node.config;

  // Debug: Log when node prop changes
  useEffect(() => {
    console.log('[ViewComponentRenderer] node prop changed:', {
      comp_id: node.comp_id,
      node_id: node.node_id,
      type: node.type,
      configKeys: Object.keys(config),
    });
  }, [node, config]);

  // Handle component types
  switch (node.type) {
    case 'SectionUnit':
      return (
        <TitleComponent
          title={config.title as string}
          level={config.level as 'h1' | 'h2' | 'h3'}
          showTitle={config.show_title as boolean}
        />
      );

    case 'LinkUnit':
      return (
        <ViewLinkComponent
          label={config.label as string}
          targetNodeId={config.target_node_id as NodeId | undefined}
          targetUrl={config.target_url as string | undefined}
          displayStyle={config.display_style as 'link' | 'card' | 'button'}
          icon={config.icon as string | undefined}
        />
      );

    case 'PlainTextUnit':
      return (
        <InformationComponent
          content={config.content as string}
          style={config.style as 'default' | 'callout' | 'card'}
        />
      );

    case 'AlertUnit':
      return (
        <AlertComponent
          content={config.content as string}
          variant={config.variant as 'info' | 'warning' | 'error' | 'success'}
        />
      );

    case 'ImageMedia':
      return (
        <MultiMediaPlaceholder
          src={config.src as string}
          alt={config.alt as string | undefined}
          caption={config.caption as string | undefined}
        />
      );

    case 'MarkdownUnit':
      return (
        <MarkdownViewComponent
          content={config.content as string}
          placeholder={config.placeholder as string | undefined}
          viewCompId={view.comp_id}
          onSave={
            onComponentUpdate
              ? (content) => onComponentUpdate(node, { ...config, content })
              : undefined
          }
        />
      );

    case 'ListContainer':
      return (
        <ListComponent
          node={node}
          view={view}
          onComponentUpdate={onComponentUpdate}
          onAddChild={onAddChild}
          onDeleteChild={onDeleteChild}
          onMoveChild={onMoveChild}
        />
      );

    case 'StyleContainer':
      return (
        <StyleContainerComponent
          node={node}
          view={view}
          onComponentUpdate={onComponentUpdate}
          onAddChild={onAddChild}
          onDeleteChild={onDeleteChild}
          onMoveChild={onMoveChild}
        />
      );

    case 'ExperienceComponent':
      return (
        <ExperienceCard
          id={node.comp_id}
          title={config.position as string}
          company={config.company as string}
          startDate={config.start_date as string}
          endDate={config.end_date as string}
          image={config.image as string | undefined}
          content={config.content as string}
          htmlContent=""
        />
      );

    case 'PDFMedia':
      return (
        <PDFViewerComponent
          src={config.src as string}
          title={config.title as string | undefined}
          height={config.height as string | undefined}
          displayTitle={config.display_title as boolean | undefined}
          comp_id={node.comp_id}
          isAuthorMode={isAuthorMode}
          onConfigUpdate={
            onComponentUpdate
              ? (newConfig) => onComponentUpdate(node, { ...config, ...newConfig })
              : undefined
          }
        />
      );

    case 'TagListComponent':
      return (
        <TagListComponent
          customTags={config.custom_tags as string[] | undefined}
        />
      );

    case 'VideoMedia':
      return (
        <MultiMediaPlaceholder
          src={config.src as string}
          alt={config.title as string | undefined}
          mediaType="video"
        />
      );

    default:
      console.warn('[ViewComponentRenderer] Unknown component type:', node.type, 'node:', node);
      return (
        <div className="p-4 border border-yellow-500 rounded-md bg-yellow-500/10">
          <p className="text-yellow-600 font-medium">
            Unknown component type: {node.type}
          </p>
          <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] mt-1">
            comp_id: {node.comp_id}, node_id: {node.node_id}
          </p>
        </div>
      );
  }
}
