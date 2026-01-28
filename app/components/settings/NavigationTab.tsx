'use client';

import { useState, useCallback, useEffect } from 'react';
import type { NavigationConfig, NavItem } from '@/lib/content/navigation';
import type { View, NodeId } from '@/lib/content/views';
import { generateId } from '@/lib/content/views';
import { NavItemEditor } from './NavItemEditor';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface NavigationTabProps {
  initialConfig: NavigationConfig;
}

export function NavigationTab({ initialConfig }: NavigationTabProps) {
  const [config, setConfig] = useState<NavigationConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [views, setViews] = useState<View[]>([]);

  // Fetch views for the dropdown
  useEffect(() => {
    async function fetchViews() {
      try {
        console.log('%c→ GET%c /views (fetching views for nav dropdown)', 'color: #06b6d4; font-weight: bold', '');
        const res = await fetch(`${DEV_EDITOR_URL}/views`);
        if (res.ok) {
          const data = await res.json();
          // Handle both array and object with views/items
          const viewsList = Array.isArray(data) ? data : (data.views || data.items || []);
          console.log(`%c← 200%c /views (${viewsList.length} views)`, 'color: #22c55e', '');
          setViews(viewsList);
        } else {
          console.log(`%c← ${res.status}%c /views (failed)`, 'color: #ef4444', '');
        }
      } catch (err) {
        console.error('%c← ERR%c /views', 'color: #ef4444', '', err);
      }
    }
    fetchViews();
  }, []);

  // Drag state
  const [draggedItem, setDraggedItem] = useState<{ section: 'header' | 'footer'; id: NodeId } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ section: 'header' | 'footer'; id: NodeId } | null>(null);

  const saveConfig = async (newConfig: NavigationConfig) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('%c→ PUT%c /navigation', 'color: #eab308; font-weight: bold', '', newConfig);
      const res = await fetch(`${DEV_EDITOR_URL}/navigation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!res.ok) {
        console.log(`%c← ${res.status}%c /navigation (failed)`, 'color: #ef4444', '');
        throw new Error('Failed to save');
      }

      console.log('%c← 200%c /navigation (saved)', 'color: #22c55e', '');
      setConfig(newConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError('Failed to save navigation config');
    } finally {
      setSaving(false);
    }
  };

  const updateSiteName = (name: string) => {
    const newConfig = { ...config, siteName: name };
    setConfig(newConfig);
  };

  const saveSiteName = () => {
    saveConfig(config);
  };

  const updateItem = (section: 'header' | 'footer', id: NodeId, updates: Partial<NavItem>) => {
    const newConfig = { ...config };
    const items = [...newConfig[section]];
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      newConfig[section] = items;
      saveConfig(newConfig);
    }
  };

  const addItem = (section: 'header' | 'footer') => {
    const newItem: NavItem = {
      id: generateId(),
      label: 'New Link',
      linkType: 'url',
      url: '/',
      position: 'right',
      icon: null,
      external: false,
    };
    const newConfig = { ...config };
    newConfig[section] = [...newConfig[section], newItem];
    saveConfig(newConfig);
  };

  const removeItem = (section: 'header' | 'footer', id: NodeId) => {
    const newConfig = { ...config };
    newConfig[section] = newConfig[section].filter(item => item.id !== id);
    saveConfig(newConfig);
  };

  // Drag handlers
  const handleDragStart = useCallback((section: 'header' | 'footer', id: NodeId) => {
    setDraggedItem({ section, id });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, section: 'header' | 'footer', id: NodeId) => {
    e.preventDefault();
    if (draggedItem && draggedItem.section === section && draggedItem.id !== id) {
      setDragOverItem({ section, id });
    }
  }, [draggedItem]);

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, section: 'header' | 'footer', targetId: NodeId) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.section !== section || draggedItem.id === targetId) {
      setDraggedItem(null);
      return;
    }

    const newConfig = { ...config };
    const items = [...newConfig[section]];
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [dragged] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, dragged);
      newConfig[section] = items;
      saveConfig(newConfig);
    }

    setDraggedItem(null);
  }, [draggedItem, config, saveConfig]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  const moveItem = useCallback((section: 'header' | 'footer', id: NodeId, direction: 'up' | 'down') => {
    const newConfig = { ...config };
    const items = [...newConfig[section]];
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const [moved] = items.splice(index, 1);
    items.splice(newIndex, 0, moved);
    newConfig[section] = items;
    saveConfig(newConfig);
  }, [config, saveConfig]);

  const inputClass = 'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-[length:var(--text-sm)]">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-400 text-[length:var(--text-sm)]">
          Changes saved successfully!
        </div>
      )}

      {/* Site Name */}
      <section>
        <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)] mb-4">
          Site Name
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={config.siteName}
            onChange={(e) => updateSiteName(e.target.value)}
            onBlur={saveSiteName}
            className={inputClass}
            placeholder="Site name"
          />
        </div>
      </section>

      {/* Header Navigation */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
            Header Navigation
          </h2>
          <button
            onClick={() => addItem('header')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Link
          </button>
        </div>
        <div className="space-y-3">
          {config.header.map((item, index) => (
            <NavItemEditor
              key={item.id}
              item={item}
              views={views}
              onUpdate={(updates) => updateItem('header', item.id, updates)}
              onRemove={() => removeItem('header', item.id)}
              isDragging={draggedItem?.id === item.id}
              isDragOver={dragOverItem?.id === item.id}
              onDragStart={() => handleDragStart('header', item.id)}
              onDragOver={(e) => handleDragOver(e, 'header', item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'header', item.id)}
              onDragEnd={handleDragEnd}
              saving={saving}
              showPosition
              isFirst={index === 0}
              isLast={index === config.header.length - 1}
              onMoveUp={() => moveItem('header', item.id, 'up')}
              onMoveDown={() => moveItem('header', item.id, 'down')}
            />
          ))}
          {config.header.length === 0 && (
            <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)] italic py-4 text-center border border-dashed border-[var(--border)] rounded-md">
              No header links. Click &quot;Add Link&quot; to create one.
            </p>
          )}
        </div>
      </section>

      {/* Footer Navigation */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
            Footer Navigation
          </h2>
          <button
            onClick={() => addItem('footer')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Link
          </button>
        </div>
        <div className="space-y-3">
          {config.footer.map((item, index) => (
            <NavItemEditor
              key={item.id}
              item={item}
              views={views}
              onUpdate={(updates) => updateItem('footer', item.id, updates)}
              onRemove={() => removeItem('footer', item.id)}
              isDragging={draggedItem?.id === item.id}
              isDragOver={dragOverItem?.id === item.id}
              onDragStart={() => handleDragStart('footer', item.id)}
              onDragOver={(e) => handleDragOver(e, 'footer', item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'footer', item.id)}
              onDragEnd={handleDragEnd}
              saving={saving}
              isFirst={index === 0}
              isLast={index === config.footer.length - 1}
              onMoveUp={() => moveItem('footer', item.id, 'up')}
              onMoveDown={() => moveItem('footer', item.id, 'down')}
            />
          ))}
          {config.footer.length === 0 && (
            <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)] italic py-4 text-center border border-dashed border-[var(--border)] rounded-md">
              No footer links. Click &quot;Add Link&quot; to create one.
            </p>
          )}
        </div>
      </section>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md px-4 py-2 shadow-lg flex items-center gap-2 text-[length:var(--text-sm)]">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Saving...
        </div>
      )}
    </div>
  );
}
