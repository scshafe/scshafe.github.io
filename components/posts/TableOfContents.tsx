'use client';

import { useEffect, useState, useCallback } from 'react';
import type { TocItem } from '@/lib/content/types';

interface TableOfContentsProps {
  items: TocItem[];
}

function TocLink({ item, activeId, onClick }: { item: TocItem; activeId: string; onClick?: () => void }) {
  const isActive = activeId === item.id;

  return (
    <li className="my-0.5">
      <a
        href={`#${item.id}`}
        onClick={onClick}
        className={`block py-1.5 text-[length:var(--text-sm)] transition-all hover:text-[var(--link-hover)] hover:no-underline border-l-2 -ml-[2px] ${
          isActive
            ? 'text-[var(--link)] font-medium border-[var(--link)]'
            : 'text-[var(--foreground-muted)] border-transparent hover:border-[var(--foreground-muted)]'
        }`}
        style={{ paddingLeft: `${(item.depth - 1) * 0.75 + 0.75}rem` }}
        aria-current={isActive ? 'location' : undefined}
      >
        {item.value}
      </a>
      {item.children.length > 0 && (
        <ul className="list-none pl-0">
          {item.children.map((child) => (
            <TocLink key={child.id} item={child} activeId={activeId} onClick={onClick} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    const headings = document.querySelectorAll('h1[id], h2[id], h3[id]');
    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLinkClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile TOC Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-full p-3 shadow-lg hover:bg-[var(--border)] transition-colors"
          aria-expanded={isOpen}
          aria-controls="mobile-toc"
          aria-label={isOpen ? 'Close table of contents' : 'Open table of contents'}
        >
          <svg
            className="w-6 h-6 text-[var(--foreground)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile TOC Panel */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-toc"
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--border)] z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl"
            aria-label="Table of contents"
          >
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
              <h4 className="text-[length:var(--text-sm)] font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider">
                Table of Contents
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close table of contents"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ul className="list-none p-4 border-l border-[var(--border)] ml-4">
              {items.map((item) => (
                <TocLink key={item.id} item={item} activeId={activeId} onClick={handleLinkClick} />
              ))}
            </ul>
          </nav>
        </>
      )}

      {/* Desktop TOC */}
      <nav
        className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
        aria-label="Table of contents"
      >
        <h4 className="text-[length:var(--text-sm)] font-semibold text-[var(--foreground-secondary)] mb-3 uppercase tracking-wider">
          On this page
        </h4>
        <ul className="list-none pl-0 border-l border-[var(--border)]">
          {items.map((item) => (
            <TocLink key={item.id} item={item} activeId={activeId} />
          ))}
        </ul>
      </nav>
    </>
  );
}
