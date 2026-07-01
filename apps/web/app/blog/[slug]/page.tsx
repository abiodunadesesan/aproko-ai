import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AprokoLogo } from '@/components/brand/aproko-logo';
import { blogCategoryStyles, getBlogPost } from '@/lib/landing-blog';
import { cn } from '@/lib/utils';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { blogPosts } = await import('@/lib/landing-blog');
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const categoryLabels: Record<string, string> = {
    company: 'Company',
    guides: 'Guides',
    productivity: 'Productivity',
    study: 'Study',
    writing: 'Writing',
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <AprokoLogo size="sm" />
          <Link
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="/blog"
          >
            ← All articles
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
              blogCategoryStyles[post.category],
            )}
          >
            {categoryLabels[post.category]}
          </span>
          <span className="text-xs text-zinc-500">{post.readTime}</span>
        </div>

        <h1 className="mt-6 font-serif text-3xl font-normal leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-500">
          <span>{post.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{post.date}</time>
        </div>

        <div className="mt-10 space-y-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
