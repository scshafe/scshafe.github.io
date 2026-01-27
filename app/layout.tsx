import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthorModeProvider, EditorPanel } from '@/components/author';
import { ThemeProvider } from '@/components/theme';
import { getNavigationConfig } from '@/lib/content/navigation';
import { getThemeConfig } from '@/lib/content/themes.server';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
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

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthorModeProvider>
          <ThemeProvider config={themeConfig}>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Header siteName={navConfig.siteName} navItems={navConfig.header} />
            <main
              id="main-content"
              className="flex-1 max-w-4xl mx-auto px-4 py-[var(--space-lg)] w-full"
              tabIndex={-1}
            >
              {children}
            </main>
            <Footer siteName={navConfig.siteName} navItems={navConfig.footer} />
            <EditorPanel />
          </ThemeProvider>
        </AuthorModeProvider>
      </body>
    </html>
  );
}
