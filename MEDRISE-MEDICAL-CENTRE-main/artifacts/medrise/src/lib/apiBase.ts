export function apiBase(): string {
  return (
    (import.meta.env.VITE_API_URL as string | undefined)
    ?? (import.meta.env.VITE_RENDER_URL as string | undefined)
    ?? ""
  );
}
