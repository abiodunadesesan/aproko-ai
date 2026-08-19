export type BlogCategory = 'company' | 'guides' | 'productivity' | 'study' | 'writing';

export type BlogPost = {
  slug: string;
  category: BlogCategory;
  readTime: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  featured?: boolean;
  body: string[];
};

export const blogCategoryOrder: BlogCategory[] = [
  'company',
  'guides',
  'productivity',
  'study',
  'writing',
];

export const blogCategoryStyles: Record<BlogCategory, string> = {
  company:
    'border border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300',
  guides:
    'border border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300',
  productivity:
    'border border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300',
  study:
    'border border-zinc-400/30 bg-zinc-400/10 text-zinc-800 dark:border-zinc-400/25 dark:bg-zinc-400/15 dark:text-zinc-300',
  writing:
    'border border-zinc-400/30 bg-zinc-400/10 text-zinc-800 dark:border-zinc-400/25 dark:bg-zinc-400/15 dark:text-zinc-300',
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-build-a-personal-knowledge-base-with-ai',
    category: 'guides',
    readTime: '9 min read',
    title: 'How to Build a Personal Knowledge Base with AI in 2026',
    excerpt:
      'Stop copying context into chat tabs. Learn how to upload sources once, index them automatically, and ask questions with citations from your own library.',
    author: 'Aproko AI Team',
    date: 'February 12, 2026',
    featured: true,
    body: [
      'Most people treat AI like a blank notebook — paste context in, get an answer out, forget everything by tomorrow. A personal knowledge base flips that: your documents, notes, and chats stay indexed so every answer can point back to a source.',
      'Start by gathering your highest-value materials: lecture PDFs, research papers, meeting notes, and transcripts. Upload them to one workspace instead of scattering files across drives and tabs.',
      'Let automatic indexing run while you work. As chunks become searchable, you can ask natural-language questions and receive short answers with citations — not guesses from generic training data.',
      'Review citations before you trust an answer. The goal is not faster hallucinations; it is faster retrieval from material you already own.',
      'Over time, memory timelines and study outputs (summaries, flashcards, quizzes) compound the value of the same library. One upload powers chat, search, and revision — without re-uploading context every session.',
    ],
  },
  {
    slug: 'study-smarter-with-cited-ai-chat',
    category: 'study',
    readTime: '7 min read',
    title: 'How to Study Smarter with Cited AI Chat',
    excerpt:
      'Generic chat tools cannot see your syllabus. Here is a workflow for exam prep that keeps answers grounded in your uploaded materials.',
    author: 'Aproko AI Team',
    date: 'January 28, 2026',
    featured: true,
    body: [
      'Exam prep fails when AI answers sound confident but cannot point to your actual course materials. Cited chat fixes that by retrieving passages from your library before generating a response.',
      'Before a study session, upload or confirm your core sources: slides, problem sets, and reading notes. Group them in a project so retrieval stays focused.',
      'Ask specific questions: “Walk me through this proof using my uploaded lecture notes” beats “Explain calculus.” Specificity improves retrieval quality and citation relevance.',
      'When you get an answer, click through citations. If a source is missing, upload it — do not accept uncited synthesis for graded work.',
      'Close the loop by generating flashcards or a quiz from the same sources. Retrieval, explanation, and active recall should share one knowledge graph.',
    ],
  },
  {
    slug: 'memory-timeline-vs-generic-chat',
    category: 'productivity',
    readTime: '6 min read',
    title: 'Memory Timeline vs Generic Chat: What Actually Sticks',
    excerpt:
      'Why conversation history is not the same as durable memory — and how timeline indexing helps you reuse context weeks later.',
    author: 'Aproko AI Team',
    date: 'January 15, 2026',
    body: [
      'Chat history scrolls away. Memory timelines capture decisions, summaries, and linked sources so you can reopen context without re-explaining your project.',
      'Generic chat resets every new thread. A knowledge OS indexes what mattered: which document answered which question, and which study output came from which source.',
      'Use memory for long-running work — thesis research, client projects, certification prep — where yesterday’s reasoning should inform today’s question.',
      'Privacy matters: durable memory should stay inside your workspace boundary, not a public feed. Tenant isolation is a feature, not an afterthought.',
    ],
  },
  {
    slug: 'generate-flashcards-from-your-library',
    category: 'study',
    readTime: '5 min read',
    title: 'Generate Flashcards from Your Library in One Click',
    excerpt:
      'Turn indexed documents into spaced-repetition decks without manual copy-paste from PDFs and slides.',
    author: 'Aproko AI Team',
    date: 'January 8, 2026',
    body: [
      'Manual flashcard creation is slow because the hard part is finding atomic facts inside long PDFs. When your library is already chunked and indexed, generation starts from structured passages.',
      'Pick a source or folder, run flashcard generation, then edit cards before you study. AI drafts; you approve — especially for definitions and formulas.',
      'Link cards back to citations so you can reopen the original context when a card feels wrong.',
      'Combine decks with quiz generation for exam weeks. Same library, multiple study modalities.',
    ],
  },
  {
    slug: 'how-to-make-ai-writing-sound-like-you',
    category: 'writing',
    readTime: '8 min read',
    title: 'How to Make AI Writing Sound Like You (Not a Robot)',
    excerpt:
      'Use your own notes and past writing as retrieval context so drafts inherit your voice instead of default “AI tone.”',
    author: 'Aproko AI Team',
    date: 'January 3, 2026',
    body: [
      'Default AI tone is recognizable — polished, vague, and interchangeable. Grounding drafts in your prior writing changes the vocabulary and rhythm.',
      'Upload samples you are proud of: essays, memos, blog posts. They become style anchors for new drafts.',
      'Ask for outlines first, then paragraphs, with citations to your sources. Iteration beats one-shot “write my paper” prompts.',
      'Edit aggressively. Retrieval gives you material; your judgment gives you voice.',
    ],
  },
  {
    slug: 'why-we-built-aproko-ai',
    category: 'company',
    readTime: '4 min read',
    title: 'Why We Built Aproko AI',
    excerpt:
      'Knowledge work should not require ten tabs, three copy-paste cycles, and zero citations. We built one web workspace for library, memory, and study.',
    author: 'Aproko AI Team',
    date: 'December 18, 2025',
    body: [
      'We kept losing context switching between chat apps, cloud drives, and note tools. Every new question meant re-uploading the same PDFs.',
      'Aproko AI is our answer: upload once, retrieve everywhere — chat with citations, search with ⌘K, memory that persists, and study outputs from the same index.',
      'V1 is web-first by design. No desktop recorder, no phone calls — just a focused knowledge operating system students and teams can trust.',
      'We are building in public. Start free, bring your library, and tell us what should connect next.',
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedBlogPosts(limit = 2): BlogPost[] {
  const featured = blogPosts.filter((post) => post.featured);
  if (featured.length >= limit) {
    return featured.slice(0, limit);
  }
  return blogPosts.slice(0, limit);
}

export function getBlogPostsByCategory(category: BlogCategory | 'all'): BlogPost[] {
  if (category === 'all') {
    return blogPosts;
  }
  return blogPosts.filter((post) => post.category === category);
}
