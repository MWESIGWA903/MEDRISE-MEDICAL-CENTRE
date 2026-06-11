export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) {
    return "http://localhost:8080";
  }
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain;
  }
  const isLocal =
    domain.startsWith("localhost") || domain.match(/^192\.168\./) || domain.match(/^10\./) || domain.match(/^172\./);
  return isLocal ? `http://${domain}` : `https://${domain}`;
}
