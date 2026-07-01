'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogPostCard } from '@/components/landing/blog-post-card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/landing/fade-in';
import { useLandingLocale } from '@/components/landing/locale-provider';
import { getFeaturedBlogPosts } from '@/lib/landing-blog';

export function BlogSection() {
  const { t } = useLandingLocale();
  const posts = getFeaturedBlogPosts(2);

  return (
    <section className="mt-16 scroll-mt-28 sm:mt-20" id="blog">
      <FadeIn className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            {t.blog.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl md:text-4xl">
            {t.blog.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            {t.blog.subtitle}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100"
          href="/blog"
        >
          {t.blog.viewAll}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </FadeIn>

      <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {posts.map((post) => (
          <StaggerItem key={post.slug}>
            <BlogPostCard categoryLabel={t.blog.categories[post.category]} post={post} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
