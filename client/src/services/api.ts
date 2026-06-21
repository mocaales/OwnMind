export type ApiRequest = <T>(path: string, options?: RequestInit) => Promise<T>;

interface ApiErrorBody {
  error?: string;
  [key: string]: unknown;
}

export function createApiClient(getToken: () => Promise<string>): ApiRequest {
  return async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    const contentType = response.headers.get('content-type') || '';
    const data = (contentType.includes('application/json') ? await response.json() : {}) as ApiErrorBody;
    if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: response.status, data });
    return data as T;
  };
}
