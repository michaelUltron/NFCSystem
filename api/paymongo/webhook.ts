import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  if (!existingResp.ok) {
    const txt = await existingResp.text();
    throw new Error(`Failed to read existing subscription: ${txt}`);
  }

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

    const updateResp = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${rowId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!updateResp.ok) {
      const txt = await updateResp.text();
      throw new Error(`Failed to update subscription: ${txt}`);
    }
  } else {
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
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

    if (!insertResp.ok) {
      const txt = await insertResp.text();
      throw new Error(`Failed to insert subscription: ${txt}`);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    console.log("=== PAYMONGO WEBHOOK RECEIVED ===");
    console.log(JSON.stringify(event, null, 2));

    // Try multiple likely metadata locations
    const metadata =
      event?.data?.attributes?.data?.attributes?.metadata ||
      event?.data?.attributes?.resource?.attributes?.metadata ||
      event?.data?.attributes?.metadata ||
      event?.data?.attributes?.data?.metadata ||
      event?.data?.metadata ||
      {};

    const userId = metadata?.user_id;
    const plan = metadata?.plan;

    console.log("Extracted metadata:", metadata);
    console.log("Extracted userId:", userId);
    console.log("Extracted plan:", plan);

    if (userId && plan) {
      await updateUserPlan(userId, plan);
      console.log(`Subscription updated for ${userId} -> ${plan}`);
    } else {
      console.log("No user_id or plan found in webhook metadata.");
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: error.message || "Webhook processing failed",
    });
  }
}