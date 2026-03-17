import type { VercelRequest, VercelResponse } from "@vercel/node";

const APP_URL = process.env.VITE_APP_URL || "https://www.sabicard.app";
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

type PlanKey = "pro" | "business";

const PLAN_CONFIG: Record<
  PlanKey,
  { name: string; amount: number; description: string }
> = {
  pro: {
    name: "SabiCard Pro",
    amount: 1000, // PHP 12.00 if centavos, adjust to your actual price
    description: "Pro monthly access for SabiCard",
  },
  business: {
    name: "SabiCard Business",
    amount: 999900, // PHP 49.00 if centavos, adjust to your actual price
    description: "Business monthly access for SabiCard",
  },
};

function basicAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
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

    if (!plan || !(plan in PLAN_CONFIG)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const selectedPlan = PLAN_CONFIG[plan];

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
              currency: "PHP",
              amount: selectedPlan.amount,
              name: selectedPlan.name,
              quantity: 1,
              description: selectedPlan.description,
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
      raw: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Unexpected error",
    });
  }
}