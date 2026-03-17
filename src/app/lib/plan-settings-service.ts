import { supabase } from "./supabase";

export type PlanSetting = {
  id: string;
  plan: string;
  name: string;
  price: number;
  paymongo_amount: number;
  is_active: boolean;
};

export async function getPlanSettings() {
  const { data, error } = await supabase
    .from("plan_settings")
    .select("*")
    .order("price");

  if (error) throw error;

  return data as PlanSetting[];
}