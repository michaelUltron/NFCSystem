alter table public.profiles
  add column if not exists location_label text,
  add column if not exists location_url text;
