import { supabase } from "./supabase";

export type AdminOrderRow = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  city: string | null;
  province_state: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  quantity: number | null;
  card_type: string | null;
  unit_price: number | null;
  subtotal: number | null;
  shipping_fee: number | null;
  total_amount: number | null;
  payment_status: string | null;
  order_status: string | null;
  paymongo_checkout_session_id: string | null;
  paymongo_payment_id: string | null;
  paid_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminCardCatalogRow = {
  id: string;
  card_type: string;
  name: string;
  price: number;
  paymongo_amount: number;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export async function adminListOrders() {
  const { data, error } = await supabase.rpc("admin_list_orders");
  if (error) throw error;
  return (data ?? []) as AdminOrderRow[];
}

export async function adminUpdateOrderStatus(
  orderId: string,
  orderStatus: string
) {
  const { data, error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_order_status: orderStatus,
  });

  if (error) throw error;
  return data;
}

export async function adminListCardCatalog() {
  const { data, error } = await supabase.rpc("admin_list_card_catalog");
  if (error) throw error;
  return (data ?? []) as AdminCardCatalogRow[];
}

export async function adminUpdateCardCatalog(payload: {
  card_type: string;
  name: string;
  price: number;
  paymongo_amount: number;
  is_active: boolean;
  sort_order: number;
}) {
  const { data, error } = await supabase.rpc("admin_update_card_catalog", {
    p_card_type: payload.card_type,
    p_name: payload.name,
    p_price: payload.price,
    p_paymongo_amount: payload.paymongo_amount,
    p_is_active: payload.is_active,
    p_sort_order: payload.sort_order,
  });

  if (error) throw error;
  return data;
}

export async function adminGetShippingFee() {
  const { data, error } = await supabase.rpc("admin_get_shipping_fee");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function adminUpdateShippingFee(shippingFee: number) {
  const { data, error } = await supabase.rpc("admin_update_shipping_fee", {
    p_shipping_fee: shippingFee,
  });

  if (error) throw error;
  return Number(data ?? 0);
}