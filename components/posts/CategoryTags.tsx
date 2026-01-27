import Link from 'next/link';

interface CategoryTagsProps {
  categories: string[];
}

export default function CategoryTags({ categories }: CategoryTagsProps) {
  return (
    <ul className="flex flex-wrap gap-2 list-none p-0" aria-label="Categories">
      {categories.map((category) => (
        <li key={category}>
          <Link
            href={`/category/${category.toLowerCase()}/`}
            className="inline-flex items-center gap-1 bg-[var(--background-secondary)] text-[var(--foreground-secondary)] px-2.5 py-1 rounded-md text-[length:var(--text-xs)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition-colors hover:no-underline"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {category}
          </Link>
        </li>
      ))}
    </ul>
  );
}
