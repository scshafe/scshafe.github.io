'use client';

import { useState } from 'react';
import type { View, ViewComponent, NodeId, ListComponent as ListComponentType } from '@/lib/content/views';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { ViewComponentRenderer } from './ViewComponentRenderer';
import { ComponentWrapper } from './ComponentWrapper';
import { AddComponentButton } from './AddComponentButton';

interface ListComponentProps {
  component: ListComponentType;
  view: View;
  onContentUpdate?: (contentKey: string, content: string) => Promise<void>;
  onComponentUpdate?: (component: ViewComponent) => Promise<void>;
  onAddChild?: (parentId: NodeId, child: ViewComponent) => Promise<void>;
  onDeleteChild?: (childId: NodeId) => Promise<void>;
  onMoveChild?: (childId: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function ListComponent({
  component,
  view,
  onContentUpdate,
  onComponentUpdate,
  onAddChild,
  onDeleteChild,
  onMoveChild,
}: ListComponentProps) {
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const { config, children = [] } = component;
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded ?? true);

  // In publish mode with collapsible enabled, show collapse toggle
  const showCollapseToggle = !isAuthorMode && config.collapsible;

  // Get display mode classes
  const displayModeClasses = {
    list: 'flex flex-col gap-4',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    cards: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  };

  const handleToggleExpanded = () => {
    if (config.collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="list-component">
      {/* Header with name and collapse toggle */}
      {config.showName && config.name && (
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
            {config.name}
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
        <div className={displayModeClasses[config.displayMode || 'list']}>
          {children.map((child, index) => {
            const childContent = (
              <ViewComponentRenderer
                key={child.id}
                component={child}
                view={view}
                onContentUpdate={onContentUpdate}
                onComponentUpdate={onComponentUpdate}
              />
            );

            // In author mode, wrap with ComponentWrapper for edit controls
            if (isAuthorMode) {
              return (
                <ComponentWrapper
                  key={child.id}
                  component={child}
                  onEdit={
                    onComponentUpdate
                      ? () => {
                          // Open inline editor or trigger edit mode
                          console.log('Edit child:', child.id);
                        }
                      : undefined
                  }
                  onDelete={onDeleteChild ? () => onDeleteChild(child.id) : undefined}
                  onMoveUp={
                    onMoveChild && index > 0
                      ? () => onMoveChild(child.id, 'up')
                      : undefined
                  }
                  onMoveDown={
                    onMoveChild && index < children.length - 1
                      ? () => onMoveChild(child.id, 'down')
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
      {isAuthorMode && config.showAddButton && onAddChild && (
        <div className="mt-4">
          <AddComponentButton
            allowedTypes={config.listType ? [config.listType] : undefined}
            onAdd={(newComponent) => onAddChild(component.id, newComponent)}
            label={`Add ${config.listType || 'item'}`}
          />
        </div>
      )}
    </div>
  );
}
