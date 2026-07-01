import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { SettingsSkeleton } from '@/components/app/settings-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function SettingsLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.settings}>
      <SettingsSkeleton />
    </AppLoadingShell>
  );
}
