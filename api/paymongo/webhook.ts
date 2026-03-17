import type { VercelRequest, VercelResponse } from "@vercel/node";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function basicAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
}

async function updateUserPlan(userId: string, plan: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server env vars");
  }

  const existingResp = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&select=*`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const existing = await existingResp.json();

  const payload = {
    plan,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  };

  if (Array.isArray(existing) && existing.length > 0) {
    const rowId = existing[0].id;

    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${rowId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        ...payload,
      }),
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!PAYMONGO_SECRET_KEY) {
    return res.status(500).json({ error: "Missing PAYMONGO_SECRET_KEY" });
  }

  try {
    const event = req.body;

    // Start simple: inspect event payload from PayMongo dashboard/webhook tester
    const eventType =
      event?.data?.attributes?.type ||
      event?.data?.attributes?.event_type ||
      event?.data?.attributes?.livemode;

    const resource =
      event?.data?.attributes?.data ||
      event?.data?.attributes?.resource ||
      event?.data;

    const metadata =
      resource?.attributes?.metadata ||
      resource?.attributes?.line_items?.[0]?.metadata ||
      resource?.metadata ||
      {};

    const userId = metadata?.user_id;
    const plan = metadata?.plan;

    // If your webhook payload shape differs, log it and adjust after first live/test delivery.
    console.log("PayMongo webhook received:", JSON.stringify(event, null, 2));

    if (userId && plan) {
      await updateUserPlan(userId, plan);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: error.message || "Webhook processing failed",
    });
  }
}