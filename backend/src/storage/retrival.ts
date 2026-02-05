import { z } from "zod";
import { getDb } from "./db.js";

const Token = z.string();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
}

/**
 * BM25 over chunks inside sqlite (load into memory for scoring).
 * For small/medium libraries this is fast enough and stays free.
 */
export function searchChunksBM25(params: {
  query: string;
  articleIds?: string[];
  topK?: number;
}) {
  const topK = params.topK ?? 8;
  const qTokens = tokenize(params.query);
  if (qTokens.length === 0) return [];

  const db = getDb();
  const rows = params.articleIds?.length
    ? db.prepare(
        `SELECT id, article_id, chunk_index, content, content_len
         FROM chunks
         WHERE article_id IN (${params.articleIds.map(() => "?").join(",")})`
      ).all(...params.articleIds)
    : db.prepare(
        `SELECT id, article_id, chunk_index, content, content_len FROM chunks`
      ).all();

  // Build document frequencies
  const docs = rows.map((r: any) => {
    const toks = tokenize(r.content);
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { ...r, toks, tf, dl: toks.length };
  });

  const N = docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) {
    const seen = new Set<string>();
    for (const t of d.toks) {
      if (!seen.has(t)) {
        df.set(t, (df.get(t) ?? 0) + 1);
        seen.add(t);
      }
    }
  }

  const avgdl = docs.reduce((a, d) => a + d.dl, 0) / (docs.length || 1);

  // BM25 parameters
  const k1 = 1.2;
  const b = 0.75;

  function idf(term: string) {
    const n = df.get(term) ?? 0;
    // standard BM25 idf
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }

  const scored = docs.map(d => {
    let score = 0;
    for (const t of qTokens) {
      const f = d.tf.get(t) ?? 0;
      if (f === 0) continue;
      const denom = f + k1 * (1 - b + b * (d.dl / (avgdl || 1)));
      score += idf(t) * ((f * (k1 + 1)) / denom);
    }
    return { ...d, score };
  }).filter(s => s.score > 0);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(s => ({
    chunkId: s.id as string,
    articleId: s.article_id as string,
    chunkIndex: s.chunk_index as number,
    score: s.score as number,
    content: s.content as string
  }));
}
