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
  bio: string | null;
  avatar_url: string | null;
  theme: string | null;
};

export type SocialLinkRow = {
  id: string;
  user_id: string;
  platform: string;
  url: string;
};

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
    .select(
      "id, username, full_name, company, position, phone, email, website, bio, avatar_url, theme"
    )
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function updateMyProfile(payload: Partial<ProfileRow>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select(
      "id, username, full_name, company, position, phone, email, website, bio, avatar_url, theme"
    )
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
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, company, position, phone, email, website, bio, avatar_url, theme"
    )
    .eq("username", username)
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function getPublicSocialLinksByUserId(userId: string) {
  const { data, error } = await supabase
    .from("social_links")
    .select("id, user_id, platform, url")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as SocialLinkRow[];
}