const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

async function j<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(t || `HTTP ${resp.status}`);
  }
  return resp.json() as any;
}

export const api = {
  async listArticles() {
    return j(await fetch(`${API_URL}/api/articles`));
  },

  async uploadArticle(file: File, title?: string) {
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);

    return j(await fetch(`${API_URL}/api/articles/upload`, { method: "POST", body: fd }));
  },

  async deleteArticle(id: string) {
    return j(await fetch(`${API_URL}/api/articles/${id}`, { method: "DELETE" }));
  },

  async ask(question: string, articleIds: string[], model: string) {
    return j(await fetch(`${API_URL}/api/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, articleIds, model })
    }));
  }
};
