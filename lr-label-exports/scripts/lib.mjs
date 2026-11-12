// Shared helpers: argument parsing, Cull Remote API access, dates.
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Minimal parser: positional args plus --flag and --key value.
export function parseArgs(argv, booleans = []) {
  const positional = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const key = a.slice(2);
    if (booleans.includes(key)) opts[key] = true;
    else opts[key] = argv[++i];
  }
  return { positional, opts };
}

// The live server is 47800. The LRC_DEV test instance is 47810.
export function baseUrl(opts) {
  return (opts.base ?? process.env.CULL_REMOTE_URL ?? 'http://127.0.0.1:47800').replace(/\/$/, '');
}

export async function getJson(base, pathAndQuery) {
  const res = await fetch(base + pathAndQuery);
  if (!res.ok) throw new Error(`GET ${pathAndQuery} -> ${res.status} ${await res.text()}`);
  return res.json();
}

export async function postOps(base, ops) {
  const res = await fetch(`${base}/api/ops`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ops }),
  });
  if (!res.ok) throw new Error(`POST /api/ops -> ${res.status} ${await res.text()}`);
  return (await res.json()).results;
}

export async function ensureOnline(base) {
  let status;
  try {
    status = await getJson(base, '/api/status');
  } catch (e) {
    fail(`Cull Remote server not reachable at ${base} (${e.message}). Open Lightroom with the Cull Remote plugin enabled; the plugin starts the server.`);
  }
  if (!status.lrOnline) fail('Cull Remote server is up but Lightroom is not polling it. Make sure Lightroom is open and the plugin is enabled.');
}

export async function listPhotos(base, folderPath) {
  return getJson(base, `/api/photos?source=${encodeURIComponent('f:' + folderPath)}`);
}

// Current state of the given photos, read fresh from Lightroom. photos: [{ id, folder }].
export async function readCurrent(base, photos) {
  const wanted = new Set(photos.map((p) => p.id));
  const current = new Map();
  for (const folder of new Set(photos.map((p) => p.folder))) {
    for (const p of await listPhotos(base, folder)) if (wanted.has(p.id)) current.set(p.id, p);
  }
  return current;
}

// Write labels, retry what Lightroom was too busy for, then read them back.
// changes: [{ id, folder, name, value }]. Returns the changes that did not stick.
export async function writeLabels(base, changes) {
  let pending = changes;
  for (let attempt = 1; attempt <= 3 && pending.length; attempt++) {
    const retry = [];
    for (let i = 0; i < pending.length; i += 50) {
      const chunk = pending.slice(i, i + 50);
      const ops = chunk.map((c) => ({ opId: randomUUID(), photoId: c.id, field: 'label', value: c.value }));
      const results = await postOps(base, ops);
      results.forEach((r, j) => {
        if (r.ok) return;
        if (r.retryable) retry.push(chunk[j]);
        else console.error(`  failed ${chunk[j].name}: ${r.error}`);
      });
    }
    if (retry.length) await new Promise((r) => setTimeout(r, 2000 * attempt));
    pending = retry;
  }
  const current = await readCurrent(base, changes);
  return changes.filter((c) => current.get(c.id)?.label !== c.value);
}

// Lightroom stores dateTimeOriginal as seconds since 2001-01-01 UTC. Shown as the local
// calendar date, which is what folder names and export prefixes use.
const COCOA_EPOCH_MS = Date.UTC(2001, 0, 1);
export function cocoaToLocalDate(seconds) {
  if (!seconds) return null;
  return new Date(COCOA_EPOCH_MS + seconds * 1000).toLocaleDateString('sv-SE');
}

export function dayDiff(a, b) {
  return Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;
}

// Undo logs outlive the session, so they go to a fixed folder.
export function stateDir() {
  const dir = path.join(os.homedir(), '.cache', 'lr-label-exports');
  mkdirSync(dir, { recursive: true });
  return dir;
}

// Writes a new undo log; never reuses a name, since two runs can start in the same second.
export function writeNewLog(data) {
  const dir = stateDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23);
  for (let n = 0; ; n++) {
    const file = path.join(dir, `undo-${stamp}${n ? `-${n}` : ''}.json`);
    try {
      writeFileSync(file, JSON.stringify(data, null, 1), { flag: 'wx' });
      return file;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
  }
}

// Stops a script with a message. process.exit() after fetch() can abort Node on Windows
// (libuv UV_HANDLE_CLOSING assertion), so this throws and lets the process end by itself.
class Stop extends Error {}
export function fail(message) {
  throw new Stop(message);
}
process.on('uncaughtException', (e) => {
  console.error(e instanceof Stop ? e.message : e.stack);
  process.exitCode = 1;
});
