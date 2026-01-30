import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { StoreProvider } from '@/lib/store/StoreProvider';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { EditorPanel } from '@/components/author';
import { getNavigationConfig } from '@/lib/content/navigation';
import { getThemeConfig } from '@/lib/content/themes.server';
import { getAllViews, getViewsSync } from '@/lib/content/views.server';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "scshafe's Blog",
  description: 'A blog about Linux, embedded systems, and software engineering.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navConfig = getNavigationConfig();
  const themeConfig = getThemeConfig();
  const isAuthorMode = process.env.NEXT_PUBLIC_BUILD_MODE === 'author';

  // In Author Mode, fetch fresh data from API; in production, use file
  const views = isAuthorMode ? await getAllViews() : getViewsSync();
  console.log(`[layout] Loaded ${views.length} views (isAuthorMode=${isAuthorMode})`);

  return (
    <html lang="en">
      <meta property="og:title" content="hi, i'm cole." />
      <meta property="og:description" content="eecs|ai|physics" />
      <meta property="og:image" content="https://scshafe.github.io/professional-website.png" />
      <meta property="og:url" content="https://scshafe.github.io" />
      <meta property="og:type" content="website" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <StoreProvider
          themeConfig={themeConfig}
          navigationConfig={navConfig}
          views={views}
          isAuthorMode={isAuthorMode}
        >
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Header />
          <main
            id="main-content"
            className="flex-1 max-w-4xl mx-auto px-4 py-[var(--space-lg)] w-full"
            tabIndex={-1}
          >
            {children}
          </main>
          <Footer />
          <EditorPanel />
        </StoreProvider>
      </body>
    </html>
  );
}
