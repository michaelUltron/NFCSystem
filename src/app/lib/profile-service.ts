import { supabase } from "./supabase";

export type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  company: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  location_label: string | null;
  location_url: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  theme: string | null;
  organization_id: string | null;
  managed_by_organization: boolean | null;
  can_manage_billing: boolean | null;
};

export type SocialLinkRow = {
  id: string;
  user_id: string;
  platform: string;
  url: string;
};

export type PublicOrganizationBrandingRow = {
  organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_tagline: string | null;
};

const PROFILE_SELECT = `
  id,
  username,
  full_name,
  company,
  position,
  phone,
  email,
  website,
  location_label,
  location_url,
  bio,
  avatar_url,
  cover_photo_url,
  theme,
  organization_id,
  managed_by_organization,
  can_manage_billing
`;

export async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) return null;
  return user.id;
}

export async function getMyProfile() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function updateMyProfile(payload: Partial<ProfileRow>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be logged in.");

  const updatePayload: Partial<ProfileRow> & { updated_at: string } = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function getMySocialLinks() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("social_links")
    .select("id, user_id, platform, url")
    .eq("user_id", userId)
    .order("platform", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SocialLinkRow[];
}

export async function replaceMySocialLinks(
  links: Array<{ platform: string; url: string }>
) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be logged in.");

  const { error: deleteError } = await supabase
    .from("social_links")
    .delete()
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  const cleaned = links
    .map((link) => ({
      user_id: userId,
      platform: link.platform,
      url: link.url.trim(),
    }))
    .filter((link) => link.url.length > 0);

  if (cleaned.length === 0) {
    return [] as SocialLinkRow[];
  }

  const { data, error } = await supabase
    .from("social_links")
    .insert(cleaned)
    .select("id, user_id, platform, url");

  if (error) throw error;
  return (data ?? []) as SocialLinkRow[];
}

export async function getPublicProfileByUsername(username: string) {
  const cleanedUsername = username.trim();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("username", cleanedUsername)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Profile not found.");
  }

  return data as ProfileRow;
}

export async function getPublicSocialLinksByUserId(userId: string) {
  const { data, error } = await supabase
    .from("social_links")
    .select("id, user_id, platform, url")
    .eq("user_id", userId)
    .order("platform", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SocialLinkRow[];
}

export async function getPublicProfileBrandingByUserId(userId: string) {
  const { data, error } = await supabase.rpc("get_public_profile_branding", {
    p_user_id: userId,
  });

  if (error) throw error;

  if (Array.isArray(data)) {
    return (data[0] ?? null) as PublicOrganizationBrandingRow | null;
  }

  return (data ?? null) as PublicOrganizationBrandingRow | null;
}

export async function getMyOrganizationBranding() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return await getPublicProfileBrandingByUserId(userId);
}

export async function isMyProfileOrganizationManaged() {
  const profile = await getMyProfile();
  if (!profile) return false;

  return !!profile.organization_id && !!profile.managed_by_organization;
}
