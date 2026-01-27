'use client';

import { useState } from 'react';
import { InlineText, InlineMarkdown } from '@/components/author';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface EditableAboutPageProps {
  initialTitle: string;
  initialDescription: string;
  initialContent: string;
  initialHtmlContent: string;
}

export function EditableAboutPage({
  initialTitle,
  initialDescription,
  initialContent,
  initialHtmlContent,
}: EditableAboutPageProps) {
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
        type: 'about',
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

    // If content changed, reload to get fresh HTML render
    if (field === 'content') {
      window.location.reload();
    }
  };

  return (
    <>
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
    </>
  );
}
