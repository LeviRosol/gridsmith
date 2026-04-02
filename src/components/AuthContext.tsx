import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  MARKETING_OPT_IN_ATTRIBUTE,
  cognitoRefreshWithRefreshToken,
  cognitoUpdateUserAttributes,
  parseMarketingOptInFromIdTokenPayload,
} from '../cognito/cognitoClient';

type AuthUser = {
  sub?: string;
  email?: string;
  name?: string;
  givenName?: string;
};

type AuthContextValue = {
  loading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  user?: AuthUser;
  /** Resolved marketing preference; when signed out, undefined. Missing JWT claim defaults to true. */
  marketingOptIn?: boolean;
  setMarketingOptIn: (value: boolean) => Promise<void>;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  idToken: 'gridsmith.cognito.idToken',
  accessToken: 'gridsmith.cognito.accessToken',
  refreshToken: 'gridsmith.cognito.refreshToken',
};

const SESSION_KEYS = {
  pkceVerifier: 'gridsmith.cognito.pkceVerifier',
  redirectUri: 'gridsmith.cognito.redirectUri',
};
const TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;
const TOKEN_REFRESH_MIN_DELAY_MS = 5 * 1000;

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  return atob(padded);
}

function base64UrlEncodeBytes(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncodeBytes(digest);
}

function randomCodeVerifier(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // Allowed characters per RFC for verifier are [A-Z / a-z / 0-9 / - / . / _ / ~]
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function decodeJwt(token: string): any | undefined {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payloadRaw = base64UrlDecode(parts[1]);
    return JSON.parse(payloadRaw);
  } catch {
    return undefined;
  }
}

function normalizeGroups(groups: unknown): string[] {
  if (!groups) return [];
  if (Array.isArray(groups)) return groups.map(String);
  if (typeof groups === 'string') return [groups];
  return [];
}

function isExpiredJwt(token?: string): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true;
  const nowSeconds = Date.now() / 1000;
  return exp <= nowSeconds;
}

function applyOAuthTokenResponse(
  json: { id_token?: string; access_token?: string; refresh_token?: string },
  setIdToken: React.Dispatch<React.SetStateAction<string | null>>,
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>,
): void {
  const nextId = json?.id_token ?? null;
  const nextAccess = json?.access_token ?? null;
  const storedRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const nextRefresh = json?.refresh_token ?? storedRefresh;

  if (nextId && !isExpiredJwt(nextId)) {
    localStorage.setItem(STORAGE_KEYS.idToken, nextId);
    setIdToken(nextId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.idToken);
    setIdToken(null);
  }

  if (nextAccess && !isExpiredJwt(nextAccess)) {
    localStorage.setItem(STORAGE_KEYS.accessToken, nextAccess);
    setAccessToken(nextAccess);
  } else {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    setAccessToken(null);
  }

  if (nextRefresh) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, nextRefresh);
  } else {
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }
}

function getRoleFromTokenPayload(payload: any): boolean {
  const groupsClaim = payload?.['cognito:groups'] ?? payload?.groups ?? payload?.role;
  const groups = normalizeGroups(groupsClaim);
  return groups.some((g) => g.toLowerCase() === 'admin');
}

/** Accepts either full Cognito URL or just the domain prefix. Returns the prefix for building URLs. */
function getCognitoDomainPrefix(domain: string | undefined): string | undefined {
  if (!domain?.trim()) return undefined;
  const trimmed = domain.trim();
  const match = trimmed.match(/^(?:https?:\/\/)?([^.]+)\.auth\./i);
  if (match) return match[1];
  return trimmed;
}

/** Default callback when env COGNITO_REDIRECT_URI is unset (matches login page path rules). */
function defaultRedirectUriForPathname(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/tile-builder') {
    return `${window.location.origin}/tile-builder`;
  }
  return `${window.location.origin}/baseplate`;
}

function redirectUriForLogin(): string {
  const env = (process.env.COGNITO_REDIRECT_URI as string | undefined)?.trim();
  if (env) return env;
  return defaultRedirectUriForPathname(window.location.pathname);
}

/**
 * Must exactly match the redirect_uri sent to /oauth2/authorize. Order: session (from login),
 * env, then current page (handles lost sessionStorage while still on the callback URL).
 */
function redirectUriForCodeExchange(): string {
  const stored = sessionStorage.getItem(SESSION_KEYS.redirectUri)?.trim();
  if (stored) return stored;
  const env = (process.env.COGNITO_REDIRECT_URI as string | undefined)?.trim();
  if (env) return env;
  const { origin, pathname } = window.location;
  const p = pathname.replace(/\/+$/, '') || '/';
  return `${origin}${p}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const parseHashTokens = () => {
      const hash = window.location.hash ?? '';
      if (!hash.startsWith('#')) return null;
      const params = new URLSearchParams(hash.slice(1));

      // Cognito implicit flow typically returns:
      // - access_token
      // - id_token
      // (We keep this as a fallback in case you temporarily test implicit flow.)
      const nextAccess = params.get('access_token');
      const nextId = params.get('id_token');
      return { nextAccess, nextId };
    };

    const applyTokens = (
      nextId: string | null,
      nextAccess: string | null,
      nextRefresh?: string | null,
    ) => {
      if (nextId && !isExpiredJwt(nextId)) {
        localStorage.setItem(STORAGE_KEYS.idToken, nextId);
        setIdToken(nextId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.idToken);
        setIdToken(null);
      }

      if (nextAccess && !isExpiredJwt(nextAccess)) {
        localStorage.setItem(STORAGE_KEYS.accessToken, nextAccess);
        setAccessToken(nextAccess);
      } else {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        setAccessToken(null);
      }

      if (nextRefresh !== undefined) {
        if (nextRefresh) {
          localStorage.setItem(STORAGE_KEYS.refreshToken, nextRefresh);
        } else {
          localStorage.removeItem(STORAGE_KEYS.refreshToken);
        }
      }
    };

    const exchangeCodeForTokens = async (code: string) => {
      const domainPrefix = getCognitoDomainPrefix(process.env.COGNITO_DOMAIN as string | undefined);
      const region = process.env.COGNITO_REGION as string | undefined;
      const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;

      if (!domainPrefix || !region || !clientId) {
        throw new Error('Cognito not configured (missing COGNITO_DOMAIN/COGNITO_REGION/COGNITO_CLIENT_ID).');
      }

      const verifier = sessionStorage.getItem(SESSION_KEYS.pkceVerifier);
      const redirectUri = redirectUriForCodeExchange();

      if (!verifier) {
        throw new Error('Missing PKCE code verifier in sessionStorage.');
      }

      const tokenUrl = `https://${domainPrefix}.auth.${region}.amazoncognito.com/oauth2/token`;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        code_verifier: verifier,
        redirect_uri: redirectUri,
      });

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const json = await res.json();
      if (!res.ok) {
        const hint =
          typeof json?.error_description === 'string' ? ` (${json.error_description})` : '';
        throw new Error(`Token exchange failed: ${json?.error ?? res.status}${hint}`);
      }

      const nextId = json?.id_token ?? null;
      const nextAccess = json?.access_token ?? null;
      const nextRefresh = json?.refresh_token ?? null;
      applyTokens(nextId, nextAccess, nextRefresh);
      sessionStorage.removeItem(SESSION_KEYS.pkceVerifier);
      sessionStorage.removeItem(SESSION_KEYS.redirectUri);
    };

    const refreshTokens = async (refreshToken: string) => {
      const domainPrefix = getCognitoDomainPrefix(process.env.COGNITO_DOMAIN as string | undefined);
      const region = process.env.COGNITO_REGION as string | undefined;
      const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;

      if (!domainPrefix || !region || !clientId) {
        throw new Error('Cognito not configured (missing COGNITO_DOMAIN/COGNITO_REGION/COGNITO_CLIENT_ID).');
      }

      const tokenUrl = `https://${domainPrefix}.auth.${region}.amazoncognito.com/oauth2/token`;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      });

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(`Token refresh failed: ${json?.error ?? res.status}`);
      }

      const nextId = json?.id_token ?? null;
      const nextAccess = json?.access_token ?? null;
      // Cognito typically does not rotate refresh tokens on refresh, so keep the existing token unless present.
      const nextRefresh = json?.refresh_token ?? refreshToken;
      applyTokens(nextId, nextAccess, nextRefresh);
    };

    const init = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      try {
        if (code) {
          // Drop code from the URL synchronously so React Strict Mode / a second init cannot
          // exchange the same one-time code (Cognito returns invalid_grant).
          const oauthCode = code;
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState(null, '', url.pathname + url.search + url.hash);
          await exchangeCodeForTokens(oauthCode);
        } else if (error) {
          console.warn('Cognito OAuth error:', error);
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState(null, '', cleanUrl);
        } else {
          const { nextAccess, nextId } = parseHashTokens() ?? {};
          if (nextId || nextAccess) {
            applyTokens(nextId ?? null, nextAccess ?? null);
            const cleanUrl = window.location.pathname + window.location.search;
            window.history.replaceState(null, '', cleanUrl);
          } else {
            const storedId = localStorage.getItem(STORAGE_KEYS.idToken);
            const storedAccess = localStorage.getItem(STORAGE_KEYS.accessToken);
            const storedRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);

            if (storedRefresh && (isExpiredJwt(storedId ?? undefined) || isExpiredJwt(storedAccess ?? undefined))) {
              await refreshTokens(storedRefresh);
            } else {
              applyTokens(storedId, storedAccess);
            }
          }
        }
      } catch (e) {
        console.warn('Auth init failed:', e);
        localStorage.removeItem(STORAGE_KEYS.idToken);
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
        setIdToken(null);
        setAccessToken(null);
      }

      const effectiveIdToken = localStorage.getItem(STORAGE_KEYS.idToken);
      const effectivePayload = decodeJwt(effectiveIdToken ?? '') ?? {};

      setIsAdmin(getRoleFromTokenPayload(effectivePayload));
      const email = effectivePayload?.email as string | undefined;
      const emailLocal = email ? email.split('@')[0] : undefined;
      const givenName = effectivePayload?.given_name as string | undefined;
      const displayName =
        effectivePayload?.given_name ??
        effectivePayload?.name ??
        effectivePayload?.['cognito:username'] ??
        emailLocal;
      setUser({
        sub: effectivePayload?.sub,
        email,
        name: displayName,
        givenName,
      });

      setLoading(false);
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!idToken) return;
    const payload = decodeJwt(idToken) ?? {};
    setIsAdmin(getRoleFromTokenPayload(payload));
    const email = payload?.email as string | undefined;
    const emailLocal = email ? email.split('@')[0] : undefined;
    const givenName = payload?.given_name as string | undefined;
    const displayName =
      payload?.given_name ??
      payload?.name ??
      payload?.['cognito:username'] ??
      emailLocal;
    setUser({
      sub: payload?.sub,
      email,
      name: displayName,
      givenName,
    });
  }, [idToken]);

  useEffect(() => {
    if (!idToken) return;
    const payload = decodeJwt(idToken);
    const exp = payload?.exp;
    if (typeof exp !== 'number') return;

    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!refreshToken) return;

    const expiresAtMs = exp * 1000;
    const delayMs = Math.max(
      TOKEN_REFRESH_MIN_DELAY_MS,
      expiresAtMs - Date.now() - TOKEN_REFRESH_SKEW_MS,
    );

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const domainPrefix = getCognitoDomainPrefix(process.env.COGNITO_DOMAIN as string | undefined);
          const region = process.env.COGNITO_REGION as string | undefined;
          const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;

          if (!domainPrefix || !region || !clientId) {
            throw new Error(
              'Cognito not configured (missing COGNITO_DOMAIN/COGNITO_REGION/COGNITO_CLIENT_ID).',
            );
          }

          const tokenUrl = `https://${domainPrefix}.auth.${region}.amazoncognito.com/oauth2/token`;
          const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            refresh_token: refreshToken,
          });

          const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(`Token refresh failed: ${json?.error ?? res.status}`);
          }

          applyOAuthTokenResponse(
            {
              id_token: json?.id_token,
              access_token: json?.access_token,
              refresh_token: json?.refresh_token ?? refreshToken,
            },
            setIdToken,
            setAccessToken,
          );
        } catch (e) {
          console.warn('Proactive token refresh failed:', e);
          localStorage.removeItem(STORAGE_KEYS.idToken);
          localStorage.removeItem(STORAGE_KEYS.accessToken);
          localStorage.removeItem(STORAGE_KEYS.refreshToken);
          setIdToken(null);
          setAccessToken(null);
          setIsAdmin(false);
          setUser(undefined);
        }
      })();
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [idToken]);

  const login = () => {
    void (async () => {
      const domainPrefix = getCognitoDomainPrefix(process.env.COGNITO_DOMAIN as string | undefined);
      const region = process.env.COGNITO_REGION as string | undefined;
      const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;

      if (!domainPrefix || !region || !clientId) {
        console.warn('Cognito not configured: missing COGNITO_DOMAIN/COGNITO_REGION/COGNITO_CLIENT_ID.');
        return;
      }

      const redirectUri = redirectUriForLogin();

      const codeVerifier = randomCodeVerifier(64);
      const codeChallenge = await sha256Base64Url(codeVerifier);

      // Store verifier for the redirect exchange step.
      sessionStorage.setItem(SESSION_KEYS.pkceVerifier, codeVerifier);
      sessionStorage.setItem(SESSION_KEYS.redirectUri, redirectUri);

      const state = Math.random().toString(36).slice(2);
      const authorizeUrl =
        `https://${domainPrefix}.auth.${region}.amazoncognito.com/oauth2/authorize` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        // `aws.cognito.signin.user.admin` is required for Cognito IDP APIs that use the access token
        // (e.g. UpdateUserAttributes for marketing opt-in). Allow this scope on the app client in Cognito.
        `&scope=${encodeURIComponent('openid email profile aws.cognito.signin.user.admin')}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        `&code_challenge_method=S256`;

      window.location.href = authorizeUrl;
    })();
  };

  const logout = () => {
    const domainPrefix = getCognitoDomainPrefix(process.env.COGNITO_DOMAIN as string | undefined);
    const region = process.env.COGNITO_REGION as string | undefined;
    const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;

    localStorage.removeItem(STORAGE_KEYS.idToken);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    setIdToken(null);
    setAccessToken(null);
    setIsAdmin(false);
    setUser(undefined);

    if (!domainPrefix || !region || !clientId) return;

    const logoutUri = (process.env.COGNITO_LOGOUT_URI as string | undefined) ?? window.location.origin;
    const logoutUrl =
      `https://${domainPrefix}.auth.${region}.amazoncognito.com/logout` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&logout_uri=${encodeURIComponent(logoutUri)}`;
    window.location.href = logoutUrl;
  };

  const setMarketingOptIn = useCallback(async (value: boolean) => {
    const region = process.env.COGNITO_REGION as string | undefined;
    const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;
    const access = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!region || !clientId || !access || !refresh) {
      throw new Error('Cognito is not configured or you are not signed in.');
    }
    await cognitoUpdateUserAttributes(region, access, [
      { Name: MARKETING_OPT_IN_ATTRIBUTE, Value: value ? 'true' : 'false' },
    ]);
    const json = await cognitoRefreshWithRefreshToken({ region, clientId, refreshToken: refresh });
    applyOAuthTokenResponse(json, setIdToken, setAccessToken);
  }, []);

  const marketingDefaultSyncedSubRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    const effectiveIdToken = localStorage.getItem(STORAGE_KEYS.idToken);
    if (!effectiveIdToken || isExpiredJwt(effectiveIdToken)) return;
    const payload = decodeJwt(effectiveIdToken) ?? {};
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!sub) return;
    if (payload[MARKETING_OPT_IN_ATTRIBUTE] !== undefined) {
      marketingDefaultSyncedSubRef.current = sub;
      return;
    }
    if (marketingDefaultSyncedSubRef.current === sub) return;
    marketingDefaultSyncedSubRef.current = sub;

    const region = process.env.COGNITO_REGION as string | undefined;
    const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;
    const access = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refresh = localStorage.getItem(STORAGE_KEYS.refreshToken);

    if (!region || !clientId || !access || !refresh) return;

    void (async () => {
      try {
        await cognitoUpdateUserAttributes(region, access, [
          { Name: MARKETING_OPT_IN_ATTRIBUTE, Value: 'true' },
        ]);
        const json = await cognitoRefreshWithRefreshToken({ region, clientId, refreshToken: refresh });
        applyOAuthTokenResponse(json, setIdToken, setAccessToken);
      } catch (e) {
        console.warn('Marketing opt-in default could not be synced to Cognito:', e);
      }
    })();
  }, [loading, idToken]);

  const value = useMemo<AuthContextValue>(() => {
    const signedIn = !!idToken && !isExpiredJwt(idToken);
    const marketingOptIn = signedIn
      ? parseMarketingOptInFromIdTokenPayload(decodeJwt(idToken ?? ''))
      : undefined;
    return {
      loading,
      isSignedIn: signedIn,
      isAdmin: signedIn ? isAdmin : false,
      user,
      marketingOptIn,
      setMarketingOptIn,
      login,
      logout,
    };
  }, [idToken, isAdmin, loading, user, setMarketingOptIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

