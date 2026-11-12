// Scan folders of exported images: work out each file's camera file name and shoot date,
// and report how the folders overlap.
// Usage: node scan-exports.mjs <folder>... [--pattern REGEX] [--out targets.json]
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fail, parseArgs } from './lib.mjs';

const { positional: folders, opts } = parseArgs(process.argv.slice(2));
if (!folders.length) fail('Usage: node scan-exports.mjs <folder>... [--pattern REGEX] [--out targets.json]');
// Camera file names: Fujifilm DSCF0000, Nikon DSC_0000, custom prefix CYV_0000, phones IMG_0000.
const STEM = new RegExp(opts.pattern ?? '(DSCF|DSC_|CYV_|IMG_)\\d{4}', 'i');
const IMAGE = /\.(jpe?g|tiff?|png|webp|heic|avif|psd)$/i;
const XMP_BYTES = 1024 * 1024;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : IMAGE.test(n) ? [p] : [];
  });
}

// XMP values appear either as attributes (ns:Key="v") or elements (<ns:Key>v</ns:Key>).
function xmpValue(text, key) {
  const m = text.match(new RegExp(`:${key}="([^"]*)"`)) ?? text.match(new RegExp(`:${key}>([^<]*)<`));
  return m?.[1] || null;
}

// Export prefix such as "251005_Ramjhat_Garba_...", possibly after "Copy of ".
function dateFromName(name) {
  const m = name.match(/(?:^|\s)(\d{2})(\d{2})(\d{2})[_-]/);
  if (!m || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > 31) return null;
  return `20${m[1]}-${m[2]}-${m[3]}`;
}

function dateFromXmp(v) {
  const m = v?.match(/^(\d{4})[-:](\d{2})[-:](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const files = [];
const unmatched = [];
for (const root of folders) {
  const label = path.basename(path.resolve(root));
  for (const file of walk(root)) {
    const name = path.basename(file);
    const bytes = readFileSync(file);
    const xmp = bytes.subarray(0, XMP_BYTES).toString('latin1');
    const original = xmpValue(xmp, 'RawFileName') ?? xmpValue(xmp, 'PreservedFileName');
    let stem = name.match(STEM)?.[0];
    let stemFrom = 'filename';
    if (!stem && original?.match(STEM)) { stem = original.match(STEM)[0]; stemFrom = `xmp ${original}`; }
    let date = dateFromName(name);
    let dateFrom = 'filename';
    if (!date) {
      date = dateFromXmp(xmpValue(xmp, 'DateTimeOriginal') ?? xmpValue(xmp, 'CreateDate'));
      dateFrom = date ? 'xmp' : 'none';
    }
    const entry = {
      folder: label, rel: path.relative(root, file), name, size: bytes.length,
      hash: createHash('md5').update(bytes).digest('hex'),
      stem: stem?.toUpperCase() ?? null, date, stemFrom, dateFrom, editedWith: xmpValue(xmp, 'CreatorTool'),
    };
    files.push(entry);
    if (!stem) unmatched.push(entry);
  }
}

// One target per distinct photo: same camera name and same shoot date.
const targets = new Map();
for (const f of files.filter((x) => x.stem)) {
  const key = `${f.stem}|${f.date}`;
  if (!targets.has(key)) targets.set(key, { stem: f.stem, date: f.date, files: [] });
  targets.get(key).files.push(`${f.folder}/${f.rel}`);
}

// Overlap report.
const out = [];
const byName = Object.groupBy(files, (f) => f.name);
const sameNameDiff = Object.entries(byName).filter(([, g]) => new Set(g.map((f) => f.hash)).size > 1);
const byHash = Object.groupBy(files, (f) => f.hash);
const sameContentDiffName = Object.values(byHash).filter((g) => new Set(g.map((f) => f.name)).size > 1);
const groups = Object.groupBy([...targets.values()], (t) => [...new Set(t.files.map((p) => p.split('/')[0]))].sort().join(' + '));

out.push(`${files.length} files in ${folders.length} folders -> ${targets.size} distinct photos`);
out.push('\nWhich folders hold each photo:');
for (const [set, list] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
  out.push(`  [${set}] ${list.length}`);
  if (list.length <= 15) out.push(`      ${list.map((t) => `${t.stem}${t.date ? ` (${t.date})` : ''}`).join(', ')}`);
}
if (sameNameDiff.length) {
  out.push('\nSame file name, different content (re-exported or re-edited):');
  for (const [name, g] of sameNameDiff) out.push(`  ${name}: ${g.map((f) => `${f.folder} ${(f.size / 1e6).toFixed(1)} MB`).join(' vs ')}`);
}
if (sameContentDiffName.length) {
  out.push('\nSame content, different file name:');
  for (const g of sameContentDiffName) out.push(`  ${g.map((f) => `${f.folder}/${f.name}`).join(' == ')}`);
}
const fromXmp = files.filter((f) => f.stemFrom !== 'filename' || (f.dateFrom === 'xmp'));
if (fromXmp.length) {
  out.push('\nIdentified from embedded metadata:');
  for (const f of fromXmp) out.push(`  ${f.folder}/${f.name}: ${f.stem}${f.stemFrom !== 'filename' ? ` (${f.stemFrom})` : ''}, date ${f.date ?? 'unknown'} (${f.dateFrom})`);
}
const noDate = [...targets.values()].filter((t) => !t.date);
if (noDate.length) out.push(`\nNo shoot date known (will match on name only): ${noDate.map((t) => t.stem).join(', ')}`);
if (unmatched.length) {
  out.push('\nNo camera file name found (check by eye or by another --pattern):');
  for (const f of unmatched) out.push(`  ${f.folder}/${f.rel}`);
}
console.log(out.join('\n'));

const outFile = opts.out ?? 'targets.json';
writeFileSync(outFile, JSON.stringify({ folders, files, targets: [...targets.values()], unmatched }, null, 1));
console.log(`\nwrote ${outFile}`);
