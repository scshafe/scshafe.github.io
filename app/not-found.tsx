import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6">
        <svg
          className="w-24 h-24 text-[var(--foreground-muted)] mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-[length:var(--text-4xl)] font-bold mb-4 tracking-tight text-[var(--foreground)]">
        404
      </h1>
      <p className="text-[length:var(--text-xl)] text-[var(--foreground-secondary)] mb-2">
        Page not found
      </p>
      <p className="text-[length:var(--text-base)] text-[var(--foreground-muted)] mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[var(--link)] text-white px-6 py-3 rounded-lg hover:bg-[var(--link-hover)] transition-colors hover:no-underline font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Go back home
      </Link>
    </div>
  );
}
