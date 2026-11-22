export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: { path: string; message: string }[], public details?: Record<string, unknown>) {
    super(message);
  }
}

/**
 * Where the API lives:
 * - Vite dev server (:5173) and the Node server itself (:4000) → same origin `/api` (dev proxy / same server)
 * - XAMPP Apache (http://localhost/medmap3d/) → the Node API on port 4000 of the same host
 * - Cloud hosting (Render) / share link → same origin `/api`
 * Override with VITE_API_URL at build time if needed.
 */
function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const { protocol, hostname, port } = window.location;
  // Only XAMPP Apache on this computer (localhost:80) needs the separate Node port; everywhere else the API is same-origin.
  const isLocalApache = (hostname === 'localhost' || hostname === '127.0.0.1') && (port === '' || port === '80');
  return isLocalApache ? `${protocol}//${hostname}:4000/api` : '/api';
}
export const API_BASE = resolveApiBase();
export const fileUrl = (id: number) => `${API_BASE}/files/${id}`;

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${url}`, {
      method,
      credentials: 'include',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Серверге қосылу мүмкін болмады. START_MEDMAP.bat іске қосылғанын тексеріңіз.');
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const d = data as { error?: string; fields?: { path: string; message: string }[]; details?: Record<string, unknown> } | null;
    const msg = d?.fields?.length ? `${d.error}: ${d.fields[0].message}` : d?.error ?? `Қате (${res.status})`;
    if (res.status === 401 && !url.startsWith('/auth/')) window.dispatchEvent(new Event('medmap:unauthorized'));
    throw new ApiError(res.status, msg, d?.fields, d?.details);
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body ?? {}),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body ?? {}),
  del: <T>(url: string) => request<T>('DELETE', url),
};

/** Opens a server-generated PDF in a new tab (cookie-authenticated). */
export async function openPdf(url: string) {
  const win = window.open('', '_blank');
  const res = await fetch(`${API_BASE}${url}`, { credentials: 'include' });
  if (!res.ok) {
    win?.close();
    throw new ApiError(res.status, 'PDF жасау мүмкін болмады');
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  if (win) win.location.href = href;
  else window.location.href = href;
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}
