import { supabase } from "./supabase";
import { buildTapUrl } from "./app-config";

export type AdminCardRow = {
  id: string;
  card_uid: string;
  user_id: string | null;
  status: string | null;
  card_type: string | null;
  activation_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_primary: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
};

export async function checkIsAdmin() {
  const { data, error } = await supabase.rpc("is_current_user_admin");

  if (error) throw error;
  return Boolean(data);
}

export async function adminCreateCard(cardUid: string, cardType: string) {
  const { data, error } = await supabase.rpc("admin_create_card", {
    p_card_uid: cardUid.trim(),
    p_card_type: cardType.trim() || "standard",
  });

  if (error) throw error;
  return data as AdminCardRow;
}

export async function adminListCards() {
  const { data, error } = await supabase.rpc("admin_list_cards");

  if (error) throw error;
  return (data ?? []) as AdminCardRow[];
}

export function generateCardUid() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SC${random}`;
}

export function getTapUrl(cardUid: string) {
  return buildTapUrl(cardUid);
}