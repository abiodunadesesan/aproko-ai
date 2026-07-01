import { Skeleton } from '@/components/ui/skeleton';

type TableSkeletonProps = {
  rows?: number;
  showHeader?: boolean;
};

export function TableSkeleton({ rows = 5, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="space-y-2" role="status">
      <p className="sr-only">Loading table data</p>
      {showHeader ? <Skeleton className="h-9 w-full rounded-md" /> : null}
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton className="h-10 w-full rounded-md" key={index} />
      ))}
    </div>
  );
}
