'use client';

import { useState, useCallback } from 'react';
import { ExperienceCard } from './ExperienceCard';
import { useAuthorMode } from '@/components/author/DevModeProvider';

interface Experience {
  id: string;
  frontmatter: {
    title: string;
    company?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    image?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
  content: string;
  htmlContent: string;
}

interface ExperienceListProps {
  experiences: Experience[];
}

const DEV_EDITOR_URL = 'http://localhost:3001';

export function ExperienceList({ experiences: initialExperiences }: ExperienceListProps) {
  const { isAuthorMode, setEditingContent } = useAuthorMode();
  const [experiences, setExperiences] = useState(initialExperiences);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // Reorder locally
    const newExperiences = [...experiences];
    const draggedIndex = newExperiences.findIndex(exp => exp.id === draggedId);
    const targetIndex = newExperiences.findIndex(exp => exp.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const [dragged] = newExperiences.splice(draggedIndex, 1);
    newExperiences.splice(targetIndex, 0, dragged);

    setExperiences(newExperiences);
    setDraggedId(null);

    // Save new order to server
    if (isAuthorMode) {
      setSaving(true);
      try {
        const newOrder = newExperiences.map(exp => exp.id);
        await fetch(`${DEV_EDITOR_URL}/experiences/order`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newOrder }),
        });
      } catch (err) {
        console.error('Failed to save order:', err);
      } finally {
        setSaving(false);
      }
    }
  }, [draggedId, experiences, isAuthorMode]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingContent({ type: 'experience', slug: '__new__' });
  }, [setEditingContent]);

  if (experiences.length === 0 && !isAuthorMode) {
    return null;
  }

  return (
    <section className="mt-[var(--space-2xl)]">
      <div className="flex items-center justify-between mb-[var(--space-md)]">
        <h2 className="text-[length:var(--text-2xl)] font-bold text-[var(--foreground)]">
          Experience
        </h2>
        {isAuthorMode && (
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                Saving...
              </span>
            )}
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Experience
            </button>
          </div>
        )}
      </div>

      {experiences.length === 0 ? (
        <p className="text-[var(--foreground-muted)] italic">
          No experiences yet. Click &quot;Add Experience&quot; to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              draggable={isAuthorMode}
              onDragStart={(e) => handleDragStart(e, exp.id)}
              onDragOver={(e) => handleDragOver(e, exp.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, exp.id)}
              onDragEnd={handleDragEnd}
              className={`
                transition-transform duration-150
                ${dragOverId === exp.id && draggedId !== exp.id ? 'translate-y-2' : ''}
              `}
            >
              <ExperienceCard
                id={exp.id}
                title={exp.frontmatter.title}
                company={exp.frontmatter.company}
                role={exp.frontmatter.role}
                startDate={exp.frontmatter.startDate}
                endDate={exp.frontmatter.endDate}
                image={exp.frontmatter.image}
                content={exp.content}
                htmlContent={exp.htmlContent}
                backgroundColor={exp.frontmatter.backgroundColor}
                textColor={exp.frontmatter.textColor}
                accentColor={exp.frontmatter.accentColor}
                isDragging={draggedId === exp.id}
                dragHandleProps={isAuthorMode ? {} : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
