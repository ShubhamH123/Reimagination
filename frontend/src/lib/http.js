import { API_URL } from './config';

export class ApiError extends Error {
  constructor(message, { status = 0, network = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.network = network;
  }
}

/** Minimal JSON fetch wrapper: adds the auth header and turns failures into readable errors. */
export async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}. Is the backend running?`, { network: true });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, { status: res.status });
  return data;
}
