const PENDING_CARD_UID_KEY = "pending_card_uid";

export function savePendingCardUid(uid: string) {
  localStorage.setItem(PENDING_CARD_UID_KEY, uid);
}

export function getPendingCardUid() {
  return localStorage.getItem(PENDING_CARD_UID_KEY);
}

export function clearPendingCardUid() {
  localStorage.removeItem(PENDING_CARD_UID_KEY);
}