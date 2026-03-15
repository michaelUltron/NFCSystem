import { supabase } from "./supabase";

export async function activateCard(cardUid: string) {
  const { data, error } = await supabase.rpc("activate_card", {
    p_card_uid: cardUid,
  });

  if (error) throw error;
  return data;
}

export async function getMyCards() {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}