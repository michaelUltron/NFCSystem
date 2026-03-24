import { supabase } from "./supabase";

function getSingle<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

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

export type BusinessCardRow = {
  id: string;
  card_uid: string;
  status: string;
  assigned_user_id: string | null;
  assigned_email: string | null;
  created_at: string | null;
};

export type BusinessMemberRow = {
  member_id: string;
  organization_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string | null;
};

export type BusinessInviteRow = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  assigned_card_id: string | null;
  assigned_card_uid: string | null;
  status: string;
  created_at: string | null;
};

export type PendingOrganizationInviteRow = {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  email: string;
  role: string;
  assigned_card_id: string | null;
  assigned_card_uid: string | null;
  status: string;
  created_at: string | null;
};

export async function getMyAccountManagementStatus() {
  const { data, error } = await supabase.rpc("get_my_account_management_status");
  if (error) throw error;
  return getSingle<AccountManagementStatus>(data);
}

export async function ensureMyBusinessOrganization() {
  const { data, error } = await supabase.rpc("ensure_my_business_organization");
  if (error) throw error;
  return getSingle<OrganizationBranding>(data);
}

export async function getMyBusinessOverview() {
  const { data, error } = await supabase.rpc("get_my_business_overview");
  if (error) throw error;
  return getSingle<BusinessOverviewRow>(data);
}

export async function getMyBusinessBranding() {
  const { data, error } = await supabase.rpc("get_my_business_branding");
  if (error) throw error;
  return getSingle<OrganizationBranding>(data);
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
  return getSingle<OrganizationBranding>(data);
}

export async function getMyBusinessCards() {
  const { data, error } = await supabase.rpc("get_my_business_cards");
  if (error) throw error;
  return (data ?? []) as BusinessCardRow[];
}

export async function getMyBusinessMembers() {
  const { data, error } = await supabase.rpc("get_my_business_members");
  if (error) throw error;
  return (data ?? []) as BusinessMemberRow[];
}

export async function getMyBusinessInvites() {
  const { data, error } = await supabase.rpc("get_my_business_invites");
  if (error) throw error;
  return (data ?? []) as BusinessInviteRow[];
}

export async function createMyBusinessInvite(payload: {
  email: string;
  role: string;
  assigned_card_id?: string | null;
}) {
  const { data, error } = await supabase.rpc("create_my_business_invite", {
    p_email: payload.email,
    p_role: payload.role,
    p_assigned_card_id: payload.assigned_card_id ?? null,
  });

  if (error) throw error;
  return getSingle<BusinessInviteRow>(data);
}

export async function cancelMyBusinessInvite(inviteId: string) {
  const { data, error } = await supabase.rpc("cancel_my_business_invite", {
    p_invite_id: inviteId,
  });

  if (error) throw error;
  return getSingle<BusinessInviteRow>(data);
}

export async function getMyPendingOrganizationInvites() {
  const { data, error } = await supabase.rpc(
    "get_my_pending_organization_invites"
  );

  if (error) throw error;
  return (data ?? []) as PendingOrganizationInviteRow[];
}

export async function acceptMyOrganizationInvite(inviteId: string) {
  const { data, error } = await supabase.rpc(
    "accept_my_organization_invite",
    {
      p_invite_id: inviteId,
    }
  );

  if (error) throw error;
  return data;
}

export async function declineMyOrganizationInvite(inviteId: string) {
  const { data, error } = await supabase.rpc(
    "decline_my_organization_invite",
    {
      p_invite_id: inviteId,
    }
  );

  if (error) throw error;
  return data;
}

export async function assignCardByEmail(cardId: string, email: string) {
  const { data, error } = await supabase.rpc("business_assign_card_by_email", {
    p_card_id: cardId,
    p_email: email,
  });

  if (error) throw error;
  return getSingle<BusinessCardRow>(data);
}

export async function unassignBusinessCard(cardId: string) {
  const { data, error } = await supabase.rpc("business_unassign_card", {
    p_card_id: cardId,
  });

  if (error) throw error;
  return getSingle<BusinessCardRow>(data);
}

export async function blockBusinessCard(cardId: string) {
  const { data, error } = await supabase.rpc("business_block_card", {
    p_card_id: cardId,
  });

  if (error) throw error;
  return getSingle<BusinessCardRow>(data);
}