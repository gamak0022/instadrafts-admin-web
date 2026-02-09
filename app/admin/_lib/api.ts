const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

function getAdminKey() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('ADMIN_KEY') || '';
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Key': getAdminKey(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    const error = data.error || { message: 'Unknown error', code: 'UNKNOWN' };
    throw new Error(`${error.message} (${error.code})`);
  }

  return data;
}

export const adminApi = {
  getJson: (path: string) => request(path, { method: 'GET' }),
  postJson: (path: string, body: any) => request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};