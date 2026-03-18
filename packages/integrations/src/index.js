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
  { method: "POST", path: "/v1/invoices", purpose: "Create invoice and hosted payment link." },
  { method: "GET", path: "/v1/invoices", purpose: "List invoices for dashboard and explorer surfaces." },
  { method: "POST", path: "/v1/subscriptions", purpose: "Create subscription plans and renewal policies." },
  { method: "GET", path: "/v1/subscriptions", purpose: "List plans and subscriber states." },
  { method: "GET", path: "/v1/settlements", purpose: "List pending and completed settlement runs." },
  { method: "POST", path: "/v1/webhooks/test", purpose: "Validate webhook target configuration." },
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
