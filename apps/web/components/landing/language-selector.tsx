'use client';

import { Globe } from 'lucide-react';
import { landingLocales } from '@/lib/landing-i18n';
import { useLandingLocale } from '@/components/landing/locale-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { locale, setLocale } = useLandingLocale();

  return (
    <Select onValueChange={(value) => setLocale(value as typeof locale)} value={locale}>
      <SelectTrigger
        aria-label="Select language"
        className={
          compact
            ? 'h-9 w-9 shrink-0 rounded-full border-0 bg-transparent p-0 text-zinc-600 shadow-none hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 [&>svg:last-child]:hidden'
            : 'h-8 w-[110px] rounded-full border-zinc-300 bg-white/90 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 sm:w-[124px]'
        }
      >
        <Globe
          className={
            compact
              ? 'mx-auto h-4 w-4'
              : 'mr-1 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300'
          }
        />
        {!compact ? <SelectValue /> : null}
      </SelectTrigger>
      <SelectContent align="end">
        {landingLocales.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
