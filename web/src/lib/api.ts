const DEFAULT_API = "http://localhost:4000";
export const apiBase = import.meta.env.VITE_API_BASE || DEFAULT_API;

// Debug: log API base URL (for troubleshooting)
if (typeof window !== "undefined") {
  console.log("[API] Base URL:", apiBase);
  console.log("[API] VITE_API_BASE env:", import.meta.env.VITE_API_BASE);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init
  });
  
  // Handle 204 No Content or empty response early
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  
  // Read response text once
  const text = await res.text();
  
  if (!res.ok) {
    // Try to parse error response as JSON
    let errorMessage = text || `HTTP ${res.status} ${res.statusText}`;
    try {
      if (text) {
        const errorObj = JSON.parse(text);
        errorMessage = errorObj.error || errorObj.message || text;
      }
    } catch {
      // If not JSON, use text as is
    }
    const error = new Error(errorMessage) as Error & { status?: number; response?: string };
    error.status = res.status;
    error.response = text;
    throw error;
  }
  
  if (!text) return undefined as T;
  
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}


