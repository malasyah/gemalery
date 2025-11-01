const DEFAULT_API = "http://localhost:4000";
export const apiBase = import.meta.env.VITE_API_BASE || DEFAULT_API;

// Debug: log API base URL (for troubleshooting)
console.log("[API] Base URL:", apiBase);
console.log("[API] VITE_API_BASE env:", import.meta.env.VITE_API_BASE);
console.log("[API] All env vars:", Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}


