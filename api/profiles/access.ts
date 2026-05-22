import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FREE_FEATURE_TRIAL_DAYS = 7;

type ProfileRow = {
  id: string;
  created_at: string | null;
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  created_at: string | null;
};

async function supabaseFetch(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase request failed.");
  }

  return response;
}

function addTrialDays(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + FREE_FEATURE_TRIAL_DAYS);
  return date.toISOString();
}

function buildAccess(subscription: SubscriptionRow | null, profile: ProfileRow | null) {
  const plan = subscription?.plan || "free";
  const isPaidPlan = plan === "pro" || plan === "business";
  const trialStart =
    subscription?.current_period_start ||
    subscription?.created_at ||
    profile?.created_at ||
    null;
  const trialEndsAt = isPaidPlan ? null : addTrialDays(trialStart);
  const trialEndsTime = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
  const trialActive = !isPaidPlan && trialEndsTime > Date.now();
  const trialEnded = !isPaidPlan && !!trialEndsAt && !trialActive;
  const trialDaysRemaining = trialActive
    ? Math.max(1, Math.ceil((trialEndsTime - Date.now()) / 86_400_000))
    : 0;
  const featureAccess = isPaidPlan || trialActive;

  return {
    plan,
    trialActive,
    trialEnded,
    trialEndsAt,
    trialDaysRemaining,
    canUseLeads: featureAccess,
    canUseThemes: featureAccess,
    canUseBranding: featureAccess,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = String(req.query.userId || "").trim();

    if (!userId) {
      return res.status(400).json({ error: "Missing user id." });
    }

    const encodedUserId = encodeURIComponent(userId);
    const [profileResponse, subscriptionResponse] = await Promise.all([
      supabaseFetch(
        `/rest/v1/profiles?id=eq.${encodedUserId}&select=id,created_at&limit=1`
      ),
      supabaseFetch(
        `/rest/v1/subscriptions?user_id=eq.${encodedUserId}&select=plan,status,current_period_start,created_at&order=created_at.desc&limit=1`
      ),
    ]);

    const profileRows = (await profileResponse.json()) as ProfileRow[];
    const subscriptionRows =
      (await subscriptionResponse.json()) as SubscriptionRow[];

    return res.status(200).json(
      buildAccess(subscriptionRows[0] ?? null, profileRows[0] ?? null)
    );
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Unable to load profile access.",
    });
  }
}
