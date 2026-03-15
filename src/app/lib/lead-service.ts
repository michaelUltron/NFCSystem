import { supabase } from "./supabase";

export type LeadRow = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  created_at: string | null;
};

export async function createLead(payload: {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}) {
  const { error } = await supabase
    .from("leads")
    .insert([
      {
        user_id: payload.user_id,
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone?.trim() || null,
        company: payload.company?.trim() || null,
        message: payload.message?.trim() || null,
      },
    ]);

  if (error) throw error;

  return { success: true };
}

export async function getMyLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("id, user_id, name, email, phone, company, message, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeadRow[];
}