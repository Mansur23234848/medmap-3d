export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: { path: string; message: string }[]) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${url}`, {
    method,
    credentials: 'include',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const d = data as { error?: string; fields?: { path: string; message: string }[] } | null;
    const msg = d?.fields?.length ? `${d.error}: ${d.fields[0].message}` : d?.error ?? `Қате (${res.status})`;
    if (res.status === 401 && !url.startsWith('/auth/')) window.dispatchEvent(new Event('medmap:unauthorized'));
    throw new ApiError(res.status, msg, d?.fields);
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
  const res = await fetch(`/api${url}`, { credentials: 'include' });
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
