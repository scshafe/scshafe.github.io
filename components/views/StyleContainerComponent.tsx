'use client';

import type { ResolvedNode, ResolvedView, NodeId, ComponentType } from '@/lib/content/types';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { ViewComponentRenderer } from './ViewComponentRenderer';
import { ComponentWrapper } from './ComponentWrapper';
import { AddComponentButton } from './AddComponentButton';

interface StyleContainerComponentProps {
  node: ResolvedNode;
  view: ResolvedView;
  onComponentUpdate?: (node: ResolvedNode, config: Record<string, unknown>) => Promise<void>;
  onAddChild?: (parent_node_id: NodeId, component_type: ComponentType, config: Record<string, unknown>) => Promise<void>;
  onDeleteChild?: (node_id: NodeId) => Promise<void>;
  onMoveChild?: (node_id: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function StyleContainerComponent({
  node,
  view,
  onComponentUpdate,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: StyleContainerComponentProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const config = node.config;
  const isTransparent = config.is_transparent as boolean | undefined;
  const children = node.children || [];

  // In author mode with empty container, always show a visual boundary
  const showBoundary = !isTransparent || (isAuthorMode && children.length === 0);

  return (
    <div
      className={`style-container ${
        showBoundary
          ? 'bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-4'
          : ''
      } ${isAuthorMode && children.length === 0 ? 'border-dashed' : ''}`}
    >
      {children.length > 0 ? (
        <div className="space-y-4">
          {children.map((child, index) => {
            const childContent = (
              <ViewComponentRenderer
                key={child.node_id}
                node={child}
                view={view}
                onComponentUpdate={onComponentUpdate}
                onAddChild={onAddChild}
                onDeleteChild={onDeleteChild}
                onMoveChild={onMoveChild}
              />
            );

            // In author mode, wrap with ComponentWrapper for edit controls
            if (isAuthorMode) {
              return (
                <ComponentWrapper
                  key={child.node_id}
                  node={child}
                  onEdit={
                    onComponentUpdate
                      ? () => {
                          console.log('Edit child:', child.node_id);
                        }
                      : undefined
                  }
                  onDelete={onDeleteChild ? () => onDeleteChild(child.node_id) : undefined}
                  onMoveUp={
                    onMoveChild && index > 0
                      ? () => onMoveChild(child.node_id, 'up')
                      : undefined
                  }
                  onMoveDown={
                    onMoveChild && index < children.length - 1
                      ? () => onMoveChild(child.node_id, 'down')
                      : undefined
                  }
                  isFirst={index === 0}
                  isLast={index === children.length - 1}
                >
                  {childContent}
                </ComponentWrapper>
              );
            }

            return childContent;
          })}
        </div>
      ) : (
        !isAuthorMode && (
          <div className="text-[var(--foreground-muted)] text-[length:var(--text-sm)] italic">
            Style container (empty)
          </div>
        )
      )}

      {/* Add button in author mode */}
      {isAuthorMode && onAddChild && (
        <div className={children.length > 0 ? 'mt-4' : ''}>
          <AddComponentButton
            onAdd={(componentType, componentConfig) => {
              console.log('[StyleContainerComponent] Adding child to node_id:', node.node_id, 'type:', componentType);
              return onAddChild(node.node_id, componentType, componentConfig);
            }}
            label="Add to Style Container"
          />
        </div>
      )}
    </div>
  );
}
