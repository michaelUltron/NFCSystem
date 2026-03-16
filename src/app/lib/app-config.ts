export const APP_URL =
  import.meta.env.VITE_APP_URL || window.location.origin;

export function buildPublicCardUrl(username: string) {
  return `${APP_URL}/card/${encodeURIComponent(username)}`;
}

export function buildTapUrl(cardUid: string) {
  return `${APP_URL}/tap?uid=${encodeURIComponent(cardUid)}`;
}

export function buildActivationUrl(cardUid: string) {
  return `${APP_URL}/activate?uid=${encodeURIComponent(cardUid)}`;
}