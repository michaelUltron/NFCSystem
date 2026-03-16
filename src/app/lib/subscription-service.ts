import { supabase } from "./supabase";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string | null;
};

export async function getMySubscription() {
  const { data, error } = await supabase.rpc("get_my_subscription");

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as SubscriptionRow | null;
}

export async function changeMySubscriptionPlan(
  plan: "free" | "pro" | "business"
) {
  const { data, error } = await supabase.rpc("change_my_subscription_plan", {
    p_plan: plan,
  });

  if (error) throw error;
  return data;
}

export function isProLikePlan(plan?: string | null) {
  return plan === "pro" || plan === "business";
}

export function canUseLeads(plan?: string | null) {
  return isProLikePlan(plan);
}

export function canUseAnalytics(plan?: string | null) {
  return isProLikePlan(plan);
}

export function canUseThemes(plan?: string | null) {
  return isProLikePlan(plan);
}

export function getPlanCardLimit(plan?: string | null) {
  if (plan === "free" || !plan) return 1;
  return null;
}

export function getPlanLabel(plan?: string | null) {
  if (!plan) return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}