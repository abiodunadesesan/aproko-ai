import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { SearchSkeleton } from '@/components/app/search-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function SearchLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.search}>
      <SearchSkeleton />
    </AppLoadingShell>
  );
}
