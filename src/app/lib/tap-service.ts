import { supabase } from "./supabase";

export type CardTapDestination = {
  card_uid: string;
  status: string | null;
  username: string | null;
};

export function normalizeCardStatus(status: string | null | undefined) {
  const value = (status || "").trim().toLowerCase();

  if (["active", "activated", "assigned"].includes(value)) return "active";
  if (["inactive", "pending", "unassigned", "available"].includes(value)) {
    return "inactive";
  }
  if (value === "blocked") return "blocked";
  if (["disabled", "deactivated"].includes(value)) return "disabled";

  return value || null;
}

export async function getCardTapDestination(cardUid: string) {
  const cleanedUid = cardUid.trim();

  if (!cleanedUid) {
    throw new Error("Missing card UID.");
  }

  const { data, error } = await supabase.rpc("get_card_tap_destination", {
    p_card_uid: cleanedUid,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error("Card not found.");
  }

  const destination = row as CardTapDestination;

  return {
    ...destination,
    status: normalizeCardStatus(destination.status),
  };
}

/**
 * Builds the final public card URL while preserving the card UID.
 * Example:
 *   /card/jane-doe?uid=TC000123
 */
export function buildCardPublicPath(username: string, cardUid: string) {
  const cleanedUsername = username.trim();
  const cleanedUid = cardUid.trim();

  if (!cleanedUsername) {
    throw new Error("Missing username.");
  }

  if (!cleanedUid) {
    throw new Error("Missing card UID.");
  }

  return `/card/${cleanedUsername}?uid=${encodeURIComponent(cleanedUid)}`;
}
