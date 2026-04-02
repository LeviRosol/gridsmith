/**
 * Browser-side Cognito User Pool API calls using the OAuth access token.
 *
 * Pool setup (console or IaC):
 * - Add optional custom attribute `marketing_opt_in` (type String; values "true" / "false").
 * - App client: allow read + write for `custom:marketing_opt_in`.
 * - Optional: add `custom:marketing_opt_in` to ID token claims (or readable attributes) so it appears on the JWT.
 *
 * Hosted UI limitation: classic Hosted UI and Google federation do not show custom sign-up fields.
 * Default opt-in is enforced in-app (first session sync) and/or a Post confirmation Lambda.
 */

export const MARKETING_OPT_IN_ATTRIBUTE = 'custom:marketing_opt_in' as const;

export function parseMarketingOptInFromIdTokenPayload(payload: Record<string, unknown> | undefined): boolean {
  const v = payload?.[MARKETING_OPT_IN_ATTRIBUTE];
  if (v === 'false' || v === false) return false;
  return true;
}

export async function cognitoUpdateUserAttributes(
  region: string,
  accessToken: string,
  attributes: Array<{ Name: string; Value: string }>,
): Promise<void> {
  const url = `https://cognito-idp.${region}.amazonaws.com/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.UpdateUserAttributes',
    },
    body: JSON.stringify({
      AccessToken: accessToken,
      UserAttributes: attributes,
    }),
  });

  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(
      typeof json.message === 'string' ? json.message : `UpdateUserAttributes failed (${res.status})`,
    );
  }
  if (typeof json.__type === 'string' && json.__type.includes('Exception')) {
    throw new Error(typeof json.message === 'string' ? json.message : json.__type);
  }
}

/**
 * Refresh tokens via Cognito IDP (same host as UpdateUserAttributes).
 * Prefer this over the Hosted UI `oauth2/token` URL from the browser: that endpoint
 * uses a different domain (`*.amazoncognito.com`) and stricter CORS, and is easy to misconfigure.
 */
export async function cognitoRefreshWithRefreshToken(params: {
  region: string;
  clientId: string;
  refreshToken: string;
}): Promise<{ id_token?: string; access_token?: string; refresh_token?: string }> {
  const url = `https://cognito-idp.${params.region}.amazonaws.com/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: params.clientId,
      AuthParameters: {
        REFRESH_TOKEN: params.refreshToken,
      },
    }),
  });

  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // ignore
  }

  const authResult = json.AuthenticationResult as
    | { IdToken?: string; AccessToken?: string; RefreshToken?: string }
    | undefined;

  if (!res.ok || !authResult?.IdToken) {
    const msg =
      typeof json.message === 'string'
        ? json.message
        : typeof json.__type === 'string'
          ? json.__type
          : `InitiateAuth refresh failed (${res.status})`;
    throw new Error(msg);
  }

  return {
    id_token: authResult.IdToken,
    access_token: authResult.AccessToken,
    refresh_token: authResult.RefreshToken,
  };
}
