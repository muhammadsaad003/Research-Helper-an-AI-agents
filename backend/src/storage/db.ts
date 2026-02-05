import Database from "better-sqlite3";

let db: Database.Database;

export function getDb() {
  if (!db) throw new Error("DB not initialized");
  return db;
}

export function ensureDb() {
  if (db) return;

  db = new Database("rag.sqlite");
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      content_len INTEGER NOT NULL,
      FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_article_id ON chunks(article_id);
  `);
}
