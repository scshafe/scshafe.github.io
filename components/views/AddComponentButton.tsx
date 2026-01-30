'use client';

import { useState } from 'react';
import type { ComponentType, ResolvedNode, CompId } from '@/lib/content/types';
import { getComponentHierarchy, type ComponentHierarchyNode } from '@/lib/content/views';

interface AddComponentButtonProps {
  existingComponents?: ResolvedNode[];
  viewCompId?: CompId;
  onAdd: (component_type: ComponentType, config: Record<string, unknown>) => Promise<void>;
  allowedTypes?: ComponentType[];
  label?: string;
}

/**
 * Get default config for a component type
 */
function getDefaultConfig(type: ComponentType): Record<string, unknown> {
  switch (type) {
    case 'SectionUnit':
      return { title: 'New Section', level: 'h2', show_title: true };
    case 'PlainTextUnit':
      return { content: 'Enter text here...', style: 'default' };
    case 'AlertUnit':
      return { content: 'Alert message', variant: 'info' };
    case 'MarkdownUnit':
      return { content: '', placeholder: 'Enter markdown content...' };
    case 'LinkUnit':
      return { label: 'Link', display_style: 'link' };
    case 'ImageMedia':
      return { src: '', alt: '' };
    case 'VideoMedia':
      return { src: '', controls: true };
    case 'PDFMedia':
      return { src: '', display_title: true };
    case 'ListContainer':
      return { name: 'New List', display_mode: 'list', show_name: false };
    case 'StyleContainer':
      return { is_transparent: false };
    case 'ExperienceComponent':
      return { position: 'Position', company: 'Company', start_date: '', end_date: '', content: '' };
    case 'TagListComponent':
      return { custom_tags: [] };
    default:
      return {};
  }
}

/**
 * Filter hierarchy nodes based on allowed types
 */
function filterHierarchy(nodes: ComponentHierarchyNode[], allowedTypes?: ComponentType[]): ComponentHierarchyNode[] {
  if (!allowedTypes) return nodes;

  return nodes
    .map((node) => {
      if (node.type) {
        // Leaf node - check if type is allowed
        return allowedTypes.includes(node.type) ? node : null;
      }
      if (node.children) {
        // Branch node - filter children recursively
        const filteredChildren = filterHierarchy(node.children, allowedTypes);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    })
    .filter((node): node is ComponentHierarchyNode => node !== null);
}

export function AddComponentButton({
  existingComponents = [],
  viewCompId,
  onAdd,
  allowedTypes,
  label = 'Add Component'
}: AddComponentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [navigationStack, setNavigationStack] = useState<ComponentHierarchyNode[][]>([]);

  const fullHierarchy = getComponentHierarchy();
  const filteredHierarchy = filterHierarchy(fullHierarchy, allowedTypes);

  // Current level to display
  const currentOptions = navigationStack.length === 0
    ? filteredHierarchy
    : navigationStack[navigationStack.length - 1];

  const handleSelect = async (node: ComponentHierarchyNode) => {
    if (node.type) {
      // Leaf node - add the component
      setAdding(true);
      try {
        const config = getDefaultConfig(node.type);
        await onAdd(node.type, config);
        setIsOpen(false);
        setNavigationStack([]);
      } catch (error) {
        console.error('Failed to add component:', error);
      } finally {
        setAdding(false);
      }
    } else if (node.children) {
      // Branch node - navigate deeper
      setNavigationStack((prev) => [...prev, node.children!]);
    }
  };

  const handleBack = () => {
    setNavigationStack((prev) => prev.slice(0, -1));
  };

  const handleClose = () => {
    setIsOpen(false);
    setNavigationStack([]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setNavigationStack([]);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        disabled={adding}
        className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-md text-[var(--foreground-muted)] hover:border-[var(--link)] hover:text-[var(--link)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {adding ? 'Adding...' : label}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 mt-2 z-50 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
            {/* Header with back button */}
            {navigationStack.length > 0 && (
              <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {currentOptions.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  disabled={adding}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--background-secondary)] transition-colors border-b border-[var(--border)] last:border-b-0 disabled:opacity-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-[var(--foreground)]">
                      {node.label}
                    </div>
                    <div className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
                      {node.description}
                    </div>
                  </div>
                  {node.children && (
                    <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
