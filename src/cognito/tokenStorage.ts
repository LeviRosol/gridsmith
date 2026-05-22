/** Keys aligned with `AuthContext` Cognito localStorage. */

export const ID_TOKEN_STORAGE_KEY = 'gridsmith.cognito.idToken';

const ID_TOKEN_KEY = ID_TOKEN_STORAGE_KEY;

export function getStoredCognitoIdToken(): string | null {
  try {
    return localStorage.getItem(ID_TOKEN_KEY);
  } catch {
    return null;
  }
}
