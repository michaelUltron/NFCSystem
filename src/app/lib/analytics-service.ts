import { supabase } from "./supabase";

export type CardTapRow = {
  id: string;
  card_id: string;
  device: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
  created_at: string | null;
};

export type AnalyticsRow = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  event_type: string | null;
  page_path: string | null;
  card_uid: string | null;
  visitor_identifier: string | null;
  created_at: string | null;
};

function detectDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "iPhone / iPad";
  if (/android/.test(ua)) return "Android";
  if (/windows/.test(ua)) return "Windows";
  if (/macintosh|mac os x/.test(ua)) return "Mac";
  if (/linux/.test(ua)) return "Linux";

  return "Unknown Device";
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (ua.includes("edg")) return "Edge";
  if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("firefox")) return "Firefox";

  return "Unknown Browser";
}

export function getVisitorIdentifier() {
  const key = "sabicard_visitor_id";
  let value = localStorage.getItem(key);

  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }

  return value;
}

export async function logCardTap(cardUid: string) {
  const userAgent = navigator.userAgent || "";
  const device = detectDevice(userAgent);
  const browser = detectBrowser(userAgent);
  const referrer = document.referrer || null;

  const { data, error } = await supabase.rpc("log_card_tap", {
    p_card_uid: cardUid,
    p_device: device,
    p_browser: browser,
    p_referrer: referrer,
  });

  if (error) throw error;
  return data;
}

export async function logProfileView(cardUid: string) {
  const visitorIdentifier = getVisitorIdentifier();

  const { data, error } = await supabase.rpc("log_profile_view", {
    p_card_uid: cardUid,
    p_page_path: window.location.pathname + window.location.search,
    p_visitor_identifier: visitorIdentifier,
  });

  if (error) throw error;
  return data as AnalyticsRow;
}

export async function logQrView(cardUid: string) {
  const visitorIdentifier = getVisitorIdentifier();

  const { data, error } = await supabase.rpc("log_qr_view", {
    p_card_uid: cardUid,
    p_page_path: window.location.pathname + window.location.search,
    p_visitor_identifier: visitorIdentifier,
  });

  if (error) throw error;
  return data as AnalyticsRow;
}

export async function getMyTapHistory() {
  const { data, error } = await supabase
    .from("card_taps")
    .select(`
      id,
      card_id,
      device,
      browser,
      country,
      city,
      referrer,
      created_at,
      cards!inner (
        card_uid,
        user_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMyTapCount() {
  const history = await getMyTapHistory();
  return history.length;
}