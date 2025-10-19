export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Session cookies are automatically sent with credentials: 'include'
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}
