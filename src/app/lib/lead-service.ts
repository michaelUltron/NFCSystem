import { supabase } from "./supabase";

export type LeadRow = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  created_at: string | null;
};


// ✅ NEW — create lead from card UID (supports business)
export async function createLeadFromCard(payload: {
  card_uid: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}) {
  const { data, error } = await supabase.rpc(
    "create_public_lead_for_card",
    {
      p_card_uid: payload.card_uid,
      p_name: payload.name,
      p_email: payload.email,
      p_phone: payload.phone ?? null,
      p_company: payload.company ?? null,
      p_message: payload.message ?? null,
    }
  );

  if (error) throw error;

  return data;
}


// keep for old usage (optional)
export async function getMyLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, user_id, organization_id, name, email, phone, company, message, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}


export async function getMyLeadCount() {
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}