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
  { method: "POST", path: "/v1/merchants", purpose: "Create a merchant profile with settlement and webhook defaults." },
  { method: "GET", path: "/v1/invoices", purpose: "List invoices for dashboard, hosted checkout, and back-office reconciliation." },
  { method: "POST", path: "/v1/invoices", purpose: "Create a standard or subscription-origin invoice record." },
  { method: "GET", path: "/v1/payment-links", purpose: "List reusable MultiPay, invoice, and subscription payment links." },
  { method: "POST", path: "/v1/payment-links", purpose: "Create merchant-facing payment links for invoice, MultiPay, or subscription flows." },
  { method: "POST", path: "/v1/qr-links/universal", purpose: "Generate or rotate the merchant's permanent universal QR route." },
  { method: "GET", path: "/v1/receipts", purpose: "List indexed receipt records tied to settled invoice payments." },
  { method: "GET", path: "/v1/subscription-plans", purpose: "List recurring plans that generate renewal invoices." },
  { method: "POST", path: "/v1/subscriptions", purpose: "Create subscriber records against a plan." },
  { method: "GET", path: "/v1/settlement-runs", purpose: "List pending and completed settlement executions." },
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
