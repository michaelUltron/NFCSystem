import { supabase } from "./supabase";

export async function getCurrentAccountSettings() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, username, theme")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;

  return {
    user,
    profile,
  };
}

export async function updateMyTheme(theme: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      theme,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id, email, full_name, username, theme")
    .single();

  if (error) throw error;
  return data;
}

export async function updateMyPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}