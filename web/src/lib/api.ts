const DEFAULT_API = "http://localhost:4000";
export const apiBase = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_API;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}


