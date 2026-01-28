'use client';

import { useState } from 'react';
import { TagInput } from '@/app/components/ui';

const DEV_EDITOR_URL = 'http://localhost:3001';

function parseCategories(categories: string | string[] | undefined): string[] {
  if (!categories) return [];
  if (Array.isArray(categories)) return categories;
  return categories
    .split(/[,\s]+/)
    .map((cat) => cat.trim())
    .filter(Boolean);
}

interface FrontmatterEditorProps {
  frontmatter: Record<string, unknown>;
  onChange: (fm: Record<string, unknown>) => void;
  contentType: 'post' | 'about' | 'experience' | 'home';
  /** All existing tags from all posts for autocomplete suggestions */
  allTags?: string[];
}

export function FrontmatterEditor({ frontmatter, onChange, contentType, allTags = [] }: FrontmatterEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [colorSchemeUrl, setColorSchemeUrl] = useState('');
  const [fetchingImage, setFetchingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const updateField = (key: string, value: unknown) => {
    onChange({ ...frontmatter, [key]: value });
  };

  const handleFetchImage = async () => {
    if (!imageUrl.trim()) return;

    setFetchingImage(true);
    setImageError(null);
    setImagePreview(null);

    try {
      const res = await fetch(`${DEV_EDITOR_URL}/fetch-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImageError(data.error || 'Failed to fetch image');
        return;
      }

      // Show preview
      setImagePreview(`data:${data.contentType};base64,${data.base64}`);

    } catch {
      setImageError('Failed to connect to server');
    } finally {
      setFetchingImage(false);
    }
  };

  const handleSaveImage = async () => {
    if (!imagePreview) return;

    setFetchingImage(true);
    setImageError(null);

    try {
      // Extract base64 and content type from preview
      const [header, base64Data] = imagePreview.split(',');
      const contentType = header.match(/data:(.*?);/)?.[1] || 'image/png';
      const extension = contentType.split('/')[1] ? `.${contentType.split('/')[1]}` : '.png';

      // Generate experience ID from title
      const title = (frontmatter.title as string) || 'experience';
      const experienceId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const res = await fetch(`${DEV_EDITOR_URL}/save-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: base64Data,
          extension,
          experienceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImageError(data.error || 'Failed to save image');
        return;
      }

      // Update the image field with the saved path
      updateField('image', data.path);
      setImagePreview(null);
      setImageUrl('');

    } catch {
      setImageError('Failed to save image');
    } finally {
      setFetchingImage(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';
  const labelClass = 'block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5';
  const checkboxLabelClass = 'text-[length:var(--text-sm)] text-[var(--foreground-secondary)]';
  const buttonClass = 'px-3 py-2 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  if (contentType === 'about' || contentType === 'home') {
    const pageTitle = contentType === 'about' ? 'About Page Settings' : 'Home Page Settings';
    return (
      <div className="space-y-4">
        <h3 className="text-[length:var(--text-base)] font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
          {pageTitle}
        </h3>
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={(frontmatter.title as string) || ''}
            onChange={(e) => updateField('title', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={(frontmatter.description as string) || ''}
            onChange={(e) => updateField('description', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    );
  }

  if (contentType === 'experience') {
    return (
      <div className="space-y-4">
        <h3 className="text-[length:var(--text-base)] font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
          Experience Details
        </h3>
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={(frontmatter.title as string) || ''}
            onChange={(e) => updateField('title', e.target.value)}
            className={inputClass}
            placeholder="e.g., Software Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Company</label>
            <input
              type="text"
              value={(frontmatter.company as string) || ''}
              onChange={(e) => updateField('company', e.target.value)}
              className={inputClass}
              placeholder="e.g., Acme Corp"
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <input
              type="text"
              value={(frontmatter.role as string) || ''}
              onChange={(e) => updateField('role', e.target.value)}
              className={inputClass}
              placeholder="e.g., Senior Developer"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="text"
              value={(frontmatter.startDate as string) || ''}
              onChange={(e) => updateField('startDate', e.target.value)}
              className={inputClass}
              placeholder="e.g., Jan 2020"
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="text"
              value={(frontmatter.endDate as string) || ''}
              onChange={(e) => updateField('endDate', e.target.value)}
              className={inputClass}
              placeholder="e.g., Dec 2023 or leave empty for Present"
            />
          </div>
        </div>
        {/* Image Section */}
        <div className="border border-[var(--border)] rounded-lg p-4 space-y-3">
          <h4 className="text-[length:var(--text-sm)] font-medium text-[var(--foreground)]">
            Image
          </h4>
          <div>
            <label className={labelClass}>Current Image Path</label>
            <input
              type="text"
              value={(frontmatter.image as string) || ''}
              onChange={(e) => updateField('image', e.target.value)}
              className={inputClass}
              placeholder="/images/experiences/company-logo.png"
            />
          </div>
          <div>
            <label className={labelClass}>Find Image (fetch from URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
                placeholder="https://example.com/logo.png"
              />
              <button
                type="button"
                onClick={handleFetchImage}
                disabled={fetchingImage || !imageUrl.trim()}
                className={buttonClass}
              >
                {fetchingImage ? 'Fetching...' : 'Fetch'}
              </button>
            </div>
          </div>
          {imageError && (
            <p className="text-[length:var(--text-sm)] text-red-400">{imageError}</p>
          )}
          {imagePreview && (
            <div className="space-y-2">
              <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">Preview:</p>
              <div className="flex items-start gap-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-32 max-h-32 object-contain border border-[var(--border)] rounded"
                />
                <button
                  type="button"
                  onClick={handleSaveImage}
                  disabled={fetchingImage}
                  className={buttonClass}
                >
                  {fetchingImage ? 'Saving...' : 'Save & Use'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Color Scheme Section */}
        <div className="border border-[var(--border)] rounded-lg p-4 space-y-3">
          <h4 className="text-[length:var(--text-sm)] font-medium text-[var(--foreground)]">
            Style Overrides (optional)
          </h4>
          <div>
            <label className={labelClass}>Find Color Scheme (from URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={colorSchemeUrl}
                onChange={(e) => setColorSchemeUrl(e.target.value)}
                className={inputClass}
                placeholder="https://example.com/brand-page"
              />
              <button
                type="button"
                disabled={true}
                className={`${buttonClass} opacity-50 cursor-not-allowed`}
                title="Coming soon"
              >
                Fetch
              </button>
            </div>
            <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mt-1">
              Coming soon: Extract colors from a webpage
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Background Color</label>
              <input
                type="text"
                value={(frontmatter.backgroundColor as string) || ''}
                onChange={(e) => updateField('backgroundColor', e.target.value)}
                className={inputClass}
                placeholder="#ffffff"
              />
            </div>
            <div>
              <label className={labelClass}>Text Color</label>
              <input
                type="text"
                value={(frontmatter.textColor as string) || ''}
                onChange={(e) => updateField('textColor', e.target.value)}
                className={inputClass}
                placeholder="#000000"
              />
            </div>
            <div>
              <label className={labelClass}>Accent Color</label>
              <input
                type="text"
                value={(frontmatter.accentColor as string) || ''}
                onChange={(e) => updateField('accentColor', e.target.value)}
                className={inputClass}
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post frontmatter
  return (
    <div className="space-y-4">
      <h3 className="text-[length:var(--text-base)] font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
        Post Metadata
      </h3>
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          value={(frontmatter.title as string) || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Date (ticks)</label>
        <input
          type="number"
          value={(frontmatter.date as number) || ''}
          onChange={(e) => updateField('date', parseInt(e.target.value, 10) || 0)}
          className={inputClass}
          placeholder="Milliseconds since epoch"
        />
      </div>
      <div>
        <TagInput
          tags={parseCategories(frontmatter.categories as string | string[] | undefined)}
          allTags={allTags}
          onChange={(tags) => updateField('categories', tags)}
          label="Tags"
          placeholder="Add tags..."
        />
      </div>
      <div>
        <label className={labelClass}>Layout</label>
        <select
          value={(frontmatter.layout as string) || 'post'}
          onChange={(e) => updateField('layout', e.target.value)}
          className={inputClass}
        >
          <option value="post">Post (visible)</option>
          <option value="hidden">Hidden (draft)</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="toc"
          checked={Boolean(frontmatter.toc)}
          onChange={(e) => updateField('toc', e.target.checked)}
          className="w-4 h-4 rounded border-[var(--border)] bg-[var(--background)] text-[var(--link)]"
        />
        <label htmlFor="toc" className={checkboxLabelClass}>
          Show Table of Contents
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_series"
          checked={Boolean(frontmatter.is_series)}
          onChange={(e) => updateField('is_series', e.target.checked)}
          className="w-4 h-4 rounded border-[var(--border)] bg-[var(--background)] text-[var(--link)]"
        />
        <label htmlFor="is_series" className={checkboxLabelClass}>
          Part of a Series
        </label>
      </div>
      {Boolean(frontmatter.is_series) && (
        <div>
          <label className={labelClass}>Series Title</label>
          <input
            type="text"
            value={(frontmatter.series_title as string) || ''}
            onChange={(e) => updateField('series_title', e.target.value)}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
