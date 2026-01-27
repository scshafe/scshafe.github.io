'use client';

import type { View, ViewComponent } from '@/lib/content/views';
import { useAuthorMode } from '@/components/author/DevModeProvider';
import { ViewComponentRenderer } from './ViewComponentRenderer';
import { ComponentWrapper } from './ComponentWrapper';
import { AddComponentButton } from './AddComponentButton';

interface ViewRendererProps {
  view: View;
  onContentUpdate?: (contentKey: string, content: string) => Promise<void>;
  onComponentUpdate?: (component: ViewComponent) => Promise<void>;
  onComponentDelete?: (componentId: string) => Promise<void>;
  onComponentMove?: (componentId: string, direction: 'up' | 'down') => Promise<void>;
  onComponentAdd?: (component: ViewComponent) => Promise<void>;
  onEditComponent?: (component: ViewComponent) => void;
}

export function ViewRenderer({
  view,
  onContentUpdate,
  onComponentUpdate,
  onComponentDelete,
  onComponentMove,
  onComponentAdd,
  onEditComponent,
}: ViewRendererProps) {
  const { isAuthorMode } = useAuthorMode();

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
