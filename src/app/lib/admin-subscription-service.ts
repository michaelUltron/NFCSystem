import { supabase } from "./supabase";

export type AdminUserSubscriptionRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  is_admin: boolean | null;
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
};

export async function adminListUserSubscriptions() {
  const { data, error } = await supabase.rpc("admin_list_user_subscriptions");

  if (error) throw error;
  return (data ?? []) as AdminUserSubscriptionRow[];
}

export async function adminUpdateUserSubscription(
  userId: string,
  plan: "free" | "pro" | "business",
  status: "active" | "inactive" | "cancelled" = "active"
) {
  const { data, error } = await supabase.rpc("admin_update_user_subscription", {
    p_user_id: userId,
    p_plan: plan,
    p_status: status,
  });

  if (error) throw error;
  return data;
}