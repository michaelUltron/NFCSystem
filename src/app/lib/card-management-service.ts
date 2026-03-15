import { supabase } from "./supabase";

export async function setPrimaryCard(cardId: string) {
  const { data, error } = await supabase.rpc("set_primary_card", {
    p_card_id: cardId,
  });

  if (error) throw error;
  return data;
}

export async function blockMyCard(cardId: string, reason?: string) {
  const { data, error } = await supabase.rpc("block_my_card", {
    p_card_id: cardId,
    p_reason: reason ?? null,
  });

  if (error) throw error;
  return data;
}

export async function unblockMyCard(cardId: string) {
  const { data, error } = await supabase.rpc("unblock_my_card", {
    p_card_id: cardId,
  });

  if (error) throw error;
  return data;
}