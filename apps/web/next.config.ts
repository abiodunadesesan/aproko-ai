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

const sentryOrg = process.env.SENTRY_ORG ?? 'calebsilvanus';
const sentryProject = process.env.SENTRY_PROJECT ?? 'aproko-ai';

const sentryBuildOptions = {
  org: sentryOrg,
  project: sentryProject,
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  ...(process.env.SENTRY_AUTH_TOKEN ? { authToken: process.env.SENTRY_AUTH_TOKEN } : {}),
};

const sentryWrappedConfig = withSentryConfig(nextConfig, sentryBuildOptions);

export default sentryEnabled ? sentryWrappedConfig : nextConfig;
