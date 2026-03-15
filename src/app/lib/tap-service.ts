import { supabase } from "./supabase";

export type CardTapDestination = {
  card_uid: string;
  status: string | null;
  username: string | null;
};

export async function getCardTapDestination(cardUid: string) {
  const { data, error } = await supabase.rpc("get_card_tap_destination", {
    p_card_uid: cardUid,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error("Card not found.");
  }

  return row as CardTapDestination;
}