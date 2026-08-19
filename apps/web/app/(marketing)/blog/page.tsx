'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BlogCategoryPill, BlogPostCard } from '@/components/landing/blog-post-card';
import { FadeIn } from '@/components/landing/fade-in';
import { LandingNav } from '@/components/landing/landing-nav';
import { LocaleProvider, useLandingLocale } from '@/components/landing/locale-provider';
import { blogCategoryOrder, blogPosts, type BlogCategory } from '@/lib/landing-blog';

export default function BlogPage() {
  return (
    <LocaleProvider>
      <BlogPageContent />
    </LocaleProvider>
  );
}

function BlogPageContent() {
  const { t } = useLandingLocale();
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'all'>('all');

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') {
      return blogPosts;
    }
    return blogPosts.filter((post) => post.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="relative min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.zinc.400/6),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.zinc.700/12),transparent_45%)]" />

      <LandingNav />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
        <FadeIn>
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-500">
            <Link
              className="transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
              href="/"
            >
              {t.nav.home}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-700 dark:text-zinc-300">{t.nav.blog}</span>
          </nav>

          <h1 className="mt-6 font-serif text-3xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl md:text-5xl">
            {t.blog.pageTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            {t.blog.pageSubtitle}
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
            {blogPosts.length} {t.blog.articlesLabel}
          </p>
        </FadeIn>

        <FadeIn className="mt-8" delay={0.05}>
          <div className="flex flex-wrap gap-2">
            <BlogCategoryPill
              active={activeCategory === 'all'}
              label={t.blog.allCategories}
              onClick={() => setActiveCategory('all')}
            />
            {blogCategoryOrder.map((category) => (
              <BlogCategoryPill
                active={activeCategory === category}
                key={category}
                label={t.blog.categories[category]}
                onClick={() => setActiveCategory(category)}
              />
            ))}
          </div>
        </FadeIn>

        <FadeIn className="mt-10" delay={0.08}>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {t.blog.allArticles}
          </h2>
        </FadeIn>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {filteredPosts.map((post, idx) => (
            <FadeIn delay={idx * 0.04} key={post.slug}>
              <BlogPostCard categoryLabel={t.blog.categories[post.category]} post={post} />
            </FadeIn>
          ))}
        </div>
      </div>
    </main>
  );
}
