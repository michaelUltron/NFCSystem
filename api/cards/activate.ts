import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SupabaseUserResponse = {
  id?: string;
  email?: string;
};

async function supabaseFetch(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase request failed.");
  }

  return response;
}

async function getUserFromToken(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Invalid or expired session.");
  }

  const user = (await response.json()) as SupabaseUserResponse;

  if (!user.id) {
    throw new Error("Invalid or expired session.");
  }

  return user;
}

function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = getBearerToken(req);
    const cardUid = String(req.body?.cardUid || "").trim();

    if (!accessToken) {
      return res.status(401).json({ error: "Missing session token." });
    }

    if (!cardUid) {
      return res.status(400).json({ error: "Missing card UID." });
    }

    const user = await getUserFromToken(accessToken);

    const cardResponse = await supabaseFetch(
      `/rest/v1/cards?card_uid=eq.${encodeURIComponent(
        cardUid
      )}&select=id,card_uid,user_id,assigned_user_id,owned_by_user_id,organization_id,seller_id,status,card_type,activation_date,created_at,is_primary,blocked_at,blocked_reason&limit=1`
    );

    const cards = await cardResponse.json();
    const card = Array.isArray(cards) ? cards[0] : null;

    if (!card) {
      return res.status(404).json({ error: "Card not found." });
    }

    const status = String(card.status || "").toLowerCase();
    const ownerId = card.user_id || card.assigned_user_id || card.owned_by_user_id;

    if (["blocked", "disabled"].includes(status)) {
      return res.status(400).json({ error: "This card cannot be activated." });
    }

    if (card.organization_id && !ownerId) {
      return res
        .status(409)
        .json({ error: "This card belongs to a business inventory." });
    }

    if (ownerId && ownerId !== user.id) {
      return res
        .status(409)
        .json({ error: "This card is already assigned to another account." });
    }

    const updatePayload = {
      user_id: user.id,
      assigned_user_id: user.id,
      owned_by_user_id: user.id,
      status: "active",
      activation_date: card.activation_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updateResponse = await supabaseFetch(
      `/rest/v1/cards?id=eq.${encodeURIComponent(card.id)}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    const updatedRows = await updateResponse.json();
    const updatedCard = updatedRows?.[0] || null;

    if (card.seller_id) {
      await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          referred_by_seller_id: card.seller_id,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return res.status(200).json({
      card: updatedCard,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Activation failed.",
    });
  }
}
