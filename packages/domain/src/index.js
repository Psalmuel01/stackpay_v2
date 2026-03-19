export const stackpayPositioning =
  "StackPay is a Bitcoin-native payment gateway on Stacks for invoices, subscriptions, settlements, and developer integrations.";

export const supportedCurrencies = [
  {
    symbol: "sBTC",
    name: "sBTC",
    description: "Bitcoin via Stacks",
    tone: "bg-emerald-400",
    settlementAsset: true,
  },
  {
    symbol: "STX",
    name: "Stacks",
    description: "Native network asset",
    tone: "bg-sky-400",
    settlementAsset: true,
  },
  {
    symbol: "USDCx",
    name: "USDCx",
    description: "Stable settlement rail",
    tone: "bg-amber-300",
    settlementAsset: true,
  },
];

export const invoiceTypes = [
  {
    id: "standard",
    label: "Standard",
    description: "One-time hosted invoice with fixed amount and expiration.",
  },
  {
    id: "multipay",
    label: "MultiPay",
    description: "Reusable public payment route that can collect multiple payments over time.",
  },
  {
    id: "subscription",
    label: "Subscription",
    description: "Recurring plan that issues renewal invoices on a schedule.",
  },
];

export const invoiceStatuses = ["draft", "pending", "paid", "expired", "cancelled"];

export const subscriptionCollectionModes = [
  {
    id: "recurring-invoice",
    label: "Recurring invoice",
    description: "MVP-safe mode that issues a new invoice every billing cycle.",
  },
  {
    id: "pre-authorization",
    label: "Pre-authorization",
    description: "Future mode for wallet-approved recurring payments or escrowed balances.",
  },
];

export const mvpTracks = [
  {
    id: "merchant-onboarding",
    title: "Merchant onboarding",
    outcome: "Merchant connects wallet, syncs profile metadata into Supabase, configures webhook, and sets settlement wallet.",
  },
  {
    id: "one-time-invoices",
    title: "One-time invoice flow",
    outcome: "Merchant creates invoice, shares hosted link or QR, customer pays, receipt is indexed.",
  },
  {
    id: "subscription-renewals",
    title: "Subscription renewals",
    outcome: "Plans generate invoices on schedule instead of trying to pull from wallets automatically.",
  },
  {
    id: "settlement-operations",
    title: "Settlement operations",
    outcome: "Merchant configures thresholds or schedules and triggers withdrawals through a worker.",
  },
  {
    id: "developer-integrations",
    title: "Developer integrations",
    outcome: "Next.js route handlers, webhook delivery, and SDKs expose the same invoice and settlement lifecycle.",
  },
];

export const contractBacklog = [
  {
    id: "merchant-registry",
    title: "Merchant registry metadata",
    reason: "Store settlement wallet sets, public slug, webhook preferences, and fee settings on-chain or in canonical metadata.",
  },
  {
    id: "invoice-hosted-reference",
    title: "Hosted payment references",
    reason: "Map public payment links and QR-friendly slugs to invoice ids or reusable collection surfaces.",
  },
  {
    id: "subscription-primitives",
    title: "Subscription primitives",
    reason: "Track plans, subscribers, billing cadence, and renewal invoice generation. Do not promise wallet pull until authorization mechanics exist.",
  },
  {
    id: "settlement-policies",
    title: "Settlement policy records",
    reason: "Persist threshold rules, scheduled sweeps, multi-wallet splits, and execution audit records.",
  },
  {
    id: "event-indexing",
    title: "Richer event emission",
    reason: "Emit stable invoice, settlement, and subscription events for webhook workers and explorers.",
  },
];
