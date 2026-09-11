// Client API wrapper for IronCore backend.
// Same-origin relative path — the Express server serves both the API and the
// built frontend from one origin/port in production, so this never needs a host.
export const API_BASE = '/api';

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
