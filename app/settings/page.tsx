import { getNavigationConfig } from '@/lib/content/navigation';
import { getThemeConfig } from '@/lib/content/themes.server';
import { getViewsConfig } from '@/lib/content/views.server';
import { SettingsPage } from '@/app/components/settings/SettingsPage';

export const metadata = {
  title: 'Settings - Author Mode',
  robots: 'noindex, nofollow',
};

export default async function Settings() {
  // This page is only accessible in author mode
  // The component will handle showing an error if accessed in publish mode
  const navConfig = getNavigationConfig();
  const themeConfig = getThemeConfig();
  const viewsConfig = await getViewsConfig();

  return (
    <SettingsPage
      initialNavConfig={navConfig}
      initialThemeConfig={themeConfig}
      initialViewsConfig={viewsConfig}
    />
  );
}
