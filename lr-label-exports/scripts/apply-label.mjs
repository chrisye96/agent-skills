// Set a colour label on matched photos, keeping an undo log of the labels they had.
// Usage: node apply-label.mjs matches.json --color green
//          [--exclude-id id1,id2] [--exclude-folder text1,text2] [--overwrite] [--dry] [--base URL]
// Without --overwrite, photos that already carry another colour are left alone and listed.
import { readFileSync } from 'node:fs';
import { baseUrl, ensureOnline, fail, parseArgs, readCurrent, writeLabels, writeNewLog } from './lib.mjs';

const COLORS = ['none', 'red', 'yellow', 'green', 'blue', 'purple'];
const { positional, opts } = parseArgs(process.argv.slice(2), ['overwrite', 'dry']);
if (!positional[0] || !COLORS.includes(opts.color)) fail(`Usage: node apply-label.mjs matches.json --color <${COLORS.join('|')}> [--exclude-id ...] [--exclude-folder ...] [--overwrite] [--dry]`);
const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const excludeIds = new Set(list(opts['exclude-id']));
const excludeFolders = list(opts['exclude-folder']);

const base = baseUrl(opts);
await ensureOnline(base);
const results = JSON.parse(readFileSync(positional[0], 'utf8'));
const chosen = results.flatMap((r) => r.candidates)
  .filter((c) => !excludeIds.has(c.id) && !excludeFolders.some((f) => c.folder.includes(f)));
const unique = [...new Map(chosen.map((c) => [c.id, c])).values()];

// Labels as they are right now, not as they were when the catalog was indexed.
const current = await readCurrent(base, unique);
const already = [], conflicts = [], changes = [];
for (const c of unique) {
  const now = current.get(c.id);
  if (!now) { console.error(`  gone from catalog: ${c.name} ${c.folder}`); continue; }
  const entry = { id: c.id, folder: c.folder, name: c.name, before: now.label, value: opts.color };
  if (now.label === opts.color) already.push(entry);
  else if (now.label !== 'none' && !opts.overwrite) conflicts.push(entry);
  else changes.push(entry);
}

console.log(`${unique.length} photos selected: ${changes.length} to label ${opts.color}, ${already.length} already ${opts.color}, ${conflicts.length} with another colour (left alone)`);
for (const c of conflicts) console.log(`  has ${c.before}: ${c.name} ${c.folder}  id=${c.id}`);
const overwriting = changes.filter((c) => c.before !== 'none');
for (const c of overwriting) console.log(`  will replace ${c.before}: ${c.name} ${c.folder}`);
if (opts.dry) {
  console.log('dry run: nothing written');
} else if (changes.length) {
  // Log first, so an interrupted run can still be undone.
  const log = writeNewLog({ base, color: opts.color, at: new Date().toISOString(), changes });
  const notStuck = await writeLabels(base, changes);
  console.log(`labelled ${changes.length - notStuck.length}/${changes.length}, verified by reading back`);
  for (const c of notStuck) console.log(`  NOT labelled: ${c.name} ${c.folder}`);
  if (notStuck.length) process.exitCode = 1;
  console.log(`undo log: ${log}`);
}
