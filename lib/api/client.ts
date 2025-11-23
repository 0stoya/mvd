const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    cache: 'no-store' // always fresh data from middleware
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `API ${res.status} ${res.statusText} for ${path}: ${
        text || 'no body'
      }`
    );
  }

  return (await res.json()) as T;
}
