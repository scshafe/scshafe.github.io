'use client';

import { useState } from 'react';
import type { ResolvedView, ResolvedNode, NodeId, ComponentType } from '@/lib/content/types';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { ViewComponentRenderer } from './ViewComponentRenderer';
import { ComponentWrapper } from './ComponentWrapper';
import { AddComponentButton } from './AddComponentButton';

interface ListComponentProps {
  node: ResolvedNode;
  view: ResolvedView;
  onComponentUpdate?: (node: ResolvedNode, config: Record<string, unknown>) => Promise<void>;
  onAddChild?: (parent_node_id: NodeId, component_type: ComponentType, config: Record<string, unknown>) => Promise<void>;
  onDeleteChild?: (node_id: NodeId) => Promise<void>;
  onMoveChild?: (node_id: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function ListComponent({
  node,
  view,
  onComponentUpdate,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: ListComponentProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const config = node.config;
  const children = node.children || [];
  const [isExpanded, setIsExpanded] = useState(config.default_expanded !== false);

  // In publish mode with collapsible enabled, show collapse toggle
  const showCollapseToggle = !isAuthorMode && Boolean(config.collapsible);

  // Get display mode classes
  const displayModeClasses: Record<string, string> = {
    list: 'flex flex-col gap-4',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    cards: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  };

  const handleToggleExpanded = () => {
    if (config.collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const displayMode = (config.display_mode || config.displayMode || 'list') as string;
  const name = (config.name || '') as string;
  const showName = Boolean(config.show_name || config.showName);
  const showAddButton = config.show_add_button !== false && config.showAddButton !== false;

  return (
    <div className="list-component">
      {/* Header with name and collapse toggle */}
      {showName && name && (
        <div
          className={`flex items-center gap-2 mb-4 ${
            showCollapseToggle ? 'cursor-pointer' : ''
          }`}
          onClick={showCollapseToggle ? handleToggleExpanded : undefined}
        >
          {showCollapseToggle && (
            <svg
              className={`w-5 h-5 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {name}
            {children.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--foreground-muted)]">
                ({children.length})
              </span>
            )}
          </h3>
        </div>
      )}

      {/* Children list - always show in author mode, respect expanded state in publish mode */}
      {(isAuthorMode || isExpanded) && (
        <div className={displayModeClasses[displayMode] || displayModeClasses.list}>
          {children.map((child, index) => {
            const childContent = (
              <ViewComponentRenderer
                key={child.node_id}
                node={child}
                view={view}
                onComponentUpdate={onComponentUpdate}
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
                          // Open inline editor or trigger edit mode
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
      )}

      {/* Empty state */}
      {children.length === 0 && !isAuthorMode && (
        <p className="text-[var(--foreground-muted)] italic">No items</p>
      )}

      {/* Add button in author mode */}
      {isAuthorMode && showAddButton && onAddChild && (
        <div className="mt-4">
          <AddComponentButton
            onAdd={(componentType, componentConfig) => {
              console.log('[ListComponent] Adding child to node_id:', node.node_id, 'type:', componentType);
              return onAddChild(node.node_id, componentType, componentConfig);
            }}
            label={`Add to ${name || 'List'}`}
          />
        </div>
      )}
    </div>
  );
}
