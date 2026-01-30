/**
 * Post-build Script
 *
 * Runs after Next.js build to finalize the output directory:
 * 1. Copies public directory contents to the output directory
 *
 * Note: Next.js static export already copies public/ to output,
 * but this ensures any files generated during prebuild are included
 * even if they were created after the build started.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Import site config (use dynamic import for ESM compatibility)
async function getOutputDir() {
  try {
    // Read the config file and extract outputDir
    const configPath = path.join(projectRoot, 'site.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Simple regex to extract outputDir value
    const match = configContent.match(/outputDir:\s*['"]([^'"]+)['"]/);
    const outputDir = match ? match[1].trim() : 'out';

    // Resolve the path
    if (path.isAbsolute(outputDir)) {
      return outputDir;
    }
    return path.resolve(projectRoot, outputDir);
  } catch (error) {
    console.log('Could not read site.config.ts, using default "out"');
    return path.resolve(projectRoot, 'out');
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // Only copy if source is newer or destination doesn't exist
    if (!fs.existsSync(dest) || fs.statSync(src).mtime > fs.statSync(dest).mtime) {
      fs.copyFileSync(src, dest);
    }
  }
}

async function postbuild() {
  const outputDir = await getOutputDir();
  const publicDir = path.join(projectRoot, 'public');

  console.log(`Post-build: Output directory is ${outputDir}`);

  // Verify output directory exists
  if (!fs.existsSync(outputDir)) {
    console.error(`Error: Output directory ${outputDir} does not exist. Did the build complete?`);
    process.exit(1);
  }

  // Copy public directory contents to output
  if (fs.existsSync(publicDir)) {
    console.log(`Copying public/ to ${outputDir}`);
    copyRecursive(publicDir, outputDir);
    console.log('Public directory copied successfully');
  } else {
    console.log('No public directory found, skipping copy');
  }

  console.log('Post-build complete!');
}

postbuild().catch((error) => {
  console.error('Post-build failed:', error);
  process.exit(1);
});
