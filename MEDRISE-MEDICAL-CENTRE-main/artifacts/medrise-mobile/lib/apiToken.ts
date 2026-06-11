let _token: string | null = null;

export function setApiToken(token: string | null): void {
  _token = token;
}

export function getApiToken(): string | null {
  return _token;
}
