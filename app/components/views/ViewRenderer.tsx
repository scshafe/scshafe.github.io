'use client';

import type { View, ViewComponent, NodeId } from '@/lib/content/views';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';
import { ViewComponentRenderer } from './ViewComponentRenderer';
import { ComponentWrapper } from './ComponentWrapper';
import { AddComponentButton } from './AddComponentButton';

interface ViewRendererProps {
  view: View;
  onContentUpdate?: (contentKey: string, content: string) => Promise<void>;
  onComponentUpdate?: (component: ViewComponent) => Promise<void>;
  onComponentDelete?: (componentId: NodeId) => Promise<void>;
  onComponentMove?: (componentId: NodeId, direction: 'up' | 'down') => Promise<void>;
  onComponentAdd?: (component: ViewComponent) => Promise<void>;
  onEditComponent?: (component: ViewComponent) => void;
  // Child component manipulation (for List components)
  onAddChild?: (parentId: NodeId, child: ViewComponent) => Promise<void>;
  onDeleteChild?: (childId: NodeId) => Promise<void>;
  onMoveChild?: (childId: NodeId, direction: 'up' | 'down') => Promise<void>;
}

export function ViewRenderer({
  view,
  onContentUpdate,
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

  const visibleComponents = view.components.filter(
    (component) => component.visible !== false
  );

  return (
    <div className="view-container space-y-4">
      {visibleComponents.map((component, index) => {
        const rendered = (
          <ViewComponentRenderer
            key={component.id}
            component={component}
            view={view}
            onContentUpdate={onContentUpdate}
            onComponentUpdate={onComponentUpdate}
            onAddChild={onAddChild}
            onDeleteChild={onDeleteChild}
            onMoveChild={onMoveChild}
          />
        );

        if (isAuthorMode && onEditComponent && onComponentDelete && onComponentMove) {
          return (
            <ComponentWrapper
              key={component.id}
              component={component}
              isFirst={index === 0}
              isLast={index === visibleComponents.length - 1}
              onEdit={() => onEditComponent(component)}
              onDelete={() => onComponentDelete(component.id)}
              onMoveUp={() => onComponentMove(component.id, 'up')}
              onMoveDown={() => onComponentMove(component.id, 'down')}
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
            existingComponents={view.components}
            viewId={view.id}
            onAdd={onComponentAdd}
          />
        </div>
      )}
    </div>
  );
}
