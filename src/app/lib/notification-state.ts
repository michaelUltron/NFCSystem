const LEADS_LAST_SEEN_KEY = "sabicard_leads_last_seen_at";
const ADMIN_ORDERS_LAST_SEEN_KEY = "sabicard_admin_orders_last_seen_at";
const TAPS_LAST_SEEN_KEY = "sabicard_taps_last_seen_at";
const CARDS_LAST_SEEN_KEY = "sabicard_cards_last_seen_at";

export function getLeadsLastSeenAt() {
  return localStorage.getItem(LEADS_LAST_SEEN_KEY);
}

export function markLeadsSeen() {
  localStorage.setItem(LEADS_LAST_SEEN_KEY, new Date().toISOString());
}

export function getAdminOrdersLastSeenAt() {
  return localStorage.getItem(ADMIN_ORDERS_LAST_SEEN_KEY);
}

export function markAdminOrdersSeen() {
  localStorage.setItem(ADMIN_ORDERS_LAST_SEEN_KEY, new Date().toISOString());
}

export function getTapsLastSeenAt() {
  return localStorage.getItem(TAPS_LAST_SEEN_KEY);
}

export function markTapsSeen() {
  localStorage.setItem(TAPS_LAST_SEEN_KEY, new Date().toISOString());
}

export function getCardsLastSeenAt() {
  return localStorage.getItem(CARDS_LAST_SEEN_KEY);
}

export function markCardsSeen() {
  localStorage.setItem(CARDS_LAST_SEEN_KEY, new Date().toISOString());
}
