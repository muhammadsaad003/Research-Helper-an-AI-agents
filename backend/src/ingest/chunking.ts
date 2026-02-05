export function chunkText(text: string, opts?: { chunkSize?: number; overlap?: number }) {
  const chunkSize = opts?.chunkSize ?? 1200;
  const overlap = opts?.overlap ?? 200;

  const clean = text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!clean) return [];

  const chunks: string[] = [];
  let i = 0;

  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    let chunk = clean.slice(i, end);

    // try to end at paragraph boundary
    const lastBreak = chunk.lastIndexOf("\n\n");
    if (lastBreak > 400 && end < clean.length) {
      chunk = chunk.slice(0, lastBreak).trim();
    } else {
      chunk = chunk.trim();
    }

    if (chunk.length > 50) chunks.push(chunk);

    i = i + chunkSize - overlap;
    if (i < 0) i = 0;
    if (i >= clean.length) break;
  }

  return chunks;
}
