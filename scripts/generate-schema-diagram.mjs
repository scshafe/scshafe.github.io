#!/usr/bin/env node
/**
 * Generate Schema Diagram
 *
 * Extracts Mermaid diagram from ENTITY_UML_SCHEMA.md and generates SVG output.
 * Uses @mermaid-js/mermaid-cli (mmdc) to render the diagram.
 *
 * Usage: npm run generate:schema
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const SCHEMA_FILE = path.join(ROOT_DIR, 'docs/ENTITY_UML_SCHEMA.md');
const OUTPUT_DIR = path.join(ROOT_DIR, 'docs/diagrams');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'entity-schema.svg');
const TEMP_FILE = path.join(OUTPUT_DIR, '.temp-schema.mmd');

/**
 * Extract Mermaid code block from markdown file
 */
async function extractMermaidDiagram(markdownPath) {
  const content = await fs.readFile(markdownPath, 'utf-8');

  // Find the mermaid code block
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/;
  const match = content.match(mermaidRegex);

  if (!match) {
    throw new Error('No mermaid code block found in ' + markdownPath);
  }

  return match[1].trim();
}

/**
 * Check if mermaid-cli is installed
 */
async function checkMermaidCli() {
  try {
    await execAsync('npx mmdc --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate SVG diagram from Mermaid source
 */
async function generateDiagram(mermaidSource, outputPath) {
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Write temporary mermaid file
  await fs.writeFile(TEMP_FILE, mermaidSource, 'utf-8');

  try {
    // Run mermaid-cli
    const { stdout, stderr } = await execAsync(
      `npx mmdc -i "${TEMP_FILE}" -o "${outputPath}" -b transparent`,
      { cwd: ROOT_DIR }
    );

    if (stderr && !stderr.includes('Generating')) {
      console.warn('Warning:', stderr);
    }

    console.log(`Generated: ${path.relative(ROOT_DIR, outputPath)}`);
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(TEMP_FILE);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('Generating entity schema diagram...\n');

  // Check for mermaid-cli
  const hasMermaidCli = await checkMermaidCli();
  if (!hasMermaidCli) {
    console.error('Error: @mermaid-js/mermaid-cli not found.');
    console.error('Install it with: npm install -D @mermaid-js/mermaid-cli');
    process.exit(1);
  }

  // Check schema file exists
  try {
    await fs.access(SCHEMA_FILE);
  } catch {
    console.error(`Error: Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }

  // Extract and generate
  try {
    const mermaidSource = await extractMermaidDiagram(SCHEMA_FILE);
    console.log(`Extracted Mermaid diagram (${mermaidSource.length} chars)`);

    await generateDiagram(mermaidSource, OUTPUT_FILE);

    console.log('\nDone! View the diagram at:');
    console.log(`  file://${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating diagram:', error.message);
    process.exit(1);
  }
}

main();
