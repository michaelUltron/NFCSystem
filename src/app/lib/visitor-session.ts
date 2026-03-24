const VISITOR_ID_KEY = "sabicard_visitor_id";

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }

  return id;
}