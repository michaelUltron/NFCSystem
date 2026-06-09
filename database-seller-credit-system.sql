-- Seller credit MVP
-- Run this in Supabase SQL editor after the existing schema is in place.

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  contact_email text,
  contact_phone text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  delta integer not null,
  reason text not null,
  card_id uuid references public.cards(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.cards
  add column if not exists seller_id uuid references public.sellers(id) on delete set null;

alter table public.profiles
  add column if not exists referred_by_seller_id uuid references public.sellers(id) on delete set null;

create index if not exists idx_cards_seller_id on public.cards(seller_id);
create index if not exists idx_seller_credit_ledger_seller_id on public.seller_credit_ledger(seller_id);
create index if not exists idx_profiles_referred_by_seller_id on public.profiles(referred_by_seller_id);

alter table public.sellers enable row level security;
alter table public.seller_credit_ledger enable row level security;

create or replace function public.get_seller_credit_balance(p_seller_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::integer
  from public.seller_credit_ledger
  where seller_id = p_seller_id;
$$;

create or replace function public.is_current_user_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sellers
    where user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.get_my_seller_dashboard()
returns table (
  seller_id uuid,
  business_name text,
  status text,
  credit_balance integer,
  total_cards bigint,
  unactivated_cards bigint,
  activated_cards bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.business_name,
    s.status,
    public.get_seller_credit_balance(s.id),
    count(c.id) as total_cards,
    count(c.id) filter (where coalesce(c.status, '') <> 'active') as unactivated_cards,
    count(c.id) filter (where c.status = 'active') as activated_cards
  from public.sellers s
  left join public.cards c on c.seller_id = s.id
  where s.user_id = auth.uid()
  group by s.id, s.business_name, s.status;
$$;

create or replace function public.get_my_seller_cards()
returns table (
  id uuid,
  card_uid text,
  status text,
  card_type text,
  user_id uuid,
  owner_full_name text,
  owner_email text,
  activation_date timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.card_uid,
    c.status,
    c.card_type,
    c.user_id,
    p.full_name as owner_full_name,
    p.email as owner_email,
    c.activation_date,
    c.created_at
  from public.sellers s
  join public.cards c on c.seller_id = s.id
  left join public.profiles p on p.id = coalesce(c.user_id, c.assigned_user_id, c.owned_by_user_id)
  where s.user_id = auth.uid()
  order by c.created_at desc;
$$;

create or replace function public.seller_register_card(
  p_card_uid text,
  p_card_type text default 'standard'
)
returns table (
  id uuid,
  card_uid text,
  status text,
  card_type text,
  user_id uuid,
  owner_full_name text,
  owner_email text,
  activation_date timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller public.sellers%rowtype;
  v_balance integer;
  v_card_id uuid;
begin
  select *
  into v_seller
  from public.sellers
  where user_id = auth.uid();

  if v_seller.id is null then
    raise exception 'Seller account not found.';
  end if;

  if v_seller.status <> 'active' then
    raise exception 'Seller account is not active.';
  end if;

  v_balance := public.get_seller_credit_balance(v_seller.id);

  if v_balance < 1 then
    raise exception 'Not enough seller credits.';
  end if;

  if nullif(trim(p_card_uid), '') is null then
    raise exception 'Card UID is required.';
  end if;

  insert into public.cards (
    card_uid,
    status,
    card_type,
    seller_id,
    created_at,
    updated_at
  )
  values (
    trim(p_card_uid),
    'inactive',
    coalesce(nullif(trim(p_card_type), ''), 'standard'),
    v_seller.id,
    now(),
    now()
  )
  returning cards.id into v_card_id;

  insert into public.seller_credit_ledger (
    seller_id,
    delta,
    reason,
    card_id,
    created_by
  )
  values (
    v_seller.id,
    -1,
    'card_registered',
    v_card_id,
    auth.uid()
  );

  return query
    select *
    from public.get_my_seller_cards()
    where get_my_seller_cards.id = v_card_id;
end;
$$;

create or replace function public.admin_list_sellers()
returns table (
  seller_id uuid,
  user_id uuid,
  business_name text,
  contact_email text,
  contact_phone text,
  status text,
  credit_balance integer,
  total_cards bigint,
  activated_cards bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.user_id,
    s.business_name,
    s.contact_email,
    s.contact_phone,
    s.status,
    public.get_seller_credit_balance(s.id),
    count(c.id) as total_cards,
    count(c.id) filter (where c.status = 'active') as activated_cards,
    s.created_at
  from public.sellers s
  left join public.cards c on c.seller_id = s.id
  where public.is_current_user_admin()
  group by s.id;
$$;

create or replace function public.admin_upsert_seller(
  p_user_id uuid,
  p_business_name text,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_status text default 'active'
)
returns setof public.sellers
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  if p_status not in ('pending', 'active', 'suspended', 'rejected') then
    raise exception 'Invalid seller status.';
  end if;

  return query
    insert into public.sellers (
      user_id,
      business_name,
      contact_email,
      contact_phone,
      status,
      updated_at
    )
    values (
      p_user_id,
      trim(p_business_name),
      nullif(trim(coalesce(p_contact_email, '')), ''),
      nullif(trim(coalesce(p_contact_phone, '')), ''),
      p_status,
      now()
    )
    on conflict (user_id)
    do update set
      business_name = excluded.business_name,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      status = excluded.status,
      updated_at = now()
    returning *;
end;
$$;

create or replace function public.admin_adjust_seller_credits(
  p_seller_id uuid,
  p_delta integer,
  p_reason text default 'admin_adjustment'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  if p_delta = 0 then
    raise exception 'Credit adjustment cannot be zero.';
  end if;

  insert into public.seller_credit_ledger (
    seller_id,
    delta,
    reason,
    created_by
  )
  values (
    p_seller_id,
    p_delta,
    coalesce(nullif(trim(p_reason), ''), 'admin_adjustment'),
    auth.uid()
  );

  return public.get_seller_credit_balance(p_seller_id);
end;
$$;

-- Replace the existing activation function so seller-issued cards keep seller attribution.
create or replace function public.activate_card(p_card_uid text)
returns public.cards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.cards%rowtype;
  v_subscription_plan text;
  v_subscription_status text;
  v_is_business boolean;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'You must be logged in.';
  end if;

  select *
  into v_card
  from public.cards
  where card_uid = trim(p_card_uid)
  limit 1
  for update;

  if v_card.id is null then
    raise exception 'Card not found.';
  end if;

  if coalesce(v_card.status, '') in ('blocked', 'disabled') then
    raise exception 'This card cannot be activated.';
  end if;

  if coalesce(v_card.user_id, v_card.assigned_user_id, v_card.owned_by_user_id) is not null
    and coalesce(v_card.user_id, v_card.assigned_user_id, v_card.owned_by_user_id) <> v_user_id then
    raise exception 'This card is already assigned to another account.';
  end if;

  select plan, status
  into v_subscription_plan, v_subscription_status
  from public.subscriptions
  where user_id = v_user_id
  order by created_at desc
  limit 1;

  v_is_business :=
    lower(coalesce(v_subscription_plan, '')) = 'business'
    and lower(coalesce(v_subscription_status, '')) = 'active'
    and v_card.seller_id is null;

  if v_is_business then
    update public.cards
    set
      organization_id = (select organization_id from public.profiles where id = v_user_id),
      status = 'inactive',
      updated_at = now()
    where id = v_card.id
    returning * into v_card;
  else
    update public.cards
    set
      user_id = v_user_id,
      assigned_user_id = v_user_id,
      owned_by_user_id = v_user_id,
      status = 'active',
      activation_date = coalesce(activation_date, now()),
      updated_at = now()
    where id = v_card.id
    returning * into v_card;

    if v_card.seller_id is not null then
      update public.profiles
      set referred_by_seller_id = coalesce(referred_by_seller_id, v_card.seller_id)
      where id = v_user_id;
    end if;
  end if;

  return v_card;
end;
$$;

grant execute on function public.get_seller_credit_balance(uuid) to authenticated;
grant execute on function public.is_current_user_seller() to authenticated;
grant execute on function public.get_my_seller_dashboard() to authenticated;
grant execute on function public.get_my_seller_cards() to authenticated;
grant execute on function public.seller_register_card(text, text) to authenticated;
grant execute on function public.admin_list_sellers() to authenticated;
grant execute on function public.admin_upsert_seller(uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_adjust_seller_credits(uuid, integer, text) to authenticated;
