'use client';

import { useState } from 'react';
import type { NavItem, NavLinkType } from '@/lib/content/navigation';
import type { View, NodeId } from '@/lib/content/views';
import { SettingsItemWrapper } from './SettingsItemWrapper';

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'external', label: 'External Link' },
  { value: 'github', label: 'GitHub' },
  { value: 'rss', label: 'RSS' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
];

const LINK_TYPE_OPTIONS: { value: NavLinkType; label: string; description: string }[] = [
  { value: 'view', label: 'View', description: 'Link to a page view' },
  { value: 'url', label: 'URL', description: 'Link to a custom URL' },
  { value: 'theme', label: 'Theme Toggle', description: 'Light/dark mode toggle button' },
];

interface NavItemEditorProps {
  item: NavItem;
  views: View[];
  onUpdate: (updates: Partial<NavItem>) => void;
  onRemove: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  saving: boolean;
  showPosition?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

interface NavItemEditModalProps {
  item: NavItem;
  views: View[];
  onUpdate: (updates: Partial<NavItem>) => void;
  onClose: () => void;
  showPosition?: boolean;
}

function NavItemEditModal({ item, views, onUpdate, onClose, showPosition }: NavItemEditModalProps) {
  const [localLabel, setLocalLabel] = useState(item.label);
  const [localLinkType, setLocalLinkType] = useState<NavLinkType>(item.linkType || 'url');
  const [localUrl, setLocalUrl] = useState(item.url || '');
  const [localViewId, setLocalViewId] = useState<NodeId | undefined>(item.viewId);
  const [localPosition, setLocalPosition] = useState<'left' | 'right'>(item.position || 'right');
  const [localIcon, setLocalIcon] = useState(item.icon || '');
  const [localExternal, setLocalExternal] = useState(item.external || false);

  const inputClass = 'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';
  const selectClass = 'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';

  const handleSave = () => {
    const updates: Partial<NavItem> = {};
    if (localLabel !== item.label) updates.label = localLabel;
    if (localLinkType !== item.linkType) updates.linkType = localLinkType;
    if (localUrl !== (item.url || '')) updates.url = localUrl || undefined;
    if (localViewId !== item.viewId) updates.viewId = localViewId;
    if (localPosition !== item.position) updates.position = localPosition;
    if (localIcon !== (item.icon || '')) updates.icon = localIcon || null;
    if (localExternal !== (item.external || false)) updates.external = localExternal;

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
    onClose();
  };

  // Get the display text for the current link target
  const getLinkTargetDisplay = () => {
    switch (localLinkType) {
      case 'view': {
        const view = views.find(v => v.id === localViewId);
        return view ? `View: ${view.name}` : 'No view selected';
      }
      case 'url':
        return localUrl || 'No URL';
      case 'theme':
        return 'Theme Toggle Button';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
            Edit Navigation Link
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
              Label
            </label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              className={inputClass}
              placeholder="Link label"
            />
          </div>

          {/* Link Type */}
          <div>
            <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
              Link Type
            </label>
            <select
              value={localLinkType}
              onChange={(e) => setLocalLinkType(e.target.value as NavLinkType)}
              className={selectClass}
            >
              {LINK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mt-1">
              {LINK_TYPE_OPTIONS.find(o => o.value === localLinkType)?.description}
            </p>
          </div>

          {/* View Selector (when linkType is 'view') */}
          {localLinkType === 'view' && (
            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
                Target View
              </label>
              <select
                value={localViewId ?? ''}
                onChange={(e) => setLocalViewId(e.target.value ? Number(e.target.value) : undefined)}
                className={selectClass}
              >
                <option value="">Select a view...</option>
                {views.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name} ({view.path})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* URL Input (when linkType is 'url') */}
          {localLinkType === 'url' && (
            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
                URL
              </label>
              <input
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                className={inputClass}
                placeholder="/path or https://..."
              />
            </div>
          )}

          {/* Theme type info */}
          {localLinkType === 'theme' && (
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
              <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
                This will render as a light/dark mode toggle button in the navigation.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Position (header only) */}
            {showPosition && (
              <div>
                <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
                  Position
                </label>
                <select
                  value={localPosition}
                  onChange={(e) => setLocalPosition(e.target.value as 'left' | 'right')}
                  className={selectClass}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            )}

            {/* Icon */}
            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
                Icon
              </label>
              <select
                value={localIcon}
                onChange={(e) => setLocalIcon(e.target.value)}
                className={selectClass}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* External Link Toggle (only for URL type) */}
          {localLinkType === 'url' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`external-${item.id}`}
                checked={localExternal}
                onChange={(e) => setLocalExternal(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] bg-[var(--background)] text-[var(--link)]"
              />
              <label
                htmlFor={`external-${item.id}`}
                className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)]"
              >
                Open in new tab (external link)
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function NavItemEditor({
  item,
  views,
  onUpdate,
  onRemove,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  showPosition = false,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
}: NavItemEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Get display info based on link type
  const getSubtitle = () => {
    const linkType = item.linkType || 'url';
    switch (linkType) {
      case 'view': {
        const view = views.find(v => v.id === item.viewId);
        return view ? `View: ${view.path}` : 'No view selected';
      }
      case 'url':
        return item.url || 'No URL';
      case 'theme':
        return 'Theme Toggle';
      default:
        return '';
    }
  };

  const getLinkTypeBadge = () => {
    const linkType = item.linkType || 'url';
    const colors: Record<NavLinkType, string> = {
      view: 'text-blue-400 bg-blue-400/10',
      url: 'text-green-400 bg-green-400/10',
      theme: 'text-purple-400 bg-purple-400/10',
    };
    return (
      <span className={`text-[length:var(--text-xs)] px-1.5 py-0.5 rounded ${colors[linkType]}`}>
        {linkType}
      </span>
    );
  };

  return (
    <>
      <SettingsItemWrapper
        label="Nav Link"
        onEdit={() => setIsEditing(true)}
        onDelete={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isFirst={isFirst}
        isLast={isLast}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        isDragging={isDragging}
        isDragOver={isDragOver}
      >
        <div className="border border-[var(--border)] rounded-lg bg-[var(--background-secondary)] p-3">
          <div className="flex items-center gap-3">
            {/* Label Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)] truncate">
                  {item.label}
                </span>
                {getLinkTypeBadge()}
              </div>
              <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] truncate">
                {getSubtitle()}
                {item.linkType === 'url' && item.external && (
                  <span className="ml-2 text-amber-400">(external)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </SettingsItemWrapper>

      {isEditing && (
        <NavItemEditModal
          item={item}
          views={views}
          onUpdate={onUpdate}
          onClose={() => setIsEditing(false)}
          showPosition={showPosition}
        />
      )}
    </>
  );
}
