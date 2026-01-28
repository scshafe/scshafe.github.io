import type { NextConfig } from 'next';
import siteConfig from './site.config';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: siteConfig.outputDir || 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
