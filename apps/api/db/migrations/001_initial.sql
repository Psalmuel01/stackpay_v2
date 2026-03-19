create table if not exists merchants (
  id text primary key,
  slug text not null unique,
  business_name text not null,
  email text not null default '',
  settlement_wallet text,
  default_currency text not null,
  webhook_url text,
  api_key text not null,
  webhook_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoices (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  source_link_id text,
  source_plan_id text,
  invoice_type text not null,
  customer_name text not null default '',
  customer_email text not null default '',
  amount numeric(30, 8) not null,
  currency text not null,
  status text not null,
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  recipient_label text not null default '',
  hosted_path text not null,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payment_links (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  link_mode text not null,
  invoice_id text references invoices(id) on delete set null,
  plan_id text,
  default_currency text,
  accepted_currencies jsonb not null default '[]'::jsonb,
  default_amount numeric(30, 8),
  amount_step numeric(30, 8),
  is_universal boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_plans (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  name text not null,
  description text not null default '',
  amount numeric(30, 8) not null,
  currency text not null,
  interval_label text not null,
  interval_seconds integer not null,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  public_link_id text references payment_links(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  plan_id text not null references subscription_plans(id) on delete cascade,
  customer_name text not null default '',
  customer_email text not null default '',
  seats integer not null default 1,
  status text not null,
  next_billing_at timestamptz not null,
  last_invoice_id text references invoices(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists receipts (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  invoice_id text not null references invoices(id) on delete cascade,
  amount numeric(30, 8) not null,
  currency text not null,
  payer_label text not null default '',
  tx_id text not null,
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists settlement_policies (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  name text not null,
  destination text not null,
  currency text not null,
  trigger_kind text not null,
  threshold numeric(30, 8),
  cadence_hours integer,
  min_payout numeric(30, 8) not null,
  active boolean not null default true,
  next_settlement_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists settlement_runs (
  id text primary key,
  policy_id text not null references settlement_policies(id) on delete cascade,
  merchant_id text not null references merchants(id) on delete cascade,
  destination text not null,
  currency text not null,
  amount numeric(30, 8) not null,
  status text not null,
  tx_id text,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists webhook_deliveries (
  id text primary key,
  merchant_id text not null references merchants(id) on delete cascade,
  event text not null,
  target text not null,
  status text not null,
  summary text not null default '',
  attempted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_merchant_created_at on invoices (merchant_id, created_at desc);
create index if not exists idx_invoices_status on invoices (status);
create index if not exists idx_payment_links_merchant_created_at on payment_links (merchant_id, created_at desc);
create index if not exists idx_payment_links_mode on payment_links (link_mode);
create index if not exists idx_payment_links_slug on payment_links (slug);
create index if not exists idx_receipts_merchant_paid_at on receipts (merchant_id, paid_at desc);
create index if not exists idx_subscription_plans_merchant_created_at on subscription_plans (merchant_id, created_at desc);
create index if not exists idx_subscriptions_merchant_created_at on subscriptions (merchant_id, created_at desc);
create index if not exists idx_settlement_policies_merchant_created_at on settlement_policies (merchant_id, created_at desc);
create index if not exists idx_settlement_runs_merchant_created_at on settlement_runs (merchant_id, created_at desc);
create index if not exists idx_webhook_deliveries_merchant_attempted_at on webhook_deliveries (merchant_id, attempted_at desc);
