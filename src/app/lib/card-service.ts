import { supabase } from "./supabase";

export type CardRow = {
  id: string;
  card_uid: string;
  user_id: string | null;
  status: string | null;
  card_type: string | null;
  activation_date: string | null;
  created_at: string | null;
  is_primary?: boolean;
  blocked_at?: string | null;
  blocked_reason?: string | null;
};

export async function activateCard(cardUid: string) {
  const { data, error } = await supabase.rpc("activate_card", {
    p_card_uid: cardUid,
  });

  if (error) throw error;
  return data as CardRow;
}

export async function getMyCards() {
  const { data, error } = await supabase
    .from("cards")
    .select(`
      id,
      card_uid,
      user_id,
      status,
      card_type,
      activation_date,
      created_at,
      is_primary,
      blocked_at,
      blocked_reason
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CardRow[];
}

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, email, company, position")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}