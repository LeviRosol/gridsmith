/** Keys aligned with `AuthContext` Cognito localStorage. */

const ID_TOKEN_KEY = 'gridsmith.cognito.idToken';

export function getStoredCognitoIdToken(): string | null {
  try {
    return localStorage.getItem(ID_TOKEN_KEY);
  } catch {
    return null;
  }
}
