import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildDefaultContent, SECTIONS } from './sections.js';
import { hashPassword } from './password.js';

/**
 * Tiny JSON document store.
 *
 * Why JSON instead of SQLite? The dataset is one site document plus a few
 * hundred rows of messages/admins, so a single atomically-written file keeps
 * deployment simple (no native module, no database server) while still being
 * easy to back up. Writes are serialised per process and use write-then-rename
 * so a crash can never leave a half-written database.
 *
 * The rest of the app only talks to the helpers exported here, so swapping in
 * SQLite later means changing this file alone.
 */

const DATA_DIR = path.resolve(
  process.env.STUDIO_DATA_DIR || path.join(process.cwd(), 'data'),
);
const DB_PATH = path.join(DATA_DIR, 'db.json');
const TMP_PATH = path.join(DATA_DIR, 'db.json.tmp');

const state = () => (globalThis.__stellarStore ??= { db: null, queue: Promise.resolve() });

export const ADMIN_ROLES = [
  { value: 'owner', label: 'Owner', description: 'Everything, including other administrators.' },
  { value: 'editor', label: 'Editor', description: 'Content and messages. No administrator access.' },
];

function nowIso() {
  return new Date().toISOString();
}

export function id() {
  return crypto.randomUUID();
}

function createDb() {
  const timestamp = nowIso();
  return {
    schemaVersion: 1,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    content: buildDefaultContent(),
    admins: [
      {
        id: id(),
        name: 'Administrator',
        email: 'admin',
        role: 'owner',
        active: true,
        passwordHash: hashPassword('admin'),
        passwordChangedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: null,
      },
    ],
    sessions: [],
    messages: [],
    activity: [],
  };
}

/** Fills in anything a newer version of the app expects. */
function migrate(db) {
  let changed = false;
  const touch = () => {
    changed = true;
  };

  if (!db || typeof db !== 'object' || Array.isArray(db)) {
    return { db: createDb(), changed: true };
  }

  if (!db.content || typeof db.content !== 'object') {
    db.content = buildDefaultContent();
    touch();
  } else {
    const defaults = buildDefaultContent();
    for (const section of SECTIONS) {
      if (!db.content[section.id] || typeof db.content[section.id] !== 'object') {
        db.content[section.id] = defaults[section.id];
        touch();
      }
    }
  }

  for (const key of ['admins', 'sessions', 'messages', 'activity']) {
    if (!Array.isArray(db[key])) {
      db[key] = [];
      touch();
    }
  }

  if (!db.admins.length) {
    const timestamp = nowIso();
    db.admins.push({
      id: id(),
      name: 'Administrator',
      email: 'admin',
      role: 'owner',
      active: true,
      passwordHash: hashPassword('admin'),
      passwordChangedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLoginAt: null,
    });
    touch();
  }

  if (db.revision == null) {
    db.revision = 1;
    touch();
  }
  if (!db.updatedAt) {
    db.updatedAt = nowIso();
    touch();
  }

  return { db, changed };
}

function persist(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const payload = JSON.stringify(db, null, 2);
  // Write to a temporary file first, then rename: rename is atomic on POSIX
  // and replaces the target atomically on Windows too.
  fs.writeFileSync(TMP_PATH, payload, 'utf8');
  fs.renameSync(TMP_PATH, DB_PATH);
}

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DB_PATH)) {
    const fresh = createDb();
    persist(fresh);
    return fresh;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (error) {
    // Never throw away data silently: keep the broken file for inspection.
    const backup = path.join(DATA_DIR, `db.corrupt-${Date.now()}.json`);
    try {
      fs.renameSync(DB_PATH, backup);
    } catch {
      /* ignore */
    }
    console.error(`[store] ${DB_PATH} was unreadable (${error.message}). Moved to ${backup}.`);
    const fresh = createDb();
    persist(fresh);
    return fresh;
  }

  const { db, changed } = migrate(parsed);
  if (changed) persist(db);
  return db;
}

/** Synchronous read access for server components. */
export function getDb() {
  const store = state();
  if (!store.db) store.db = load();
  return store.db;
}

/**
 * Serialised read-modify-write. The callback may mutate the database object;
 * its return value is passed back to the caller.
 */
export function mutate(callback) {
  const store = state();
  const run = store.queue.then(() => {
    const db = getDb();
    const result = callback(db);
    db.revision = (db.revision || 0) + 1;
    db.updatedAt = nowIso();
    persist(db);
    return result;
  });
  // Keep the chain alive even if one mutation fails.
  store.queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function pushActivity(db, { actor, action, target, meta }) {
  db.activity = Array.isArray(db.activity) ? db.activity : [];
  db.activity.unshift({
    id: id(),
    at: nowIso(),
    actor: actor || 'system',
    action,
    target: target || '',
    meta: meta || null,
  });
  db.activity = db.activity.slice(0, 300);
}

export function databaseInfo() {
  return { path: DB_PATH, directory: DATA_DIR };
}
