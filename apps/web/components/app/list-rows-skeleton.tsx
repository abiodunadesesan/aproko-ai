import { Skeleton } from '@/components/ui/skeleton';

type ListRowsSkeletonProps = {
  rows?: number;
  rowHeightClassName?: string;
};

export function ListRowsSkeleton({ rows = 4, rowHeightClassName = 'h-16' }: ListRowsSkeletonProps) {
  return (
    <div className="space-y-2" role="status">
      <p className="sr-only">Loading list items</p>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton className={`w-full rounded-md ${rowHeightClassName}`} key={index} />
      ))}
    </div>
  );
}
