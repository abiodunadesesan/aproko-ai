import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { SearchSkeleton } from '@/components/app/search-skeleton';

export default function SearchLoading() {
  return (
    <AppLoadingShell pageId="search">
      <SearchSkeleton />
    </AppLoadingShell>
  );
}
