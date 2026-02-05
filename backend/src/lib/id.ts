export function uid(prefix = "") {
  const s = cryptoRandom();
  return prefix ? `${prefix}_${s}` : s;
}

function cryptoRandom() {
  // Node 18+ supports crypto.randomUUID
  // fallback kept simple
  try {
    // @ts-ignore
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
