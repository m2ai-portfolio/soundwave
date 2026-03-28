import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "soundwave.db");

export function getDb(): Database.Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      brief TEXT NOT NULL,
      script_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audio_files (
      id TEXT PRIMARY KEY,
      script_id TEXT REFERENCES scripts(id),
      scene_index INTEGER NOT NULL,
      narration_hash TEXT NOT NULL,
      provider TEXT NOT NULL,
      file_path TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS renders (
      id TEXT PRIMARY KEY,
      script_id TEXT REFERENCES scripts(id),
      status TEXT CHECK(status IN ('pending','rendering','complete','failed')) NOT NULL,
      output_path TEXT,
      duration_ms INTEGER,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);

  return db;
}
