import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { SettingsSkeleton } from '@/components/app/settings-skeleton';

export default function SettingsLoading() {
  return (
    <AppLoadingShell pageId="settings">
      <SettingsSkeleton />
    </AppLoadingShell>
  );
}
