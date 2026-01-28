'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type {
  View,
  ViewComponent,
  TitleComponent,
  InformationComponent,
  AlertComponent,
  MarkdownEditorComponent,
  ListComponent,
  BlogPostComponent,
  ViewLinkComponent,
  MultiMediaComponent,
  PDFViewerComponent,
  TagListComponent,
  ListItemType,
} from '@/lib/content/views';
import { getComponentTypeOptions, getListItemTypeOptions } from '@/lib/content/views';

interface PostOption {
  slug: string;
  title: string;
}

// Simple fuzzy match function
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

interface InlineComponentEditorProps {
  component: ViewComponent;
  onSave: (component: ViewComponent) => void;
  onCancel: () => void;
}

export function InlineComponentEditor({
  component,
  onSave,
  onCancel,
}: InlineComponentEditorProps) {
  const [formData, setFormData] = useState<ViewComponent>(component);
  const [views, setViews] = useState<View[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [isPostDropdownOpen, setIsPostDropdownOpen] = useState(false);
  const postDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch views for the View component dropdown
  useEffect(() => {
    async function fetchViews() {
      try {
        const res = await fetch('http://localhost:3001/views');
        if (res.ok) {
          const data = await res.json();
          const viewsList = Array.isArray(data) ? data : (data.items || data.views || []);
          setViews(viewsList);
        }
      } catch (err) {
        console.error('Failed to fetch views:', err);
      }
    }
    // Only fetch if editing a View component
    if (component.type === 'View') {
      fetchViews();
    }
  }, [component.type]);

  // Fetch posts for the BlogPost component dropdown
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('http://localhost:3001/posts');
        if (res.ok) {
          const postsData = await res.json();
          const postsList: PostOption[] = Object.entries(postsData)
            .filter(([, meta]: [string, unknown]) => {
              const m = meta as { layout?: string };
              return m.layout !== 'hidden';
            })
            .map(([slug, meta]: [string, unknown]) => {
              const m = meta as { title: string };
              return { slug, title: m.title };
            })
            .sort((a, b) => a.title.localeCompare(b.title));
          setPosts(postsList);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      }
    }
    if (component.type === 'BlogPost') {
      fetchPosts();
    }
  }, [component.type]);

  // Close post dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (postDropdownRef.current && !postDropdownRef.current.contains(event.target as Node)) {
        setIsPostDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter posts based on search query with fuzzy matching
  const filteredPosts = useMemo(() => {
    if (!postSearchQuery) return posts;
    return posts.filter(p =>
      fuzzyMatch(p.title, postSearchQuery) || fuzzyMatch(p.slug, postSearchQuery)
    );
  }, [posts, postSearchQuery]);

  // Get the title for the selected post
  const selectedPostTitle = useMemo(() => {
    const config = (formData as BlogPostComponent).config;
    if (!config?.postSlug) return '';
    const post = posts.find(p => p.slug === config.postSlug);
    return post?.title || config.postSlug;
  }, [formData, posts]);

  const componentTypeLabels = Object.fromEntries(
    getComponentTypeOptions().map((opt) => [opt.type, opt.label])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateConfig = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    } as ViewComponent));
  };

  const renderConfigEditor = () => {
    switch (formData.type) {
      case 'Title': {
        const config = (formData as TitleComponent).config;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={config.showTitle}
                onChange={(e) => updateConfig('showTitle', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showTitle" className="text-[var(--foreground)]">
                Show title
              </label>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Heading Level
              </label>
              <select
                value={config.level || 'h1'}
                onChange={(e) => updateConfig('level', e.target.value as 'h1' | 'h2' | 'h3')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="h1">H1 (Largest)</option>
                <option value="h2">H2 (Medium)</option>
                <option value="h3">H3 (Smaller)</option>
              </select>
            </div>
          </div>
        );
      }

      case 'Information': {
        const config = (formData as InformationComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Content
              </label>
              <textarea
                value={config.content}
                onChange={(e) => updateConfig('content', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] resize-none"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Style
              </label>
              <select
                value={config.style || 'default'}
                onChange={(e) => updateConfig('style', e.target.value as 'default' | 'callout' | 'card')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="default">Default</option>
                <option value="callout">Callout</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
        );
      }

      case 'Alert': {
        const config = (formData as AlertComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Content
              </label>
              <textarea
                value={config.content}
                onChange={(e) => updateConfig('content', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Variant
              </label>
              <select
                value={config.variant}
                onChange={(e) => updateConfig('variant', e.target.value as 'info' | 'warning' | 'error' | 'success')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dismissible"
                checked={config.dismissible || false}
                onChange={(e) => updateConfig('dismissible', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="dismissible" className="text-[var(--foreground)]">
                Dismissible
              </label>
            </div>
          </div>
        );
      }

      case 'MarkdownEditor': {
        const config = (formData as MarkdownEditorComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Content Key
              </label>
              <input
                type="text"
                value={config.contentKey}
                onChange={(e) => updateConfig('contentKey', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              />
              <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mt-1">
                Unique key to store this content
              </p>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={config.placeholder || ''}
                onChange={(e) => updateConfig('placeholder', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              />
            </div>
          </div>
        );
      }

      case 'List': {
        const config = (formData as ListComponent).config;
        const listItemOptions = getListItemTypeOptions();
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Item Type
              </label>
              <select
                value={config.listType || 'Experience'}
                onChange={(e) => updateConfig('listType', e.target.value as ListItemType)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                {listItemOptions.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Display Mode
              </label>
              <select
                value={config.displayMode || 'list'}
                onChange={(e) => updateConfig('displayMode', e.target.value as 'list' | 'grid' | 'cards')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="list">List (vertical)</option>
                <option value="grid">Grid (responsive columns)</option>
                <option value="cards">Cards (2 columns)</option>
              </select>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Name
              </label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                placeholder="e.g., Experience, Work History"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showName"
                checked={config.showName ?? true}
                onChange={(e) => updateConfig('showName', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showName" className="text-[var(--foreground)]">
                Show name
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="collapsible"
                checked={config.collapsible ?? false}
                onChange={(e) => updateConfig('collapsible', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="collapsible" className="text-[var(--foreground)]">
                Collapsible (with chevron in publish mode)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="defaultExpanded"
                checked={config.defaultExpanded ?? true}
                onChange={(e) => updateConfig('defaultExpanded', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="defaultExpanded" className="text-[var(--foreground)]">
                Expanded by default
              </label>
            </div>
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAddButton"
                  checked={config.showAddButton ?? true}
                  onChange={(e) => updateConfig('showAddButton', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="showAddButton" className="text-[var(--foreground)]">
                  Show &quot;Add Item&quot; button
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Max Items (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={config.maxItems || 0}
                onChange={(e) => updateConfig('maxItems', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              />
            </div>
          </div>
        );
      }

      case 'BlogPost': {
        const config = (formData as BlogPostComponent).config;
        return (
          <div className="space-y-4">
            <div ref={postDropdownRef} className="relative">
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Select Post
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={isPostDropdownOpen ? postSearchQuery : selectedPostTitle}
                  onChange={(e) => {
                    setPostSearchQuery(e.target.value);
                    setIsPostDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setPostSearchQuery('');
                    setIsPostDropdownOpen(true);
                  }}
                  placeholder="Search posts..."
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--link)]"
                />
                {config.postSlug && !isPostDropdownOpen && (
                  <button
                    type="button"
                    onClick={() => updateConfig('postSlug', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {isPostDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 z-50 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredPosts.length > 0 ? (
                      filteredPosts.map((p) => (
                        <button
                          key={p.slug}
                          type="button"
                          onClick={() => {
                            updateConfig('postSlug', p.slug);
                            setIsPostDropdownOpen(false);
                            setPostSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[var(--background-secondary)] transition-colors border-b border-[var(--border)] last:border-b-0"
                        >
                          <div className="font-medium text-[var(--foreground)]">{p.title}</div>
                          <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">{p.slug}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-[var(--foreground-muted)]">
                        No posts found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showExcerpt"
                checked={config.showExcerpt !== false}
                onChange={(e) => updateConfig('showExcerpt', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showExcerpt" className="text-[var(--foreground)]">
                Show excerpt
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showDate"
                checked={config.showDate !== false}
                onChange={(e) => updateConfig('showDate', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showDate" className="text-[var(--foreground)]">
                Show date
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showTags"
                checked={config.showTags !== false}
                onChange={(e) => updateConfig('showTags', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showTags" className="text-[var(--foreground)]">
                Show tags
              </label>
            </div>
          </div>
        );
      }

      case 'View': {
        const config = (formData as ViewLinkComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Target View
              </label>
              <select
                value={config.targetViewId ?? ''}
                onChange={(e) => updateConfig('targetViewId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="">Select a view...</option>
                {views.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name} ({view.path})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Display Style
              </label>
              <select
                value={config.displayStyle}
                onChange={(e) => updateConfig('displayStyle', e.target.value as 'link' | 'card' | 'button')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="link">Link</option>
                <option value="card">Card</option>
                <option value="button">Button</option>
              </select>
            </div>
          </div>
        );
      }

      case 'MultiMedia': {
        const config = (formData as MultiMediaComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Media Type
              </label>
              <select
                value={config.mediaType}
                onChange={(e) => updateConfig('mediaType', e.target.value as 'image' | 'video' | 'embed')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="embed">Embed (iframe)</option>
              </select>
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Source URL
              </label>
              <input
                type="text"
                value={config.src}
                onChange={(e) => updateConfig('src', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={config.alt || ''}
                onChange={(e) => updateConfig('alt', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Caption
              </label>
              <input
                type="text"
                value={config.caption || ''}
                onChange={(e) => updateConfig('caption', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              />
            </div>
          </div>
        );
      }

      case 'PDFViewer': {
        const config = (formData as PDFViewerComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                placeholder="e.g., My Resume"
              />
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                PDF File
              </label>
              {config.src ? (
                <div className="flex items-center gap-2 p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
                    <text x="7" y="17" fontSize="6" fontWeight="bold" fill="white">PDF</text>
                  </svg>
                  <span className="flex-1 text-[length:var(--text-sm)] text-[var(--foreground)] truncate">
                    {config.src.split('/').pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateConfig('src', '')}
                    className="p-1 text-[var(--foreground-muted)] hover:text-red-500 transition-colors"
                    title="Remove PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--border)] rounded-md cursor-pointer hover:border-[var(--link)] hover:bg-[var(--background-secondary)] transition-colors">
                  <svg className="w-8 h-8 text-[var(--foreground-muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
                    Click to upload PDF
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Read file as base64
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = (reader.result as string).split(',')[1];
                        try {
                          const res = await fetch('http://localhost:3001/upload-pdf', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              base64,
                              filename: file.name,
                              componentId: formData.id,
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            updateConfig('src', data.path);
                          } else {
                            console.error('Upload failed:', data.error);
                          }
                        } catch (err) {
                          console.error('Upload error:', err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Height
              </label>
              <input
                type="text"
                value={config.height || '600px'}
                onChange={(e) => updateConfig('height', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                placeholder="e.g., 600px"
              />
            </div>
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mb-2">Display Options</p>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="displayTitle"
                  checked={config.displayTitle ?? true}
                  onChange={(e) => updateConfig('displayTitle', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="displayTitle" className="text-[var(--foreground)]">
                  Display title
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="downloadButton"
                  checked={config.downloadButton ?? true}
                  onChange={(e) => updateConfig('downloadButton', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="downloadButton" className="text-[var(--foreground)]">
                  Show download button
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="displayPdf"
                  checked={config.displayPdf ?? true}
                  onChange={(e) => updateConfig('displayPdf', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="displayPdf" className="text-[var(--foreground)]">
                  Display PDF in browser
                </label>
              </div>
            </div>
          </div>
        );
      }

      case 'TagList': {
        const config = (formData as TagListComponent).config;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                Source Type
              </label>
              <select
                value={config.sourceType}
                onChange={(e) => updateConfig('sourceType', e.target.value as 'posts' | 'custom')}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
              >
                <option value="posts">From Posts</option>
                <option value="custom">Custom Tags</option>
              </select>
            </div>
            {config.sourceType === 'custom' && (
              <div>
                <label className="block text-[length:var(--text-sm)] text-[var(--foreground)] mb-1">
                  Custom Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={(config.customTags || []).join(', ')}
                  onChange={(e) =>
                    updateConfig(
                      'customTags',
                      e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="linkToFilter"
                checked={config.linkToFilter || false}
                onChange={(e) => updateConfig('linkToFilter', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="linkToFilter" className="text-[var(--foreground)]">
                Link tags to category filter
              </label>
            </div>
          </div>
        );
      }

      default:
        return (
          <p className="text-[var(--foreground-muted)]">
            No configuration options for this component type.
          </p>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]">
            Edit {componentTypeLabels[component.type] || component.type}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">{renderConfigEditor()}</div>

        <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--background-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-3 py-1.5 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
