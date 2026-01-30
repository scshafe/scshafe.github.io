'use client';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-[length:var(--text-base)] font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
        Content (Markdown)
      </h3>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[400px] px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] font-mono text-[length:var(--text-sm)] resize-y focus:outline-none focus:border-[var(--link)] leading-relaxed"
        spellCheck={false}
        placeholder="Write your content in Markdown..."
      />
      <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
        Supports GitHub Flavored Markdown: headings, lists, code blocks, links, images, tables, and more.
      </p>
    </div>
  );
}
