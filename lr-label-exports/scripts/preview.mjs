// Save Lightroom's thumbnails of catalog photos, to compare candidates with an export by eye.
// Usage: node preview.mjs <outDir> <id>... [--base URL]
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { baseUrl, ensureOnline, fail, parseArgs } from './lib.mjs';

const { positional, opts } = parseArgs(process.argv.slice(2));
const [outDir, ...ids] = positional;
if (!outDir || !ids.length) fail('Usage: node preview.mjs <outDir> <id>...');
const base = baseUrl(opts);
await ensureOnline(base);
mkdirSync(outDir, { recursive: true });
for (const id of ids) {
  // "thumb" is 400 px on the long side; Lightroom renders it if it has no preview yet.
  const res = await fetch(`${base}/api/preview/${id}?size=thumb`);
  if (!res.ok) { console.error(`${id}: ${res.status} ${await res.text()}`); continue; }
  const file = path.join(outDir, `${id}.jpg`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(file);
}
