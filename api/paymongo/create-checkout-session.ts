import type { VercelRequest, VercelResponse } from "@vercel/node";

const APP_URL = process.env.VITE_APP_URL || "https://www.sabicard.app";
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type PlanKey = "pro" | "business";

type PlanSetting = {
  id: string;
  plan: PlanKey;
  name: string;
  price: number;
  currency: string;
  paymongo_amount: number;
  is_active: boolean;
};

function basicAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
}

async function getPlanFromDB(plan: PlanKey): Promise<PlanSetting> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server env vars");
  }

  const url = `${SUPABASE_URL}/rest/v1/plan_settings?plan=eq.${encodeURIComponent(
    plan
  )}&select=id,plan,name,price,currency,paymongo_amount,is_active&limit=1`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch plan settings: ${text}`);
  }

  const data = (await response.json()) as PlanSetting[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Plan not found.");
  }

  return data[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!PAYMONGO_SECRET_KEY) {
    return res.status(500).json({ error: "Missing PAYMONGO_SECRET_KEY" });
  }

  try {
    const { plan, userId, email } = req.body as {
      plan?: PlanKey;
      userId?: string;
      email?: string;
    };

    if (!plan || !["pro", "business"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const planData = await getPlanFromDB(plan);

    if (!planData.is_active) {
      return res
        .status(400)
        .json({ error: "This plan is currently unavailable." });
    }

    if (!planData.paymongo_amount || planData.paymongo_amount <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid plan price configuration." });
    }

    const payload = {
      data: {
        attributes: {
          billing: email
            ? {
                email,
              }
            : undefined,
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: planData.currency || "PHP",
              amount: planData.paymongo_amount,
              name: planData.name,
              quantity: 1,
              description: `${planData.name} access for 30 days`,
            },
          ],
          payment_method_types: [
            "card",
            "gcash",
            "paymaya",
            "grab_pay",
            "billease",
            "dob",
            "dob_ubp",
            "qrph",
          ],
          success_url: `${APP_URL}/plans?payment=success&plan=${encodeURIComponent(
            plan
          )}&user_id=${encodeURIComponent(userId)}`,
          cancel_url: `${APP_URL}/plans?payment=cancelled`,
          metadata: {
            user_id: userId,
            plan,
            source: "sabicard_checkout",
          },
        },
      },
    };

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuthHeader(PAYMONGO_SECRET_KEY),
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to create checkout session",
        details: result,
      });
    }

    const checkoutUrl = result?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      return res.status(500).json({ error: "No checkout URL returned" });
    }

    return res.status(200).json({
      checkoutUrl,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Unexpected error",
    });
  }
}