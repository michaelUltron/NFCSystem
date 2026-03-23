import { supabase } from "./supabase";

export type AccountManagementStatus = {
  user_id: string;
  organization_id: string | null;
  managed_by_organization: boolean;
  can_manage_billing: boolean;
  is_business_owner: boolean;
};

export type BusinessOverviewRow = {
  organization_id: string;
  organization_name: string;
  logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_tagline: string | null;
  total_members: number;
  total_cards: number;
  active_cards: number;
  assigned_cards: number;
};

export type OrganizationBranding = {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_tagline: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export async function getMyAccountManagementStatus() {
  const { data, error } = await supabase.rpc(
    "get_my_account_management_status"
  );

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as AccountManagementStatus | null;
}

export async function ensureMyBusinessOrganization() {
  const { data, error } = await supabase.rpc("ensure_my_business_organization");

  if (error) throw error;
  return data as OrganizationBranding;
}

export async function getMyBusinessOverview() {
  const { data, error } = await supabase.rpc("get_my_business_overview");

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as BusinessOverviewRow | null;
}

export async function getMyBusinessBranding() {
  const { data, error } = await supabase.rpc("get_my_business_branding");

  if (error) throw error;
  return data as OrganizationBranding;
}

export async function updateMyBusinessBranding(payload: {
  name: string;
  logo_url: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_tagline: string;
}) {
  const { data, error } = await supabase.rpc("update_my_business_branding", {
    p_name: payload.name,
    p_logo_url: payload.logo_url,
    p_brand_primary_color: payload.brand_primary_color,
    p_brand_secondary_color: payload.brand_secondary_color,
    p_brand_tagline: payload.brand_tagline,
  });

  if (error) throw error;
  return data as OrganizationBranding;
}