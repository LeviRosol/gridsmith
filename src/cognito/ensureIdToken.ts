import { cognitoRefreshWithRefreshToken } from './cognitoClient.ts';
import { getStoredCognitoIdToken, ID_TOKEN_STORAGE_KEY } from './tokenStorage.ts';

const ACCESS_TOKEN_KEY = 'gridsmith.cognito.accessToken';
const REFRESH_TOKEN_KEY = 'gridsmith.cognito.refreshToken';
const TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;

function decodeJwtExp(token: string): number | undefined {
  try {
    const part = token.split('.')[1];
    if (!part) return undefined;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const payload = JSON.parse(atob(base64 + '='.repeat(padLen)));
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

function isExpiredOrNearExpiry(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (exp == null) return true;
  return exp * 1000 <= Date.now() + TOKEN_REFRESH_SKEW_MS;
}

/**
 * Returns a valid Cognito ID token for API calls, refreshing via refresh_token when needed.
 */
export async function ensureFreshCognitoIdToken(): Promise<string | null> {
  const existing = getStoredCognitoIdToken();
  if (existing && !isExpiredOrNearExpiry(existing)) {
    return existing;
  }

  const region = (process.env.COGNITO_REGION as string | undefined)?.trim();
  const clientId = (process.env.COGNITO_CLIENT_ID as string | undefined)?.trim();
  let refreshToken: string | null = null;
  try {
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return existing && !isExpiredOrNearExpiry(existing) ? existing : null;
  }

  if (!region || !clientId || !refreshToken) {
    return existing && !isExpiredOrNearExpiry(existing) ? existing : null;
  }

  try {
    const json = await cognitoRefreshWithRefreshToken({ region, clientId, refreshToken });
    const nextId = typeof json.id_token === 'string' ? json.id_token.trim() : '';
    const nextAccess = typeof json.access_token === 'string' ? json.access_token.trim() : '';
    if (nextId) {
      localStorage.setItem(ID_TOKEN_STORAGE_KEY, nextId);
    }
    if (nextAccess) {
      localStorage.setItem(ACCESS_TOKEN_KEY, nextAccess);
    }
    const nextRefresh =
      typeof json.refresh_token === 'string' ? json.refresh_token.trim() : refreshToken;
    if (nextRefresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh);
    }
    if (nextId && !isExpiredOrNearExpiry(nextId)) {
      return nextId;
    }
  } catch {
    /* fall through */
  }

  return existing && !isExpiredOrNearExpiry(existing) ? existing : null;
}
