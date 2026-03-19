import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthUser = {
  sub?: string;
  email?: string;
  name?: string;
};

type AuthContextValue = {
  loading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  user?: AuthUser;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  idToken: 'gridsmith.cognito.idToken',
  accessToken: 'gridsmith.cognito.accessToken',
};

const SESSION_KEYS = {
  pkceVerifier: 'gridsmith.cognito.pkceVerifier',
  redirectUri: 'gridsmith.cognito.redirectUri',
};

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

    const applyTokens = (nextId: string | null, nextAccess: string | null) => {
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
    };

    const exchangeCodeForTokens = async (code: string) => {
      const domainPrefix = getCognitoDomainPrefix(process.env.COGNITO_DOMAIN as string | undefined);
      const region = process.env.COGNITO_REGION as string | undefined;
      const clientId = process.env.COGNITO_CLIENT_ID as string | undefined;

      if (!domainPrefix || !region || !clientId) {
        throw new Error('Cognito not configured (missing COGNITO_DOMAIN/COGNITO_REGION/COGNITO_CLIENT_ID).');
      }

      const verifier = sessionStorage.getItem(SESSION_KEYS.pkceVerifier);
      const redirectUri =
        sessionStorage.getItem(SESSION_KEYS.redirectUri) ??
        (process.env.COGNITO_REDIRECT_URI as string | undefined) ??
        `${window.location.origin}/viewer`;

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
        throw new Error(`Token exchange failed: ${json?.error ?? res.status}`);
      }

      const nextId = json?.id_token ?? null;
      const nextAccess = json?.access_token ?? null;
      applyTokens(nextId, nextAccess);
    };

    const init = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      try {
        if (code) {
          await exchangeCodeForTokens(code);
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState(null, '', cleanUrl);
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
            applyTokens(storedId, storedAccess);
          }
        }
      } catch (e) {
        console.warn('Auth init failed:', e);
        localStorage.removeItem(STORAGE_KEYS.idToken);
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        setIdToken(null);
        setAccessToken(null);
      }

      const effectiveIdToken = localStorage.getItem(STORAGE_KEYS.idToken);
      const effectivePayload = decodeJwt(effectiveIdToken ?? '') ?? {};

      setIsAdmin(getRoleFromTokenPayload(effectivePayload));
      const email = effectivePayload?.email as string | undefined;
      const emailLocal = email ? email.split('@')[0] : undefined;
      const displayName =
        effectivePayload?.given_name ??
        effectivePayload?.name ??
        effectivePayload?.['cognito:username'] ??
        emailLocal;
      setUser({
        sub: effectivePayload?.sub,
        email,
        name: displayName,
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
    const displayName =
      payload?.given_name ??
      payload?.name ??
      payload?.['cognito:username'] ??
      emailLocal;
    setUser({
      sub: payload?.sub,
      email,
      name: displayName,
    });
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

      const redirectUri =
        (process.env.COGNITO_REDIRECT_URI as string | undefined) ??
        `${window.location.origin}/viewer`;

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
        `&scope=${encodeURIComponent('openid email profile')}` +
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

  const value = useMemo<AuthContextValue>(() => {
    const signedIn = !!idToken && !isExpiredJwt(idToken);
    return {
      loading,
      isSignedIn: signedIn,
      isAdmin: signedIn ? isAdmin : false,
      user,
      login,
      logout,
    };
  }, [idToken, isAdmin, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

