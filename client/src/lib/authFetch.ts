import { auth } from './firebase';

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Allow an override base URL for API calls (useful when frontend is hosted on a different domain)
  const apiBase = (import.meta as any).env?.VITE_API_URL || '';
  const finalUrl = (url.startsWith('/api') && apiBase) ? `${apiBase}${url}` : url;

  const headers = new Headers(options.headers as HeadersInit || {});

  // If a Firebase user is signed in, attach the ID token as a Bearer token
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await (user as any).getIdToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (err) {
    // token fetch failed; we continue and let session-based auth handle it if present
    console.warn('authFetch: failed to obtain id token', err);
  }

  return fetch(finalUrl, {
    ...options,
    headers,
    // keep credentials: 'include' so same-site cookies still work when possible
    credentials: 'include',
  });
}
