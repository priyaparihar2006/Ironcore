// Client API wrapper for IronCore backend.
// Supports VITE_API_URL when the frontend is deployed separately from the backend (e.g. Vercel -> Render).
// If VITE_API_URL is configured, use it (ensuring proper /api base path without trailing slashes).
// Otherwise fall back to same-origin relative '/api' (for unified hosting or local dev proxy).
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('ironcore_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('ironcore_token', token);
  } else {
    localStorage.removeItem('ironcore_token');
  }
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
