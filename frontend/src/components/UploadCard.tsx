import React, { useRef, useState } from "react";
import { api } from "../lib/api";

export function UploadCard({ onUploaded }: { onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick() {
    setMsg(null);
    const f = fileRef.current?.files?.[0];
    if (!f) return;

    setBusy(true);
    try {
      await api.uploadArticle(f, title.trim() || undefined);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Uploaded & indexed ✅");
      onUploaded();
    } catch (e: any) {
      setMsg(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border p-4 space-y-3">
      <div className="font-semibold">Upload an article</div>

      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        placeholder="Optional title (e.g., 'ResNet Paper 2015')"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={busy}
      />

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="w-full text-sm"
        disabled={busy}
      />

      <button
        onClick={onPick}
        disabled={busy}
        className="w-full rounded-xl bg-zinc-900 text-white py-2 text-sm font-medium disabled:opacity-60"
      >
        {busy ? "Uploading..." : "Upload & Index"}
      </button>

      {msg && <div className="text-sm text-zinc-600">{msg}</div>}

      <div className="text-xs text-zinc-500">
        Supported: PDF / TXT / MD (max 25MB)
      </div>
    </div>
  );
}
