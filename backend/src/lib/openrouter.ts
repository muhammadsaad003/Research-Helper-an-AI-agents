import fetch from "node-fetch";

type ORMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "tool"; tool_call_id: string; content: string };

type ORTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: any;
  };
};

export async function openRouterChat(params: {
  model: string;
  messages: ORMessage[];
  tools?: ORTool[];
  tool_choice?: "auto" | "required" | "none";
  temperature?: number;
  max_tokens?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY in backend/.env");

  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const siteTitle = process.env.OPENROUTER_SITE_TITLE;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(siteUrl ? { "HTTP-Referer": siteUrl } : {}),
      ...(siteTitle ? { "X-Title": siteTitle } : {})
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.tool_choice ?? "auto",
      temperature: params.temperature ?? 0.2,
      max_tokens: params.max_tokens ?? 800
    })
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenRouter error ${resp.status}: ${t}`);
  }
  return resp.json() as Promise<any>;
}
