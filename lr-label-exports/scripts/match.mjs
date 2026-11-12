// Match scanned exports to catalog photos by camera file name and shoot date.
// Usage: node match.mjs targets.json catalog.json [--days 1] [--out matches.json]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dayDiff, fail, parseArgs } from './lib.mjs';

const { positional, opts } = parseArgs(process.argv.slice(2));
if (positional.length < 2) fail('Usage: node match.mjs targets.json catalog.json [--days 1] [--out matches.json]');
const { targets } = JSON.parse(readFileSync(positional[0], 'utf8'));
const catalog = JSON.parse(readFileSync(positional[1], 'utf8'));
// Events run past midnight and some cameras keep the wrong time zone, so allow a day.
const days = Number(opts.days ?? 1);

const byStem = Object.groupBy(catalog, (p) => p.name.replace(/\.[^.]+$/, '').toUpperCase());

// Why a target has several candidates, so the reader can decide quickly.
function hint(cands) {
  const keys = cands.map((c) => `${c.folder}|${c.name}`);
  const copies = keys.length !== new Set(keys).size;
  const formats = new Set(cands.map((c) => path.extname(c.name).toLowerCase())).size > 1;
  const places = new Set(cands.map((c) => c.folder)).size > 1;
  const dates = cands.map((c) => c.date).filter(Boolean).sort();
  const shoots = dates.length > 1 && dayDiff(dates[0], dates.at(-1)) > days;
  return [shoots && 'DIFFERENT SHOOTS, compare by eye', copies && 'virtual copies', formats && 'several formats', places && 'several folders'].filter(Boolean).join(', ') || 'unclear';
}

const results = targets.map((t) => {
  const all = byStem[t.stem] ?? [];
  const near = t.date ? all.filter((p) => p.date && dayDiff(p.date, t.date) <= days) : all;
  const status = near.length === 1 ? 'unique' : near.length ? 'multi' : 'none';
  return { ...t, status, hint: status === 'multi' ? hint(near) : undefined, candidates: near, otherDates: all.filter((p) => !near.includes(p)) };
});
results.sort((a, b) => `${a.date}${a.stem}`.localeCompare(`${b.date}${b.stem}`));

const short = (p) => `${p.name} ${p.date} [${p.label}${p.rating ? ` ${p.rating}*` : ''}] ${p.folder}  id=${p.id}`;
const section = (title, list, show) => {
  if (!list.length) return;
  console.log(`\n== ${title}: ${list.length}`);
  for (const r of list) show(r);
};
section('NONE (not in this catalog near that date)', results.filter((r) => r.status === 'none'), (r) => {
  console.log(`  ${r.stem} ${r.date ?? '(no date)'}  from ${r.files[0]}`);
  for (const o of r.otherDates) console.log(`      same name, other shoot: ${short(o)}`);
});
section('MULTI (several candidates; decide, then exclude the wrong ones)', results.filter((r) => r.status === 'multi'), (r) => {
  console.log(`  ${r.stem} ${r.date ?? '(no date)'}  -> ${r.hint}`);
  for (const c of r.candidates) console.log(`      ${short(c)}`);
});
section('UNIQUE', results.filter((r) => r.status === 'unique'), (r) => console.log(`  ${r.stem} ${r.date ?? ''} -> ${short(r.candidates[0])}`));

const labels = Object.groupBy(results.flatMap((r) => r.candidates), (c) => c.label);
console.log(`\n${results.length} photos: ${results.filter((r) => r.status === 'unique').length} unique, ${results.filter((r) => r.status === 'multi').length} multi, ${results.filter((r) => r.status === 'none').length} none`);
console.log(`current labels of all candidates: ${Object.entries(labels).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);

const outFile = opts.out ?? 'matches.json';
writeFileSync(outFile, JSON.stringify(results, null, 1));
console.log(`wrote ${outFile}`);
