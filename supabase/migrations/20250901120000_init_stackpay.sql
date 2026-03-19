create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.merchant_profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  display_name text not null default '',
  company_name text not null default '',
  email text not null default '',
  slug text unique,
  settlement_wallet text,
  webhook_url text,
  default_currency text not null default 'sBTC',
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.merchant_wallets (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  wallet_address text not null unique,
  network text not null default 'testnet',
  label text not null default 'Primary wallet',
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wallet_challenges (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce text not null unique,
  network text not null default 'testnet',
  statement text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  onchain_invoice_id text not null unique,
  tx_id text not null,
  status text not null check (status in ('pending', 'paid', 'expired')) default 'pending',
  amount numeric(30, 8) not null,
  currency text not null,
  description text not null default '',
  customer_name text not null default '',
  customer_email text not null default '',
  recipient_address text not null,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  link_key text not null unique,
  onchain_link_id text,
  tx_id text,
  kind text not null check (kind in ('invoice', 'multipay', 'subscription')),
  slug text not null unique,
  title text not null,
  description text not null default '',
  linked_invoice_id uuid references public.invoices(id) on delete set null,
  linked_subscription_plan_id uuid,
  default_currency text,
  accepted_currencies jsonb not null default '[]'::jsonb,
  default_amount numeric(30, 8),
  amount_step numeric(30, 8),
  allow_custom_amount boolean not null default false,
  is_universal boolean not null default false,
  is_active boolean not null default true,
  draft_contract_call jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  plan_key text not null unique,
  onchain_plan_id text,
  tx_id text,
  name text not null,
  description text not null default '',
  amount numeric(30, 8) not null,
  currency text not null,
  interval_label text not null,
  interval_seconds integer not null,
  status text not null check (status in ('draft', 'active', 'archived')) default 'draft',
  draft_contract_call jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  subscription_key text not null unique,
  onchain_subscription_id text,
  tx_id text,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_wallet_address text,
  seats integer not null default 1,
  status text not null check (status in ('draft', 'active', 'paused', 'canceled')) default 'draft',
  next_billing_at timestamptz,
  last_invoice_id uuid references public.invoices(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  receipt_key text not null unique,
  onchain_receipt_id text,
  tx_id text not null,
  payer_wallet_address text,
  amount numeric(30, 8) not null,
  currency text not null,
  paid_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  url text not null,
  signing_secret text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  endpoint_id uuid references public.webhook_endpoints(id) on delete set null,
  event text not null,
  status text not null check (status in ('pending', 'delivered', 'failed')),
  target_url text not null,
  request_body jsonb not null default '{}'::jsonb,
  response_code integer,
  attempted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  event_type text not null,
  tx_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chain_sync_state (
  id bigint primary key generated always as identity,
  cursor_kind text not null unique,
  cursor_value text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.merchant_profiles enable row level security;
alter table public.merchant_wallets enable row level security;
alter table public.wallet_challenges enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_links enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.receipts enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.activity_events enable row level security;
alter table public.chain_sync_state enable row level security;

create policy "service role full access merchant_profiles"
on public.merchant_profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access merchant_wallets"
on public.merchant_wallets
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access wallet_challenges"
on public.wallet_challenges
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access invoices"
on public.invoices
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access payment_links"
on public.payment_links
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access subscription_plans"
on public.subscription_plans
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access subscriptions"
on public.subscriptions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access receipts"
on public.receipts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access webhook_endpoints"
on public.webhook_endpoints
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access webhook_deliveries"
on public.webhook_deliveries
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access activity_events"
on public.activity_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access chain_sync_state"
on public.chain_sync_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create trigger set_updated_at_merchant_profiles
before update on public.merchant_profiles
for each row execute procedure public.set_updated_at();

create trigger set_updated_at_merchant_wallets
before update on public.merchant_wallets
for each row execute procedure public.set_updated_at();

create trigger set_updated_at_payment_links
before update on public.payment_links
for each row execute procedure public.set_updated_at();

create trigger set_updated_at_subscription_plans
before update on public.subscription_plans
for each row execute procedure public.set_updated_at();

create trigger set_updated_at_subscriptions
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

create trigger set_updated_at_webhook_endpoints
before update on public.webhook_endpoints
for each row execute procedure public.set_updated_at();

create index if not exists idx_merchant_profiles_wallet_address on public.merchant_profiles (wallet_address);
create index if not exists idx_merchant_profiles_slug on public.merchant_profiles (slug);
create index if not exists idx_invoices_merchant_created_at on public.invoices (merchant_id, created_at desc);
create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_payment_links_merchant_created_at on public.payment_links (merchant_id, created_at desc);
create index if not exists idx_payment_links_slug on public.payment_links (slug);
create index if not exists idx_receipts_invoice_id on public.receipts (invoice_id);
create index if not exists idx_subscriptions_merchant_created_at on public.subscriptions (merchant_id, created_at desc);
create index if not exists idx_activity_events_merchant_created_at on public.activity_events (merchant_id, created_at desc);
