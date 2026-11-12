// List every photo in every Lightroom folder through Cull Remote. Read only.
// Usage: node index-catalog.mjs [--out catalog.json] [--base URL]
// A catalog of about 50,000 photos in 250 folders takes about a minute.
import { writeFileSync } from 'node:fs';
import { baseUrl, cocoaToLocalDate, ensureOnline, getJson, listPhotos, parseArgs } from './lib.mjs';

const { opts } = parseArgs(process.argv.slice(2));
const base = baseUrl(opts);
await ensureOnline(base);

const sources = await getJson(base, '/api/sources');
// Collections only point at photos that also live in a folder, so folders cover everything.
const folders = sources.filter((s) => s.kind === 'folder' && s.count > 0);
const photos = [];
let done = 0;
for (const f of folders) {
  const folder = f.id.slice(2);
  try {
    for (const p of await listPhotos(base, folder)) {
      photos.push({ id: p.id, name: p.name, folder, date: cocoaToLocalDate(p.time), label: p.label, rating: p.rating, pick: p.pick });
    }
  } catch (e) {
    console.error(`skipped ${folder}: ${e.message}`);
  }
  if (++done % 25 === 0) console.error(`${done}/${folders.length} folders, ${photos.length} photos`);
}
const outFile = opts.out ?? 'catalog.json';
writeFileSync(outFile, JSON.stringify(photos));
console.log(`${folders.length} folders, ${photos.length} photos -> ${outFile}`);
