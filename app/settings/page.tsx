import { getNavigationConfig, getSiteConfig } from '@/lib/content/navigation';
import { getThemeConfig } from '@/lib/content/themes.server';
import { getAllViews } from '@/lib/content/views.server';
import { SettingsPage } from '@/components/settings/SettingsPage';

export const metadata = {
  title: 'Settings - Author Mode',
  robots: 'noindex, nofollow',
};

export default async function Settings() {
  // This page is only accessible in author mode
  // The component will handle showing an error if accessed in publish mode
  const navConfig = getNavigationConfig();
  const themeConfig = getThemeConfig();
  const views = await getAllViews();
  const siteConfig = getSiteConfig();

  return (
    <SettingsPage
      initialNavConfig={navConfig}
      initialThemeConfig={themeConfig}
      initialViews={views}
      initialSiteConfig={siteConfig}
    />
  );
}
