export const integrationLayers = [
  {
    id: "rest-api",
    label: "REST API",
    description: "Merchant-facing orchestration layer for invoices, subscriptions, settlements, and receipts.",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    description: "Signed event delivery for invoice, settlement, and subscription lifecycle changes.",
  },
  {
    id: "sdk",
    label: "SDK",
    description: "Typed client surface that mirrors the REST resources.",
  },
  {
    id: "indexer",
    label: "Indexer",
    description: "Backend projection of on-chain invoice, receipt, and settlement events.",
  },
];

export const apiResources = [
  { method: "POST", path: "/api/merchant/profile", purpose: "Upsert merchant profile metadata keyed to a wallet address." },
  { method: "GET", path: "/api/invoices", purpose: "List invoices synced into database for the connected merchant." },
  { method: "POST", path: "/api/invoices", purpose: "Create an invoice draft in Supabase and return the contract intent." },
  { method: "POST", path: "/api/invoices/:invoiceId/chain", purpose: "Attach tx id and on-chain invoice id after wallet submission." },
  { method: "GET", path: "/api/payment-links", purpose: "List payment links and QR routes for the connected merchant." },
  { method: "POST", path: "/api/payment-links", purpose: "Create a MultiPay or invoice payment-link draft plus contract intent." },
  { method: "POST", path: "/api/payment-links/:paymentLinkId/chain", purpose: "Attach tx id and on-chain payment-link id after wallet submission." },
  { method: "GET", path: "/api/qr-link", purpose: "Fetch the active universal QR record for a merchant wallet." },
  { method: "POST", path: "/api/qr-link", purpose: "Create a universal QR draft in Supabase and return the contract intent." },
];

export const webhookEvents = [
  "invoice.created",
  "invoice.paid",
  "invoice.expired",
  "subscription.plan.created",
  "subscription.renewal.invoice_created",
  "settlement.pending",
  "settlement.completed",
  "webhook.delivery.failed",
];
