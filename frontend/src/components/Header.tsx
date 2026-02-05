import React from "react";

export function Header() {
  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Research Article AI Agent</div>
          <div className="text-sm text-zinc-500">Upload papers → ask questions → get cited answers</div>
        </div>
        <div className="text-xs text-zinc-500">
          Backend: <span className="font-mono">/api</span>
        </div>
      </div>
    </div>
  );
}
