import { query, withTransaction } from "../db/client.js";
import { makeId, slugify } from "../lib/ids.js";

function mapMerchant(row) {
  return {
    id: row.id,
    slug: row.slug,
    businessName: row.business_name,
    email: row.email,
    settlementWallet: row.settlement_wallet,
    defaultCurrency: row.default_currency,
    webhookUrl: row.webhook_url,
    apiKey: row.api_key,
    webhookSecret: row.webhook_secret,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoice(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    sourceLinkId: row.source_link_id,
    sourcePlanId: row.source_plan_id,
    type: row.invoice_type,
    customer: row.customer_name,
    email: row.customer_email,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    description: row.description,
    metadata: row.metadata ?? {},
    recipientLabel: row.recipient_label,
    hostedPath: row.hosted_path,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

function mapPaymentLink(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    mode: row.link_mode,
    invoiceId: row.invoice_id,
    planId: row.plan_id,
    defaultCurrency: row.default_currency,
    acceptedCurrencies: row.accepted_currencies ?? [],
    defaultAmount: row.default_amount === null ? null : Number(row.default_amount),
    amountStep: row.amount_step === null ? null : Number(row.amount_step),
    isUniversal: row.is_universal,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubscriptionPlan(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    intervalLabel: row.interval_label,
    intervalSeconds: row.interval_seconds,
    status: row.status,
    metadata: row.metadata ?? {},
    publicLinkId: row.public_link_id,
    createdAt: row.created_at,
  };
}

function mapSubscription(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    planId: row.plan_id,
    customer: row.customer_name,
    email: row.customer_email,
    seats: row.seats,
    status: row.status,
    nextBillingAt: row.next_billing_at,
    lastInvoiceId: row.last_invoice_id,
    createdAt: row.created_at,
  };
}

function mapSettlementPolicy(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    destination: row.destination,
    currency: row.currency,
    triggerKind: row.trigger_kind,
    threshold: row.threshold === null ? null : Number(row.threshold),
    cadenceHours: row.cadence_hours,
    minPayout: Number(row.min_payout),
    active: row.active,
    nextSettlementAt: row.next_settlement_at,
    createdAt: row.created_at,
  };
}

function mapSettlementRun(row) {
  return {
    id: row.id,
    policyId: row.policy_id,
    merchantId: row.merchant_id,
    destination: row.destination,
    currency: row.currency,
    amount: Number(row.amount),
    status: row.status,
    txId: row.tx_id,
    executedAt: row.executed_at,
    createdAt: row.created_at,
  };
}

function mapWebhookDelivery(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    event: row.event,
    target: row.target,
    status: row.status,
    summary: row.summary,
    attemptedAt: row.attempted_at,
    createdAt: row.created_at,
  };
}

function mapReceipt(row) {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    invoiceId: row.invoice_id,
    amount: Number(row.amount),
    currency: row.currency,
    payerLabel: row.payer_label,
    txId: row.tx_id,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

async function findMerchantById(merchantId) {
  const result = await query("select * from merchants where id = $1 limit 1", [merchantId]);
  return result.rows[0] ? mapMerchant(result.rows[0]) : null;
}

async function findMerchantBySlug(slug) {
  const result = await query("select * from merchants where slug = $1 limit 1", [slug]);
  return result.rows[0] ? mapMerchant(result.rows[0]) : null;
}

export async function getMerchant(merchantId) {
  return findMerchantById(merchantId);
}

export async function getMerchantBySlug(slug) {
  return findMerchantBySlug(slug);
}

export async function listMerchants() {
  const result = await query("select * from merchants order by created_at desc");
  return result.rows.map(mapMerchant);
}

export async function createMerchant(input) {
  const merchant = {
    id: input.id ?? makeId("merch"),
    slug: slugify(input.slug || input.businessName || "merchant"),
    businessName: input.businessName ?? "Untitled merchant",
    email: input.email ?? "",
    settlementWallet: input.settlementWallet ?? null,
    defaultCurrency: input.defaultCurrency ?? "sBTC",
    webhookUrl: input.webhookUrl ?? null,
    apiKey: input.apiKey ?? makeId("sk_live"),
    webhookSecret: input.webhookSecret ?? makeId("whsec"),
  };

  const result = await query(
    `
      insert into merchants (
        id, slug, business_name, email, settlement_wallet, default_currency, webhook_url, api_key, webhook_secret
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning *
    `,
    [
      merchant.id,
      merchant.slug,
      merchant.businessName,
      merchant.email,
      merchant.settlementWallet,
      merchant.defaultCurrency,
      merchant.webhookUrl,
      merchant.apiKey,
      merchant.webhookSecret,
    ]
  );

  return mapMerchant(result.rows[0]);
}

export async function updateMerchant(merchantId, patch) {
  const current = await findMerchantById(merchantId);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...patch,
    slug: slugify(patch.slug ?? current.slug),
  };

  const result = await query(
    `
      update merchants
      set slug = $2,
          business_name = $3,
          email = $4,
          settlement_wallet = $5,
          default_currency = $6,
          webhook_url = $7,
          updated_at = now()
      where id = $1
      returning *
    `,
    [
      merchantId,
      next.slug,
      next.businessName,
      next.email,
      next.settlementWallet,
      next.defaultCurrency,
      next.webhookUrl,
    ]
  );

  return mapMerchant(result.rows[0]);
}

export async function listInvoices(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    clauses.push(`status = $${params.length}`);
  }

  const result = await query(
    `
      select * from invoices
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by created_at desc
    `,
    params
  );
  return result.rows.map(mapInvoice);
}

export async function getInvoice(invoiceId) {
  const result = await query("select * from invoices where id = $1 limit 1", [invoiceId]);
  return result.rows[0] ? mapInvoice(result.rows[0]) : null;
}

export async function createInvoice(input) {
  const invoice = {
    id: input.id ?? makeId("inv"),
    merchantId: input.merchantId,
    sourceLinkId: input.sourceLinkId ?? null,
    sourcePlanId: input.sourcePlanId ?? null,
    type: input.type ?? "standard",
    customer: input.customer ?? "",
    email: input.email ?? "",
    amount: String(input.amount ?? 0),
    currency: input.currency ?? "sBTC",
    status: input.status ?? "pending",
    description: input.description ?? "",
    metadata: input.metadata ?? {},
    recipientLabel: input.recipientLabel ?? "Main settlement wallet",
    hostedPath: input.hostedPath ?? null,
    expiresAt: input.expiresAt ?? null,
    paidAt: input.paidAt ?? null,
  };

  const result = await query(
    `
      insert into invoices (
        id, merchant_id, source_link_id, source_plan_id, invoice_type, customer_name, customer_email,
        amount, currency, status, description, metadata, recipient_label, hosted_path, expires_at, paid_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12::jsonb, $13, $14, $15, $16
      )
      returning *
    `,
    [
      invoice.id,
      invoice.merchantId,
      invoice.sourceLinkId,
      invoice.sourcePlanId,
      invoice.type,
      invoice.customer,
      invoice.email,
      invoice.amount,
      invoice.currency,
      invoice.status,
      invoice.description,
      JSON.stringify(invoice.metadata),
      invoice.recipientLabel,
      invoice.hostedPath || `/pay/${invoice.id}`,
      invoice.expiresAt,
      invoice.paidAt,
    ]
  );

  return mapInvoice(result.rows[0]);
}

export async function listPaymentLinks(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }

  if (filters.mode) {
    params.push(filters.mode);
    clauses.push(`link_mode = $${params.length}`);
  }

  const result = await query(
    `
      select * from payment_links
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by created_at desc
    `,
    params
  );
  return result.rows.map(mapPaymentLink);
}

export async function getPaymentLink(linkId) {
  const result = await query("select * from payment_links where id = $1 limit 1", [linkId]);
  return result.rows[0] ? mapPaymentLink(result.rows[0]) : null;
}

export async function getPaymentLinkBySlug(slug) {
  const result = await query("select * from payment_links where slug = $1 limit 1", [slug]);
  return result.rows[0] ? mapPaymentLink(result.rows[0]) : null;
}

export async function createPaymentLink(input) {
  const fallbackCurrency = input.defaultCurrency ?? input.currency ?? null;
  const link = {
    id: input.id ?? makeId("lnk"),
    merchantId: input.merchantId,
    slug: slugify(input.slug || input.title || "link"),
    title: input.title ?? "Untitled link",
    description: input.description ?? "",
    mode: input.mode ?? "multipay",
    invoiceId: input.invoiceId ?? null,
    planId: input.planId ?? null,
    defaultCurrency: fallbackCurrency,
    acceptedCurrencies: input.acceptedCurrencies ?? (fallbackCurrency ? [fallbackCurrency] : ["sBTC"]),
    defaultAmount: input.defaultAmount ?? null,
    amountStep: input.amountStep ?? null,
    isUniversal: Boolean(input.isUniversal),
    isActive: input.isActive ?? true,
  };

  const result = await query(
    `
      insert into payment_links (
        id, merchant_id, slug, title, description, link_mode, invoice_id, plan_id,
        default_currency, accepted_currencies, default_amount, amount_step, is_universal, is_active
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10::jsonb, $11, $12, $13, $14
      )
      returning *
    `,
    [
      link.id,
      link.merchantId,
      link.slug,
      link.title,
      link.description,
      link.mode,
      link.invoiceId,
      link.planId,
      link.defaultCurrency,
      JSON.stringify(link.acceptedCurrencies),
      link.defaultAmount,
      link.amountStep,
      link.isUniversal,
      link.isActive,
    ]
  );

  return mapPaymentLink(result.rows[0]);
}

export async function deactivatePaymentLink(linkId) {
  const result = await query(
    `
      update payment_links
      set is_active = false, updated_at = now()
      where id = $1
      returning *
    `,
    [linkId]
  );
  return result.rows[0] ? mapPaymentLink(result.rows[0]) : null;
}

export async function getUniversalQrLink(merchantId) {
  const result = await query(
    `
      select * from payment_links
      where merchant_id = $1 and is_universal = true
      order by updated_at desc, created_at desc
      limit 1
    `,
    [merchantId]
  );
  return result.rows[0] ? mapPaymentLink(result.rows[0]) : null;
}

export async function createOrReplaceUniversalQrLink(input) {
  return withTransaction(async (client) => {
    await client.query(
      `
        update payment_links
        set is_active = false, updated_at = now()
        where merchant_id = $1 and is_universal = true and is_active = true
      `,
      [input.merchantId]
    );

    const linkId = input.id ?? makeId("lnk");
    const slug = slugify(input.slug || `${input.slugBase || "merchant"}-qr`);
    const result = await client.query(
      `
        insert into payment_links (
          id, merchant_id, slug, title, description, link_mode, default_currency,
          accepted_currencies, default_amount, amount_step, is_universal, is_active
        ) values (
          $1, $2, $3, $4, $5, 'multipay', null,
          $6::jsonb, null, null, true, true
        )
        returning *
      `,
      [
        linkId,
        input.merchantId,
        slug,
        input.title ?? "Universal QR",
        input.description ?? "Permanent universal QR route for daily payments.",
        JSON.stringify(["sBTC", "STX", "USDCx"]),
      ]
    );

    return mapPaymentLink(result.rows[0]);
  });
}

export async function listSubscriptionPlans(filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }
  const result = await query(
    `
      select * from subscription_plans
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by created_at desc
    `,
    params
  );
  return result.rows.map(mapSubscriptionPlan);
}

export async function createSubscriptionPlan(input) {
  const plan = {
    id: input.id ?? makeId("pln"),
    merchantId: input.merchantId,
    name: input.name ?? "Untitled plan",
    description: input.description ?? "",
    amount: String(input.amount ?? 0),
    currency: input.currency ?? "USDCx",
    intervalLabel: input.intervalLabel ?? "Monthly",
    intervalSeconds: Number(input.intervalSeconds ?? 2_592_000),
    status: input.status ?? "active",
    metadata: input.metadata ?? {},
    publicLinkId: input.publicLinkId ?? null,
  };

  const result = await query(
    `
      insert into subscription_plans (
        id, merchant_id, name, description, amount, currency, interval_label, interval_seconds,
        status, metadata, public_link_id
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10::jsonb, $11
      )
      returning *
    `,
    [
      plan.id,
      plan.merchantId,
      plan.name,
      plan.description,
      plan.amount,
      plan.currency,
      plan.intervalLabel,
      plan.intervalSeconds,
      plan.status,
      JSON.stringify(plan.metadata),
      plan.publicLinkId,
    ]
  );

  return mapSubscriptionPlan(result.rows[0]);
}

export async function listSubscriptions(filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }
  const result = await query(
    `
      select * from subscriptions
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by created_at desc
    `,
    params
  );
  return result.rows.map(mapSubscription);
}

export async function createSubscription(input) {
  const subscription = {
    id: input.id ?? makeId("sub"),
    merchantId: input.merchantId,
    planId: input.planId,
    customer: input.customer ?? "",
    email: input.email ?? "",
    seats: Number(input.seats ?? 1),
    status: input.status ?? "active",
    nextBillingAt: input.nextBillingAt ?? new Date(Date.now() + 7 * 86400_000).toISOString(),
    lastInvoiceId: input.lastInvoiceId ?? null,
  };

  const result = await query(
    `
      insert into subscriptions (
        id, merchant_id, plan_id, customer_name, customer_email, seats, status, next_billing_at, last_invoice_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning *
    `,
    [
      subscription.id,
      subscription.merchantId,
      subscription.planId,
      subscription.customer,
      subscription.email,
      subscription.seats,
      subscription.status,
      subscription.nextBillingAt,
      subscription.lastInvoiceId,
    ]
  );

  return mapSubscription(result.rows[0]);
}

export async function listSettlementPolicies(filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }
  const result = await query(
    `
      select * from settlement_policies
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by created_at desc
    `,
    params
  );
  return result.rows.map(mapSettlementPolicy);
}

export async function createSettlementPolicy(input) {
  const policy = {
    id: input.id ?? makeId("pol"),
    merchantId: input.merchantId,
    name: input.name ?? "Untitled policy",
    destination: input.destination ?? "",
    currency: input.currency ?? "sBTC",
    triggerKind: input.triggerKind ?? "threshold",
    threshold: input.threshold ?? null,
    cadenceHours: input.cadenceHours ?? null,
    minPayout: input.minPayout ?? 0,
    active: input.active ?? true,
    nextSettlementAt: input.nextSettlementAt ?? null,
  };

  const result = await query(
    `
      insert into settlement_policies (
        id, merchant_id, name, destination, currency, trigger_kind, threshold,
        cadence_hours, min_payout, active, next_settlement_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning *
    `,
    [
      policy.id,
      policy.merchantId,
      policy.name,
      policy.destination,
      policy.currency,
      policy.triggerKind,
      policy.threshold,
      policy.cadenceHours,
      policy.minPayout,
      policy.active,
      policy.nextSettlementAt,
    ]
  );

  return mapSettlementPolicy(result.rows[0]);
}

export async function listSettlementRuns(filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }
  const result = await query(
    `
      select * from settlement_runs
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by executed_at desc nulls last, created_at desc
    `,
    params
  );
  return result.rows.map(mapSettlementRun);
}

export async function createSettlementRun(input) {
  const run = {
    id: input.id ?? makeId("set"),
    policyId: input.policyId,
    merchantId: input.merchantId,
    destination: input.destination ?? "",
    currency: input.currency ?? "sBTC",
    amount: String(input.amount ?? 0),
    status: input.status ?? "pending",
    txId: input.txId ?? null,
    executedAt: input.executedAt ?? null,
  };

  const result = await query(
    `
      insert into settlement_runs (
        id, policy_id, merchant_id, destination, currency, amount, status, tx_id, executed_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning *
    `,
    [
      run.id,
      run.policyId,
      run.merchantId,
      run.destination,
      run.currency,
      run.amount,
      run.status,
      run.txId,
      run.executedAt,
    ]
  );

  return mapSettlementRun(result.rows[0]);
}

export async function listReceipts(filters = {}) {
  const params = [];
  const clauses = [];

  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }

  if (filters.invoiceId) {
    params.push(filters.invoiceId);
    clauses.push(`invoice_id = $${params.length}`);
  }

  const result = await query(
    `
      select * from receipts
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by paid_at desc, created_at desc
    `,
    params
  );

  return result.rows.map(mapReceipt);
}

export async function createReceipt(input) {
  const receipt = {
    id: input.id ?? makeId("rcp"),
    merchantId: input.merchantId,
    invoiceId: input.invoiceId,
    amount: String(input.amount ?? 0),
    currency: input.currency ?? "sBTC",
    payerLabel: input.payerLabel ?? "",
    txId: input.txId ?? "",
    paidAt: input.paidAt ?? new Date().toISOString(),
  };

  const result = await query(
    `
      insert into receipts (
        id, merchant_id, invoice_id, amount, currency, payer_label, tx_id, paid_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning *
    `,
    [
      receipt.id,
      receipt.merchantId,
      receipt.invoiceId,
      receipt.amount,
      receipt.currency,
      receipt.payerLabel,
      receipt.txId,
      receipt.paidAt,
    ]
  );

  return mapReceipt(result.rows[0]);
}

export async function listWebhookDeliveries(filters = {}) {
  const params = [];
  const clauses = [];
  if (filters.merchantId) {
    params.push(filters.merchantId);
    clauses.push(`merchant_id = $${params.length}`);
  }
  const result = await query(
    `
      select * from webhook_deliveries
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by attempted_at desc
    `,
    params
  );
  return result.rows.map(mapWebhookDelivery);
}

export async function createWebhookDelivery(input) {
  const delivery = {
    id: input.id ?? makeId("wh"),
    merchantId: input.merchantId,
    event: input.event ?? "invoice.paid",
    target: input.target ?? "",
    status: input.status ?? "delivered",
    summary: input.summary ?? "Webhook test delivery",
    attemptedAt: input.attemptedAt ?? new Date().toISOString(),
  };

  const result = await query(
    `
      insert into webhook_deliveries (
        id, merchant_id, event, target, status, summary, attempted_at
      ) values ($1, $2, $3, $4, $5, $6, $7)
      returning *
    `,
    [
      delivery.id,
      delivery.merchantId,
      delivery.event,
      delivery.target,
      delivery.status,
      delivery.summary,
      delivery.attemptedAt,
    ]
  );

  return mapWebhookDelivery(result.rows[0]);
}

export async function ensureDemoMerchant() {
  const existing = await findMerchantBySlug("studio-noon");
  if (existing) {
    return existing;
  }

  return createMerchant({
    slug: "studio-noon",
    businessName: "Studio Noon",
    email: "ops@studionoon.dev",
    settlementWallet: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    defaultCurrency: "sBTC",
    webhookUrl: "https://api.studionoon.dev/stackpay/webhooks",
  });
}
