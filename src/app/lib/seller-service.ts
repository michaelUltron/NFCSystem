import { supabase } from "./supabase";

function getSingle<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] ?? null : data;
}

export type SellerDashboardRow = {
  seller_id: string;
  business_name: string;
  status: string;
  credit_balance: number;
  total_cards: number;
  unactivated_cards: number;
  activated_cards: number;
};

export type SellerCardRow = {
  id: string;
  card_uid: string;
  status: string | null;
  card_type: string | null;
  user_id: string | null;
  owner_full_name: string | null;
  owner_email: string | null;
  activation_date: string | null;
  created_at: string | null;
};

export async function checkIsSeller() {
  const { data, error } = await supabase.rpc("is_current_user_seller");
  if (error) throw error;
  return Boolean(data);
}

export async function getMySellerDashboard() {
  const { data, error } = await supabase.rpc("get_my_seller_dashboard");
  if (error) throw error;
  return getSingle<SellerDashboardRow>(data);
}

export async function getMySellerCards() {
  const { data, error } = await supabase.rpc("get_my_seller_cards");
  if (error) throw error;
  return (data ?? []) as SellerCardRow[];
}

export async function sellerRegisterCard(cardUid: string, cardType: string) {
  const { data, error } = await supabase.rpc("seller_register_card", {
    p_card_uid: cardUid.trim(),
    p_card_type: cardType.trim() || "standard",
  });

  if (error) throw error;
  return getSingle<SellerCardRow>(data);
}

export type AdminSellerRow = {
  seller_id: string;
  user_id: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  credit_balance: number;
  total_cards: number;
  activated_cards: number;
  created_at: string | null;
};

export async function adminListSellers() {
  const { data, error } = await supabase.rpc("admin_list_sellers");
  if (error) throw error;
  return (data ?? []) as AdminSellerRow[];
}

export async function adminUpsertSeller(payload: {
  userId: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
}) {
  const { data, error } = await supabase.rpc("admin_upsert_seller", {
    p_user_id: payload.userId,
    p_business_name: payload.businessName,
    p_contact_email: payload.contactEmail || null,
    p_contact_phone: payload.contactPhone || null,
    p_status: payload.status,
  });

  if (error) throw error;
  return getSingle<any>(data);
}

export async function adminAdjustSellerCredits(
  sellerId: string,
  delta: number,
  reason: string
) {
  const { data, error } = await supabase.rpc("admin_adjust_seller_credits", {
    p_seller_id: sellerId,
    p_delta: delta,
    p_reason: reason || "admin_adjustment",
  });

  if (error) throw error;
  return Number(data ?? 0);
}
