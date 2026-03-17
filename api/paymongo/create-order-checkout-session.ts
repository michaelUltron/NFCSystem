import type { VercelRequest, VercelResponse } from "@vercel/node";

const APP_URL = process.env.VITE_APP_URL || "https://www.sabicard.app";
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function basicAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response;
}

async function getCardCatalog(cardType: string) {
  const response = await supabaseFetch(
    `/rest/v1/card_catalog?card_type=eq.${encodeURIComponent(
      cardType
    )}&select=*&limit=1`
  );

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Card type not found.");
  }

  return data[0];
}

async function getShippingFee() {
  const response = await supabaseFetch(
    `/rest/v1/app_settings?key=eq.card_shipping_fee&select=value_numeric&limit=1`
  );

  const data = await response.json();
  return Number(data?.[0]?.value_numeric ?? 120);
}

async function createOrder(order: any) {
  const resp = await supabaseFetch(`/rest/v1/orders`, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(order),
  });

  const data = await resp.json();
  return data[0];
}

async function updateOrderCheckout(orderId: string, checkoutSessionId: string) {
  await supabaseFetch(
    `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        paymongo_checkout_session_id: checkoutSessionId,
        payment_status: "awaiting_payment",
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!PAYMONGO_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing server environment variables" });
  }

  try {
    const {
      userId,
      customerName,
      email,
      phone,
      cardType,
      quantity,
      address1,
      address2,
      city,
      province,
      postalCode,
      country,
      notes,
    } = req.body as any;

    if (!customerName || !email || !phone || !address1 || !city || !province || !postalCode) {
      return res.status(400).json({ error: "Missing required customer fields" });
    }

    const selectedCard = await getCardCatalog(cardType);

    if (!selectedCard.is_active) {
      return res.status(400).json({ error: "This card type is currently unavailable." });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = Number(selectedCard.paymongo_amount);
    const shippingFee = Math.round((await getShippingFee()) * 100);
    const subtotal = unitPrice * qty;
    const totalAmount = subtotal + shippingFee;

    const createdOrder = await createOrder({
      user_id: userId || null,
      customer_name: customerName,
      email,
      phone,
      shipping_address_line1: address1,
      shipping_address_line2: address2 || null,
      city,
      province_state: province,
      postal_code: postalCode,
      country: country || "Philippines",
      notes: notes || null,
      quantity: qty,
      card_type: cardType,
      unit_price: unitPrice / 100,
      subtotal: subtotal / 100,
      shipping_fee: shippingFee / 100,
      total_amount: totalAmount / 100,
      status: "pending",
      payment_status: "pending",
      order_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const payload = {
      data: {
        attributes: {
          billing: {
            name: customerName,
            email,
            phone,
            address: {
              line1: address1,
              line2: address2 || "",
              city,
              state: province,
              postal_code: postalCode,
              country: country || "PH",
            },
          },
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: unitPrice,
              name: selectedCard.name,
              quantity: qty,
              description: `Physical ${selectedCard.name} NFC card order`,
            },
            {
              currency: "PHP",
              amount: shippingFee,
              name: "Shipping Fee",
              quantity: 1,
              description: "Shipping and handling",
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
          success_url: `${APP_URL}/order?payment=success&order_id=${encodeURIComponent(
            createdOrder.id
          )}`,
          cancel_url: `${APP_URL}/order?payment=cancelled`,
          metadata: {
            source: "sabicard_order",
            order_id: createdOrder.id,
            user_id: userId || "",
            card_type: cardType,
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
    const checkoutSessionId = result?.data?.id;

    if (!checkoutUrl || !checkoutSessionId) {
      return res.status(500).json({ error: "No checkout session returned" });
    }

    await updateOrderCheckout(createdOrder.id, checkoutSessionId);

    return res.status(200).json({
      checkoutUrl,
      orderId: createdOrder.id,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Unexpected error",
    });
  }
}