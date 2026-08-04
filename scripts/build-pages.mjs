#!/usr/bin/env node
// Builds every game under games/* (each with its GitHub Pages base) and
// assembles a single _site/ directory: the landing page at the root, and each
// game under its own slug subfolder. Run from the repo root: npm run build:pages
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');
const outDir = join(root, '_site');

function log(msg) {
  console.log(`\n→ ${msg}`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const games = readdirSync(gamesDir).filter((name) =>
  statSync(join(gamesDir, name)).isDirectory(),
);

for (const slug of games) {
  const gamePath = join(gamesDir, slug);
  if (!existsSync(join(gamePath, 'package.json'))) continue;
  log(`Building game: ${slug}`);
  execSync('npm run build', {
    cwd: gamePath,
    stdio: 'inherit',
    env: { ...process.env, GITHUB_PAGES: 'true' },
  });
  const dist = join(gamePath, 'dist');
  if (!existsSync(dist)) {
    throw new Error(`Expected build output at ${dist} but none was found.`);
  }
  cpSync(dist, join(outDir, slug), { recursive: true });
}

log('Copying landing page');
cpSync(join(root, 'landing'), outDir, { recursive: true });

// The landing page has no bundler of its own, so it can't consume the
// shared theme the same way the games do (via a Vite alias) -- copy the
// shared token file alongside it instead, so it stays in sync with the
// same packages/platform/src/theme.css every game pulls from.
cpSync(join(root, 'packages/platform/src/theme.css'), join(outDir, 'theme.css'));

log(`Done. Assembled ${games.length} game(s) into _site/`);
