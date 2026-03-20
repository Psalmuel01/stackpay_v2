create table if not exists public.chainhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'hiro-chainhooks',
  delivery_key text not null unique,
  event_type text not null,
  phase text not null check (phase in ('apply', 'rollback')),
  tx_id text,
  receipt_id text,
  invoice_id text,
  merchant_principal text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  source_key text not null unique,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  level text not null default 'info' check (level in ('info', 'success', 'warning', 'error')),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_chainhook_events_created_at
on public.chainhook_events (created_at desc);

create index if not exists idx_notifications_merchant_created_at
on public.notifications (merchant_id, created_at desc);

create index if not exists idx_notifications_merchant_read_at
on public.notifications (merchant_id, read_at);

alter table public.chainhook_events enable row level security;
alter table public.notifications enable row level security;

create policy "service role full access chainhook_events"
on public.chainhook_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role full access notifications"
on public.notifications
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
