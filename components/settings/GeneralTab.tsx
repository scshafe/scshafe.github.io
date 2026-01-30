'use client';

import { useState } from 'react';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface SiteConfig {
  site_name: string;
}

interface GeneralTabProps {
  initialConfig: SiteConfig;
}

export function GeneralTab({ initialConfig }: GeneralTabProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveConfig = async (newConfig: SiteConfig) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('%c→ PUT%c /site', 'color: #eab308; font-weight: bold', '', newConfig);
      const res = await fetch(`${DEV_EDITOR_URL}/site`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!res.ok) {
        console.log(`%c← ${res.status}%c /site (failed)`, 'color: #ef4444', '');
        throw new Error('Failed to save');
      }

      console.log('%c← 200%c /site (saved)', 'color: #22c55e', '');
      setConfig(newConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError('Failed to save site configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateSiteName = (name: string) => {
    setConfig({ ...config, site_name: name });
  };

  const saveSiteName = () => {
    saveConfig(config);
  };

  const inputClass = 'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[length:var(--text-sm)]">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-400">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[length:var(--text-sm)]">Changes saved!</span>
        </div>
      )}

      {/* Site Name */}
      <section>
        <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)] mb-2">
          Site Name
        </h2>
        <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] mb-4">
          The name displayed in the header and browser tab.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={config.site_name}
            onChange={(e) => updateSiteName(e.target.value)}
            onBlur={saveSiteName}
            className={inputClass}
            placeholder="Site name"
            disabled={saving}
          />
        </div>
      </section>
    </div>
  );
}
