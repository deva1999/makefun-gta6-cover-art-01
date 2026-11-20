/* Vice Nights — Cover Studio: make.fun program entry (program/v1).
 * Copies app/ and screenshots/ from this repository into the output
 * directory and writes /output/dossier.json with buildDossier from
 * vendor/makefun-app.ts, the kit's library, unchanged.
 * Run locally with: MAKEFUN_OUTPUT_DIR=out node main.ts
 * Node standard library only; no network, no install step. */
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dest = join(outputDir, name);
  if (!existsSync(src)) {
    throw new Error('missing required directory in repository: ' + name);
  }
  cpSync(src, dest, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log('wrote ' + join(outputDir, 'dossier.json'));
