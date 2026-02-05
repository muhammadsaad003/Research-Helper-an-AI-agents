import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { getDb } from "../storage/db.js";
import { uid } from "../lib/id.js";
import { parseFileToText } from "../ingest/parse.js";
import { chunkText } from "../ingest/chunking.js";

export const articlesRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

articlesRouter.get("/", (_req, res) => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM articles ORDER BY created_at DESC`).all();
  res.json({ articles: rows });
});

articlesRouter.get("/:id", (req, res) => {
  const db = getDb();
  const a = db.prepare(`SELECT * FROM articles WHERE id=?`).get(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });

  const chunks = db.prepare(
    `SELECT id, chunk_index, content_len FROM chunks WHERE article_id=? ORDER BY chunk_index ASC`
  ).all(req.params.id);

  res.json({ article: a, chunks });
});

articlesRouter.delete("/:id", (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM articles WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});

articlesRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const schema = z.object({
    title: z.string().min(1).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const title = parsed.data.title?.trim() || req.file.originalname;
  const mime = req.file.mimetype;

  const text = await parseFileToText({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname
  });

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: "Could not extract readable text from this file." });
  }

  const chunks = chunkText(text, { chunkSize: 1200, overlap: 200 });
  if (chunks.length === 0) return res.status(400).json({ error: "No chunks created." });

  const db = getDb();
  const articleId = uid("art");
  const now = Date.now();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO articles (id, title, filename, mime, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(articleId, title, req.file!.originalname, mime, now);

    const ins = db.prepare(
      `INSERT INTO chunks (id, article_id, chunk_index, content, content_len) VALUES (?, ?, ?, ?, ?)`
    );

    chunks.forEach((c, idx) => {
      ins.run(uid("chk"), articleId, idx, c, c.length);
    });
  });

  tx();

  res.json({ ok: true, articleId, chunks: chunks.length });
});
