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

export type TrialFeatureAccess = {
  plan: string;
  trialActive: boolean;
  trialEnded: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  canUseLeads: boolean;
  canUseAnalytics: boolean;
  canUseThemes: boolean;
  canUseBranding: boolean;
};

export const FREE_FEATURE_TRIAL_DAYS = 7;

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

export async function getPublicProfileFeatureAccess(userId: string) {
  const response = await fetch(
    `/api/profiles/access?userId=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Unable to load feature access.");
  }

  return (await response.json()) as TrialFeatureAccess;
}

export function isProLikePlan(plan?: string | null) {
  return plan === "pro" || plan === "business";
}

function getTrialStart(subscription?: SubscriptionRow | null) {
  return (
    subscription?.current_period_start ||
    subscription?.created_at ||
    null
  );
}

export function getFreeTrialEndsAt(subscription?: SubscriptionRow | null) {
  const trialStart = getTrialStart(subscription);
  if (!trialStart) return null;

  const date = new Date(trialStart);
  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + FREE_FEATURE_TRIAL_DAYS);
  return date.toISOString();
}

export function getTrialFeatureAccess(
  subscription?: SubscriptionRow | null
): TrialFeatureAccess {
  const plan = subscription?.plan || "free";
  const paidAccess = isProLikePlan(plan);
  const trialEndsAt = paidAccess ? null : getFreeTrialEndsAt(subscription);
  const trialEndsTime = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
  const trialActive = !paidAccess && trialEndsTime > Date.now();
  const trialEnded = !paidAccess && !!trialEndsAt && !trialActive;
  const trialDaysRemaining = trialActive
    ? Math.max(1, Math.ceil((trialEndsTime - Date.now()) / 86_400_000))
    : 0;
  const featureAccess = paidAccess || trialActive;

  return {
    plan,
    trialActive,
    trialEnded,
    trialEndsAt,
    trialDaysRemaining,
    canUseLeads: featureAccess,
    canUseAnalytics: featureAccess,
    canUseThemes: featureAccess,
    canUseBranding: featureAccess,
  };
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
