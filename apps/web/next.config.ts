import type { NextConfig } from 'next';
import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

const reactAlias = {
  react: './node_modules/react',
  'react-dom': './node_modules/react-dom',
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  cacheComponents: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    resolveAlias: reactAlias,
  },
};

const sentryWrappedConfig = withSentryConfig(nextConfig, {
  ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
  ...(process.env.SENTRY_PROJECT ? { project: process.env.SENTRY_PROJECT } : {}),
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

export default sentryEnabled ? sentryWrappedConfig : nextConfig;
