'use client';

import { useState } from 'react';
import { InlineText, InlineMarkdown } from '@/components/author';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface EditableHomePageProps {
  initialTitle: string;
  initialDescription: string;
  initialContent: string;
  initialHtmlContent: string;
}

export function EditableHomePage({
  initialTitle,
  initialDescription,
  initialContent,
  initialHtmlContent,
}: EditableHomePageProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [content, setContent] = useState(initialContent);
  const [htmlContent, setHtmlContent] = useState(initialHtmlContent);

  const saveField = async (field: string, value: string) => {
    // Update local state first for immediate feedback
    if (field === 'title') setTitle(value);
    if (field === 'description') setDescription(value);
    if (field === 'content') setContent(value);

    // Save to server
    const res = await fetch(`${DEV_EDITOR_URL}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'home',
        metadata: {
          title: field === 'title' ? value : title,
          description: field === 'description' ? value : description,
        },
        content: field === 'content' ? value : content,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to save');
    }

    // If content changed, we need to refresh to get the new HTML
    if (field === 'content') {
      // Fetch updated content to get new HTML
      const getRes = await fetch(`${DEV_EDITOR_URL}/content?type=home`);
      if (getRes.ok) {
        const data = await getRes.json();
        // For now, just reload to get fresh HTML render
        window.location.reload();
      }
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <InlineText
          value={title}
          onSave={(value) => saveField('title', value)}
          as="h1"
          className="text-[length:var(--text-3xl)] font-bold text-[var(--foreground)]"
          placeholder="Page Title"
        />
      </div>
      <InlineMarkdown
        content={content}
        htmlContent={htmlContent}
        onSave={(value) => saveField('content', value)}
        placeholder="Add page content..."
      />
    </div>
  );
}
