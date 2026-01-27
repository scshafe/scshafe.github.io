import { getNavigationConfig } from '@/lib/content/navigation';
import { getThemeConfig } from '@/lib/content/themes.server';
import { SettingsPage } from '@/components/settings/SettingsPage';

export const metadata = {
  title: 'Settings - Author Mode',
  robots: 'noindex, nofollow',
};

export default function Settings() {
  // This page is only accessible in author mode
  // The component will handle showing an error if accessed in publish mode
  const navConfig = getNavigationConfig();
  const themeConfig = getThemeConfig();

  return (
    <SettingsPage
      initialNavConfig={navConfig}
      initialThemeConfig={themeConfig}
    />
  );
}
