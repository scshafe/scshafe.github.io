import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { StoreProvider } from '@/lib/store/StoreProvider';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import { EditorPanel } from '@/app/components/author';
import { getNavigationConfig } from '@/lib/content/navigation';
import { getThemeConfig } from '@/lib/content/themes.server';
import { getViewsSync } from '@/lib/content/views.server';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navConfig = getNavigationConfig();
  const themeConfig = getThemeConfig();
  const views = getViewsSync();
  const isAuthorMode = process.env.NEXT_PUBLIC_BUILD_MODE === 'author';

  return (
    <html lang="en">
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
