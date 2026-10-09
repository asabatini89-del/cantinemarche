// Carica su R2 le immagini prodotte da scripts/fetch-images.mjs.
//
//   node scripts/upload-media.mjs --local     # R2 simulato di wrangler dev
//   node scripts/upload-media.mjs --remote    # bucket reale (dopo `wrangler r2 bucket create cantine-media`)
//
// Riprendibile: i file già caricati sono elencati in media-out/.uploaded-<local|remote>.

import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const OUT = 'media-out';
const BUCKET = 'cantine-media';
const target = process.argv.includes('--remote') ? 'remote' : 'local';
const doneFile = join(OUT, `.uploaded-${target}`);
const done = new Set(existsSync(doneFile) ? readFileSync(doneFile, 'utf8').split('\n').filter(Boolean) : []);

const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
const keys = manifest.items.flatMap((i) => [i.key, i.thumb_key]).filter(Boolean).filter((k) => !done.has(k));
console.log(`Da caricare (${target}): ${keys.length}`);

let i = 0;
let ok = 0;
const failed = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (i < keys.length) {
    const key = keys[i++];
    try {
      await run('npx', ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${key}`, '--file', join(OUT, key),
        '--content-type', 'image/webp', '--cache-control', 'public, max-age=31536000, immutable', `--${target}`]);
      appendFileSync(doneFile, `${key}\n`);
      if (++ok % 50 === 0) console.log(`${ok}/${keys.length}`);
    } catch (e) {
      failed.push(key);
    }
  }
}));
console.log(`Caricati ${ok}, falliti ${failed.length}${failed.length ? ` (rilancia lo script per riprovare)` : ''}`);
