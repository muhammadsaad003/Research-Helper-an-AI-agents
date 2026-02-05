import React, { useMemo, useState } from "react";
import { api } from "../lib/api";

export function AskPanel({ selectedArticleIds }: { selectedArticleIds: string[] }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<any[] | null>(null);
  const [model, setModel] = useState("openrouter/free");

  const hint = useMemo(() => {
    if (selectedArticleIds.length === 0) return "No papers selected (agent will search all).";
    return `Selected: ${selectedArticleIds.length} paper(s).`;
  }, [selectedArticleIds]);

  async function ask() {
    setAnswer(null);
    setEvidence(null);

    const question = q.trim();
    if (!question) return;

    setBusy(true);
    try {
      const out = await api.ask(question, selectedArticleIds, model);
      setAnswer(out.answer);
      setEvidence(out.evidence || []);
    } catch (e: any) {
      setAnswer(e?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Ask a question</div>
          <div className="text-xs text-zinc-500">{hint}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500">Model</div>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-[200px] rounded-xl border px-3 py-2 text-xs font-mono"
            title="Default is openrouter/free"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={4}
          placeholder="Example: What dataset did they use, and what were the key results?"
          className="w-full rounded-2xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
          disabled={busy}
        />

        <button
          onClick={ask}
          disabled={busy}
          className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Thinking..." : "Ask"}
        </button>

        {answer && (
          <div className="mt-4 rounded-2xl border bg-zinc-50 p-4">
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{answer}</div>
          </div>
        )}

        {evidence && evidence.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Evidence</div>
            <div className="space-y-2">
              {evidence.map((ev, i) => (
                <div key={i} className="rounded-xl border p-3 text-sm">
                  <div className="text-xs text-zinc-500 mb-1">
                    {ev.articleTitle} §Chunk {ev.chunkIndex}
                  </div>
                  <div className="text-sm text-zinc-800 whitespace-pre-wrap">
                    {ev.excerpt}
                    {ev.excerpt?.length >= 400 ? "…" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {evidence && evidence.length === 0 && (
          <div className="text-sm text-zinc-500">
            No evidence chunks returned (try selecting papers or asking more specifically).
          </div>
        )}
      </div>
    </div>
  );
}
