'use client';

import { useEffect } from 'react';
import type { ResolvedView, ResolvedNode, NodeId, ComponentType } from '@/lib/content/types';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { ViewComponentRenderer } from './ViewComponentRenderer';
import { ComponentWrapper } from './ComponentWrapper';
import { AddComponentButton } from './AddComponentButton';

interface ViewRendererProps {
  view: ResolvedView;
  onComponentUpdate?: (node: ResolvedNode, config: Record<string, unknown>) => Promise<void>;
  onComponentDelete?: (node_id: NodeId) => Promise<void>;
  onComponentMove?: (node_id: NodeId, direction: 'up' | 'down') => Promise<void>;
  onComponentAdd?: (component_type: ComponentType, config: Record<string, unknown>) => Promise<void>;
  onEditComponent?: (node: ResolvedNode) => void;
  // Child component manipulation (for List components)
  onAddChild?: (parent_node_id: NodeId, component_type: ComponentType, config: Record<string, unknown>) => Promise<void>;
  onDeleteChild?: (node_id: NodeId) => Promise<void>;
  onMoveChild?: (node_id: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function ViewRenderer({
  view,
  onComponentUpdate,
  onComponentDelete,
  onComponentMove,
  onComponentAdd,
  onEditComponent,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: ViewRendererProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);

  // Debug: Log when view prop changes
  useEffect(() => {
    console.log('[ViewRenderer] view prop changed:', {
      comp_id: view.comp_id,
      name: view.name,
      componentsCount: view.components?.length ?? 0,
      components: view.components?.map(c => ({ comp_id: c.comp_id, node_id: c.node_id, type: c.type })) ?? [],
    });
    if (!view.components || view.components.length === 0) {
      console.warn('[ViewRenderer] No components to render!');
    }
  }, [view]);

  // Debug: Log when isAuthorMode changes
  useEffect(() => {
    console.log('[ViewRenderer] isAuthorMode selector changed:', isAuthorMode);
  }, [isAuthorMode]);

  const components = view.components ?? [];

  return (
    <div className="view-container space-y-8">
      {components.map((node, index) => {
        const rendered = (
          <ViewComponentRenderer
            key={node.node_id}
            node={node}
            view={view}
            onComponentUpdate={onComponentUpdate}
            onAddChild={onAddChild}
            onDeleteChild={onDeleteChild}
            onMoveChild={onMoveChild}
          />
        );

        if (isAuthorMode && onEditComponent && onComponentDelete && onComponentMove) {
          return (
            <ComponentWrapper
              key={node.node_id}
              node={node}
              isFirst={index === 0}
              isLast={index === components.length - 1}
              onEdit={() => onEditComponent(node)}
              onDelete={() => onComponentDelete(node.node_id)}
              onMoveUp={() => onComponentMove(node.node_id, 'up')}
              onMoveDown={() => onComponentMove(node.node_id, 'down')}
            >
              {rendered}
            </ComponentWrapper>
          );
        }

        return rendered;
      })}

      {/* Add Component Button - only in author mode */}
      {isAuthorMode && onComponentAdd && (
        <div className="mt-8">
          <AddComponentButton
            existingComponents={components}
            viewCompId={view.comp_id}
            onAdd={onComponentAdd}
          />
        </div>
      )}
    </div>
  );
}
