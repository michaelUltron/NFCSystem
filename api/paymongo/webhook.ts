import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function updateUserPlan(userId: string, plan: string) {
  const existingResp = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&select=*`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const existing = await existingResp.json();

  const payload = {
    plan,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (Array.isArray(existing) && existing.length > 0) {
    const rowId = existing[0].id;

    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${rowId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
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
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
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

async function markOrderPaid(orderId: string, paymentId: string) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        payment_status: "paid",
        order_status: "paid",
        status: "paid",
        paymongo_payment_id: paymentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to update order: ${txt}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase server env vars" });
  }

  try {
    const event = req.body;

    console.log("=== PAYMONGO WEBHOOK RECEIVED ===");
    console.log(JSON.stringify(event, null, 2));

    const metadata =
      event?.data?.attributes?.data?.attributes?.metadata ||
      event?.data?.attributes?.resource?.attributes?.metadata ||
      event?.data?.attributes?.metadata ||
      event?.data?.attributes?.data?.metadata ||
      event?.data?.metadata ||
      {};

    const paymentId =
      event?.data?.attributes?.data?.id ||
      event?.data?.id ||
      null;

    const source = metadata?.source;

    console.log("Extracted metadata:", metadata);

    if (source === "sabicard_checkout") {
      const userId = metadata?.user_id;
      const plan = metadata?.plan;

      if (userId && plan) {
        await updateUserPlan(userId, plan);
        console.log(`Subscription updated for ${userId} -> ${plan}`);
      }
    }

    if (source === "sabicard_order") {
      const orderId = metadata?.order_id;

      if (orderId) {
        await markOrderPaid(orderId, paymentId || "");
        console.log(`Order marked paid: ${orderId}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: error.message || "Webhook processing failed",
    });
  }
}