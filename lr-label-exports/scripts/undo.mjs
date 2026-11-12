// Put labels back to what an apply-label run found. Photos whose label was changed again
// since that run are skipped, so later work is not lost.
// Usage: node undo.mjs <undo-log.json | latest> [--dry]
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ensureOnline, fail, parseArgs, readCurrent, stateDir, writeLabels } from './lib.mjs';

const { positional, opts } = parseArgs(process.argv.slice(2), ['dry']);
let file = positional[0];
if (!file) fail('Usage: node undo.mjs <undo-log.json | latest> [--dry]');
if (file === 'latest') {
  const logs = readdirSync(stateDir()).filter((n) => n.startsWith('undo-')).sort();
  if (!logs.length) fail(`no undo logs in ${stateDir()}`);
  file = path.join(stateDir(), logs.at(-1));
}
const { base, changes } = JSON.parse(readFileSync(file, 'utf8'));
await ensureOnline(base);

const current = await readCurrent(base, changes);
const revert = [], changedSince = [];
for (const c of changes) {
  const now = current.get(c.id)?.label;
  if (now === c.before) continue;
  if (now === c.value) revert.push({ ...c, value: c.before });
  else changedSince.push({ ...c, now });
}
console.log(`${file}\n${revert.length} to restore, ${changedSince.length} changed since (skipped), ${changes.length - revert.length - changedSince.length} already restored`);
for (const c of changedSince) console.log(`  skipped ${c.name}: now ${c.now ?? 'missing'}`);
for (const c of revert) console.log(`  ${c.name} -> ${c.value}`);
if (!opts.dry && revert.length) {
  const notStuck = await writeLabels(base, revert);
  console.log(`restored ${revert.length - notStuck.length}/${revert.length}`);
  for (const c of notStuck) console.log(`  NOT restored: ${c.name} ${c.folder}`);
  if (notStuck.length) process.exitCode = 1;
}
