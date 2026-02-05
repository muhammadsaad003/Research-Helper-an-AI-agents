import React from "react";
import { api } from "../lib/api";

export function Library({
  articles,
  selected,
  setSelected,
  onDeleted
}: {
  articles: any[];
  selected: Record<string, boolean>;
  setSelected: (v: Record<string, boolean>) => void;
  onDeleted: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Library</div>
        <div className="text-xs text-zinc-500">{articles.length} papers</div>
      </div>

      <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
        {articles.map((a) => (
          <div key={a.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <label className="flex gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!selected[a.id]}
                  onChange={(e) => setSelected({ ...selected, [a.id]: e.target.checked })}
                />
                <div>
                  <div className="text-sm font-medium leading-snug">{a.title}</div>
                  <div className="text-xs text-zinc-500">
                    {a.filename} • {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </label>

              <button
                className="text-xs text-red-600 hover:underline"
                onClick={async () => {
                  await api.deleteArticle(a.id);
                  const next = { ...selected };
                  delete next[a.id];
                  setSelected(next);
                  onDeleted();
                }}
              >
                delete
              </button>
            </div>
          </div>
        ))}

        {articles.length === 0 && (
          <div className="text-sm text-zinc-500 py-6 text-center">
            No papers yet. Upload a PDF to start.
          </div>
        )}
      </div>
    </div>
  );
}
