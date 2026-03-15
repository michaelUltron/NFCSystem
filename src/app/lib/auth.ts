import { supabase } from "./supabase";

export const PENDING_CARD_UID_KEY = "pending_card_uid";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}

export function savePendingCardUid(cardUid: string) {
  localStorage.setItem(PENDING_CARD_UID_KEY, cardUid);
}

export function getPendingCardUid() {
  return localStorage.getItem(PENDING_CARD_UID_KEY);
}

export function clearPendingCardUid() {
  localStorage.removeItem(PENDING_CARD_UID_KEY);
}