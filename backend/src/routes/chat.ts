import { Router } from "express";
import { z } from "zod";
import { searchChunksBM25 } from "../storage/retrieval.js";
import { getDb } from "../storage/db.js";
import { openRouterChat } from "../lib/openrouter.js";

export const chatRouter = Router();

const AskSchema = z.object({
  question: z.string().min(2),
  articleIds: z.array(z.string()).optional(),
  model: z.string().optional()
});

chatRouter.post("/ask", async (req, res) => {
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { question, articleIds } = parsed.data;
  const model = parsed.data.model || process.env.OPENROUTER_MODEL || "openrouter/free";

  const tools = [
    {
      type: "function",
      function: {
        name: "search_chunks",
        description: "Search relevant article chunks using BM25 retrieval.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            articleIds: { type: "array", items: { type: "string" } },
            topK: { type: "number" }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_chunk",
        description: "Get a chunk by id (for quoting and citations).",
        parameters: {
          type: "object",
          properties: {
            chunkId: { type: "string" }
          },
          required: ["chunkId"]
        }
      }
    }
  ] as const;

  const system = `
You are a research assistant that answers strictly from the uploaded research articles.
You MUST use the provided tools to retrieve evidence.
Rules:
- Prefer calling search_chunks first.
- Cite sources in-line like: [ArticleTitle §ChunkIndex]
- If evidence is insufficient, say what is missing and ask for the needed paper/section.
- Do not fabricate citations.
- Keep answers clear and structured: Summary, Evidence, Notes/Limitations.
`.trim();

  let messages: any[] = [
    { role: "system", content: system },
    { role: "user", content: `Question: ${question}` }
  ];

  // Simple tool loop (max 6 iterations)
  const maxIters = 6;
  const evidence: { articleTitle: string; chunkIndex: number; chunkId: string; content: string }[] = [];

  for (let iter = 0; iter < maxIters; iter++) {
    const out = await openRouterChat({
      model,
      messages,
      tools: tools as any,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 700
    });

    const msg = out?.choices?.[0]?.message;
    if (!msg) throw new Error("No model message returned");

    // If tool calls exist, execute them
    const toolCalls = msg.tool_calls as any[] | undefined;
    if (toolCalls?.length) {
      messages.push(msg);

      for (const tc of toolCalls) {
        const name = tc.function?.name;
        const args = safeJson(tc.function?.arguments);

        if (name === "search_chunks") {
          const query = String(args?.query ?? question);
          const aIds = Array.isArray(args?.articleIds) ? args.articleIds : articleIds;
          const topK = typeof args?.topK === "number" ? args.topK : 8;

          const hits = searchChunksBM25({ query, articleIds: aIds, topK });

          const payload = {
            hits: hits.map(h => ({
              chunkId: h.chunkId,
              articleId: h.articleId,
              chunkIndex: h.chunkIndex,
              score: h.score,
              preview: h.content.slice(0, 240)
            }))
          };

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(payload)
          });
        }

        if (name === "get_chunk") {
          const chunkId = String(args?.chunkId ?? "");
          const db = getDb();
          const row = db.prepare(
            `SELECT c.id, c.article_id, c.chunk_index, c.content, a.title as article_title
             FROM chunks c JOIN articles a ON a.id=c.article_id
             WHERE c.id=?`
          ).get(chunkId);

          if (!row) {
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ error: "Chunk not found" })
            });
          } else {
            evidence.push({
              articleTitle: row.article_title,
              chunkIndex: row.chunk_index,
              chunkId: row.id,
              content: row.content
            });

            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                chunkId: row.id,
                articleTitle: row.article_title,
                chunkIndex: row.chunk_index,
                content: row.content
              })
            });
          }
        }
      }

      continue;
    }

    // No tool calls => final answer
    messages.push(msg);

    return res.json({
      answer: msg.content,
      modelUsed: model,
      evidence: evidence.map(e => ({
        articleTitle: e.articleTitle,
        chunkIndex: e.chunkIndex,
        chunkId: e.chunkId,
        excerpt: e.content.slice(0, 400)
      }))
    });
  }

  res.json({
    answer: "I couldn't finish tool-based retrieval in time. Try again with a narrower question.",
    modelUsed: model,
    evidence
  });
});

function safeJson(s: any) {
  if (typeof s !== "string") return null;
  try { return JSON.parse(s); } catch { return null; }
}
