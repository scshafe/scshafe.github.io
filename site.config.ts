/**
 * Site Configuration
 *
 * Global configuration for the site build and runtime behavior.
 * This file is the single source of truth for configurable settings.
 */

import path from 'path';

export interface SiteConfig {
  /**
   * Output directory for the static build.
   * - Can be an absolute path (e.g., "/var/www/html")
   * - Can be a relative path (e.g., "dist", "../output")
   * - Defaults to "out" if not specified or empty
   */
  outputDir: string;
}

const config: SiteConfig = {
  outputDir: 'out',
};

/**
 * Get the resolved output directory path.
 * Handles both absolute and relative paths.
 *
 * @param projectRoot - The project root directory (defaults to process.cwd())
 * @returns The absolute path to the output directory
 */
export function getOutputDir(projectRoot: string = process.cwd()): string {
  const outputDir = config.outputDir?.trim() || 'out';

  // If it's an absolute path, use it directly
  if (path.isAbsolute(outputDir)) {
    return outputDir;
  }

  // Otherwise, resolve relative to project root
  return path.resolve(projectRoot, outputDir);
}

export default config;
