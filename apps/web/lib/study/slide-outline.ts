export type ParsedSlide = {
  id: string;
  title: string;
  bullets: string[];
  kind: 'title' | 'content' | 'closing';
};

export function parseSlideOutlineMarkdown(markdown: string): ParsedSlide[] {
  const lines = markdown.split(/\r?\n/);
  const slides: ParsedSlide[] = [];
  let current: ParsedSlide | null = null;
  let index = 0;

  const pushCurrent = () => {
    if (!current) {
      return;
    }
    slides.push(current);
    current = null;
  };

  const inferKind = (title: string, slideIndex: number): ParsedSlide['kind'] => {
    const normalized = title.trim().toLowerCase();
    if (slideIndex === 0 || normalized.includes('title slide')) {
      return 'title';
    }
    if (normalized.includes('closing') || normalized.includes('thank you') || normalized.includes('questions')) {
      return 'closing';
    }
    return 'content';
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      pushCurrent();
      const title = headingMatch[1]?.trim() ?? 'Untitled slide';
      current = {
        id: `slide-${index}`,
        title,
        bullets: [],
        kind: inferKind(title, index),
      };
      index += 1;
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch && current) {
      current.bullets.push(bulletMatch[1]?.trim() ?? '');
      continue;
    }

    if (current && line.length > 0) {
      current.bullets.push(line);
    }
  }

  pushCurrent();

  if (!slides.length && markdown.trim()) {
    return [
      {
        id: 'slide-0',
        title: 'Presentation outline',
        bullets: markdown
          .split(/\r?\n/)
          .map((entry) => entry.trim())
          .filter(Boolean),
        kind: 'content',
      },
    ];
  }

  return slides.map((slide, slideIndex) => ({
    ...slide,
    kind: slide.kind === 'content' && slideIndex === 0 ? 'title' : slide.kind,
  }));
}
