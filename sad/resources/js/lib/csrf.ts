import axios from 'axios';

function readMetaToken(): string | null {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content || null;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfMetaToken(): string {
  return readMetaToken() || '';
}

export function getXsrfCookieToken(): string {
  return readCookie('XSRF-TOKEN') || '';
}

// Backwards-compatible helper; prefer meta token for body/header X-CSRF-TOKEN
export function getCsrfToken(): string {
  // Prefer meta (session CSRF token) for form _token / X-CSRF-TOKEN header
  const token = getCsrfMetaToken() || getXsrfCookieToken() || '';
  if (!token) {
    console.warn('CSRF token not found. This may cause 419 errors.');
  }
  return token;
}

export function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const metaToken = getCsrfMetaToken();
  const xsrfToken = getXsrfCookieToken();
  const headers = new Headers(init.headers || {});
  // Always identify as AJAX and attach both CSRF headers
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (metaToken) headers.set('X-CSRF-TOKEN', metaToken);
  if (xsrfToken) headers.set('X-XSRF-TOKEN', xsrfToken);

  return fetch(input, {
    ...init,
    // Include cookies even when calling between ports during dev
    credentials: init.credentials ?? 'include',
    headers,
  });
}

export function installAxiosCsrf() {
  // Ensure cookies flow for same-origin requests
  axios.defaults.withCredentials = true;
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  // Make sure axios uses Laravel's default cookie/header names for XSRF
  (axios.defaults as any).xsrfCookieName = 'XSRF-TOKEN';
  (axios.defaults as any).xsrfHeaderName = 'X-XSRF-TOKEN';

  axios.interceptors.request.use(
    (config) => {
      const metaToken = getCsrfMetaToken();
      const xsrfToken = getXsrfCookieToken();
      if (metaToken || xsrfToken) {
        // Ensure headers exist
        config.headers = config.headers ?? {};
        // Set both headers so either mechanism passes
        if (metaToken) (config.headers as any)['X-CSRF-TOKEN'] = metaToken;
        if (xsrfToken) (config.headers as any)['X-XSRF-TOKEN'] = xsrfToken;

        // For mutating requests, also include _token in body when feasible
        const method = (config.method || '').toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method) && metaToken) {
          try {
            if (config.data && typeof config.data === 'object' && config.data !== null) {
              if (config.data instanceof FormData) {
                if (!config.data.has('_token')) config.data.append('_token', metaToken);
              } else if (!(config.data as any)._token) {
                config.data = { ...(config.data as any), _token: metaToken };
              }
            } else if (!config.data) {
              config.data = { _token: metaToken };
            }
          } catch (e) {
            console.warn('CSRF body token injection warning:', e);
          }
        }
      } else {
        console.warn('CSRF tokens not found; requests may fail with 419');
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Auto-recover from CSRF token mismatch (419): refresh cookies, then retry once
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const original = error?.config || {};
      if (status === 419 && !original.__csrfRetried) {
        try {
          // Mark to avoid infinite loop
          original.__csrfRetried = true;
          // Refresh XSRF cookie and session CSRF token
          const resp = await axios.get('/api/csrf-token', {
            withCredentials: true,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });
          const newToken = resp?.data?.token;
          if (newToken) {
            // Update meta tag so subsequent requests use the fresh token in headers/body
            let meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            if (!meta) {
              meta = document.createElement('meta');
              meta.setAttribute('name', 'csrf-token');
              document.head.appendChild(meta);
            }
            meta.content = newToken;
          }
          // Retry original request with freshly set cookies
          return axios.request(original);
        } catch (refreshErr) {
          // Fall through to reject
        }
      }
      return Promise.reject(error);
    }
  );
}

// Explicitly refresh CSRF token (and XSRF cookie) and update the meta tag; returns new token or null
export async function refreshCsrfToken(): Promise<string | null> {
  try {
    const resp = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const token = data?.token as string | undefined;
    if (token) {
      let meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'csrf-token');
        document.head.appendChild(meta);
      }
      meta.content = token;
      return token;
    }
  } catch (e) {
    // ignore
  }
  return null;
}
