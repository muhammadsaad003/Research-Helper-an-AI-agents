import React, { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { UploadCard } from "../components/UploadCard";
import { Library } from "../components/Library";
import { AskPanel } from "../components/AskPanel";
import { api } from "../lib/api";

export default function App() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  async function refresh() {
    const data = await api.listArticles();
    setArticles(data.articles || []);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UploadCard onUploaded={refresh} />
            <Library
              articles={articles}
              selected={selected}
              setSelected={setSelected}
              onDeleted={refresh}
            />
          </div>

          <div className="lg:col-span-2">
            <AskPanel selectedArticleIds={selectedIds} />
          </div>
        </div>

        <footer className="text-sm text-zinc-500 py-6">
          Tip: select 1–3 papers for best accuracy.
        </footer>
      </main>
    </div>
  );
}
