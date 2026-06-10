-- Default new profiles to the Signature card theme.
-- Run this in Supabase SQL editor after the existing schema is in place.

alter table public.profiles
  alter column theme set default 'signature';

update public.profiles
set
  theme = 'signature',
  updated_at = now()
where theme is null;
