import Link from 'next/link';
import { blogCategoryStyles, type BlogPost } from '@/lib/landing-blog';
import { cn } from '@/lib/utils';

type BlogPostCardProps = {
  post: BlogPost;
  categoryLabel: string;
  className?: string;
};

export function BlogPostCard({ post, categoryLabel, className }: BlogPostCardProps) {
  return (
    <Link
      className={cn(
        'group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 sm:p-6',
        className,
      )}
      href={`/blog/${post.slug}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            blogCategoryStyles[post.category],
          )}
        >
          {categoryLabel}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">{post.readTime}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200 sm:text-xl">
        {post.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {post.excerpt}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-500">
        <span>{post.author}</span>
        <time dateTime={post.date}>{post.date}</time>
      </div>
    </Link>
  );
}

export function BlogCategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
          : 'border-zinc-300 bg-transparent text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
