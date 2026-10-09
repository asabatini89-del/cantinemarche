// Assembla dist/index.html sostituendo <!-- @include path --> con i file in snippets/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('preview.src.html', 'utf8').replace(
  /<!-- @include (\S+) -->/g,
  (_, path) => readFileSync(path, 'utf8'),
);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
