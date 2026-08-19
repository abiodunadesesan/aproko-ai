'use client';

import { motion } from 'framer-motion';
import type { ChatModel } from '@/lib/ai/chat-models';
import { useMemo } from 'react';

type AuraBackgroundProps = {
  /** Current active model (drives accent colors). */
  model?: ChatModel | null;
  /** True when the app is streaming/generating text (drives animation intensity). */
  isStreaming?: boolean;
  className?: string;
};

function modelToAccent(model?: ChatModel | null): { a: string; b: string; c: string } {
  const provider = (model ?? '').split(':')[0];

  // Mapping matches your requested color palettes.
  switch (provider) {
    case 'anthropic':
      return { a: '#71717a', b: '#7c3aed', c: '#ef4444' }; // zinc + purple + crimson
    case 'google':
      return { a: '#2563eb', b: '#4f46e5', c: '#0891b2' }; // electric blue + indigo + cyan
    case 'openai':
    case 'groq':
    default:
      return { a: '#059669', b: '#06b6d4', c: '#22c55e' }; // emerald + cyan
  }
}

export function AuraBackground({ model, isStreaming = false, className }: AuraBackgroundProps) {
  const accents = useMemo(() => modelToAccent(model), [model]);

  const drift = isStreaming
    ? { x: [0, 60, -30, 0], y: [0, -70, 35, 0] }
    : { x: [0, 30, -20, 0], y: [0, -40, 20, 0] };

  const scale = isStreaming ? [1, 1.15, 0.95, 1] : 1;
  const brightness = isStreaming ? [1, 1.35, 1.05, 1] : 1;

  const duration = isStreaming ? 12 : 25;

  const orbCommon = {
    transform: 'translateZ(0)',
    filter: 'blur(60px)',
    mixBlendMode: 'screen' as const,
    opacity: isStreaming ? 0.9 : 0.65,
  };

  return (
    <div
      aria-hidden
      className={['absolute inset-0 pointer-events-none -z-10', className ?? ''].join(' ')}
    >
      {/* Soft base haze */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% -20%, ${accents.b}22, transparent 60%), radial-gradient(ellipse 60% 50% at 30% 10%, ${accents.a}18, transparent 60%)`,
        }}
      />

      {/* Large blur bloom */}
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5"
        style={{
          filter: 'blur(120px)',
          opacity: isStreaming ? 0.65 : 0.35,
        }}
      />

      {/* Orbs */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-[320px] w-[320px] rounded-full transform-gpu"
        style={{
          ...orbCommon,
          background: `radial-gradient(circle at 30% 30%, ${accents.a}88, transparent 60%)`,
        }}
        animate={{ ...drift, scale, filter: `blur(60px) brightness(${brightness})` }}
        transition={{ repeat: Infinity, duration, ease: 'linear' }}
      />

      <motion.div
        className="absolute left-[58%] top-[18%] h-[380px] w-[380px] rounded-full transform-gpu"
        style={{
          ...orbCommon,
          background: `radial-gradient(circle at 35% 35%, ${accents.b}7f, transparent 62%)`,
        }}
        animate={{ ...drift, scale, filter: `blur(60px) brightness(${brightness})` }}
        transition={{ repeat: Infinity, duration: duration + 3, ease: 'linear' }}
      />

      <motion.div
        className="absolute left-[42%] top-[58%] h-[360px] w-[360px] rounded-full transform-gpu"
        style={{
          ...orbCommon,
          background: `radial-gradient(circle at 40% 40%, ${accents.c}66, transparent 62%)`,
        }}
        animate={{
          ...drift,
          scale: isStreaming ? [1, 1.08, 0.98, 1] : 1,
          filter: `blur(60px) brightness(${brightness})`,
        }}
        transition={{ repeat: Infinity, duration: duration + 6, ease: 'linear' }}
      />
    </div>
  );
}
