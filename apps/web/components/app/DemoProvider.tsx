"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Currency = "sBTC" | "STX" | "USDCx";
export type InvoiceType = "standard" | "subscription" | "donation";
export type InvoiceStatus = "draft" | "pending" | "paid" | "expired";
export type SubscriptionStatus = "active" | "paused" | "canceled";
export type PlanStatus = "active" | "draft" | "archived";
export type SettlementTrigger = "threshold" | "scheduled";
export type DeliveryStatus = "delivered" | "pending" | "failed";
export type NotificationKey =
  | "invoicePaid"
  | "settlementCompleted"
  | "subscriptionRenewed"
  | "webhookFailure";

export type MerchantProfile = {
  businessName: string;
  email: string;
  slug: string;
  settlementWallet: string;
  defaultCurrency: Currency;
  webhookUrl: string;
  notifications: Record<NotificationKey, boolean>;
  apiKey: string;
  webhookSecret: string;
};

export type DemoInvoice = {
  id: string;
  type: InvoiceType;
  customer: string;
  email: string;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  description: string;
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
  recipientLabel: string;
  metadata: string;
  sourcePlanId?: string;
  receiptId?: string;
};

export type DemoReceipt = {
  id: string;
  invoiceId: string;
  amount: number;
  currency: Currency;
  payerLabel: string;
  timestamp: string;
  txId: string;
};

export type DemoPaymentLink = {
  id: string;
  slug: string;
  title: string;
  mode: "invoice" | "donation" | "subscription";
  invoiceId?: string;
  planId?: string;
  currency: Currency;
  isActive: boolean;
  createdAt: string;
};

export type DemoPlan = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  intervalLabel: string;
  intervalSeconds: number;
  status: PlanStatus;
  metadata: string;
  createdAt: string;
};

export type DemoSubscription = {
  id: string;
  planId: string;
  customer: string;
  email: string;
  seats: number;
  status: SubscriptionStatus;
  nextBillingAt: string;
  createdAt: string;
  lastInvoiceId?: string;
};

export type DemoSettlementPolicy = {
  id: string;
  name: string;
  destination: string;
  currency: Currency;
  trigger: SettlementTrigger;
  threshold?: number;
  cadenceHours?: number;
  minPayout: number;
  nextSettlementAt: string | null;
  active: boolean;
  createdAt: string;
};

export type DemoSettlementRun = {
  id: string;
  policyId: string;
  destination: string;
  currency: Currency;
  amount: number;
  status: "completed" | "pending";
  executedAt: string;
  txId: string;
};

export type DemoWebhookDelivery = {
  id: string;
  event: string;
  status: DeliveryStatus;
  target: string;
  attemptedAt: string;
  summary: string;
};

export type DemoState = {
  merchant: MerchantProfile;
  invoices: DemoInvoice[];
  receipts: DemoReceipt[];
  paymentLinks: DemoPaymentLink[];
  plans: DemoPlan[];
  subscriptions: DemoSubscription[];
  settlementPolicies: DemoSettlementPolicy[];
  settlementRuns: DemoSettlementRun[];
  webhookDeliveries: DemoWebhookDelivery[];
  balances: Record<Currency, number>;
};

type InvoiceInput = {
  type: InvoiceType;
  customer: string;
  email: string;
  amount: number;
  currency: Currency;
  description: string;
  expirationHours: number | null;
  recipientLabel: string;
  metadata: string;
};

type PlanInput = {
  name: string;
  amount: number;
  currency: Currency;
  intervalLabel: string;
  intervalSeconds: number;
  metadata: string;
};

type SubscriptionInput = {
  planId: string;
  customer: string;
  email: string;
  seats: number;
};

type SettlementInput = {
  name: string;
  destination: string;
  currency: Currency;
  trigger: SettlementTrigger;
  threshold?: number;
  cadenceHours?: number;
  minPayout: number;
};

type PublicLinkCheckoutInput = {
  slug: string;
  customer: string;
  email: string;
  amount?: number;
};

type DemoContextValue = {
  hydrated: boolean;
  state: DemoState;
  actions: {
    updateMerchantProfile: (patch: Partial<MerchantProfile>) => void;
    toggleNotification: (key: NotificationKey) => void;
    rotateApiKey: () => string;
    rotateWebhookSecret: () => string;
    sendWebhookTest: (event: string, target?: string) => DemoWebhookDelivery;
    createInvoice: (input: InvoiceInput, options?: { draft?: boolean }) => DemoInvoice;
    markInvoicePaid: (invoiceId: string, payerLabel: string) => DemoReceipt | null;
    expireInvoice: (invoiceId: string) => void;
    createPaymentLink: (input: {
      slug: string;
      title: string;
      mode: "invoice" | "donation" | "subscription";
      currency: Currency;
      invoiceId?: string;
      planId?: string;
    }) => DemoPaymentLink;
    regenerateUniversalLink: () => DemoPaymentLink;
    createPlan: (input: PlanInput) => DemoPlan;
    addSubscriber: (input: SubscriptionInput) => DemoSubscription;
    recordRenewal: (subscriptionId: string) => DemoInvoice | null;
    createSettlementPolicy: (input: SettlementInput) => DemoSettlementPolicy;
    toggleSettlementPolicy: (policyId: string) => void;
    executeSettlement: (policyId: string) => DemoSettlementRun | null;
    createInvoiceFromLink: (input: PublicLinkCheckoutInput) => DemoInvoice | null;
    enrollFromLink: (input: PublicLinkCheckoutInput) => DemoSubscription | null;
  };
};

const STORAGE_KEY = "stackpay-demo-state-v2";
const DemoContext = createContext<DemoContextValue | null>(null);

function isoAt(iso: string, secondsToAdd = 0) {
  return new Date(new Date(iso).getTime() + secondsToAdd * 1000).toISOString();
}

function currencyValue(amount: number) {
  return Math.round(amount * 1000) / 1000;
}

function makeId(prefix: string) {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}_${stamp}${rand}`;
}

function makeApiKey() {
  return `sk_demo_${Math.random().toString(36).slice(2, 10)}`;
}

function makeSecret(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 14)}`;
}

function makeTxId() {
  return `0x${Math.random().toString(16).slice(2).padEnd(16, "0")}`;
}

function seedState(): DemoState {
  const base = "2025-03-18T15:00:00.000Z";
  return {
    merchant: {
      businessName: "Studio Noon",
      email: "ops@studionoon.dev",
      slug: "studio-noon",
      settlementWallet: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
      defaultCurrency: "sBTC",
      webhookUrl: "https://api.studionoon.dev/stackpay/webhooks",
      notifications: {
        invoicePaid: true,
        settlementCompleted: true,
        subscriptionRenewed: false,
        webhookFailure: true,
      },
      apiKey: "sk_demo_34fc92dd",
      webhookSecret: "whsec_demo_9f2c1140",
    },
    invoices: [
      {
        id: "INV_9821",
        type: "standard",
        customer: "Studio Noon",
        email: "billing@studionoon.dev",
        amount: 0.018,
        currency: "sBTC",
        status: "pending",
        description: "April retainership",
        createdAt: isoAt(base, -3600),
        expiresAt: isoAt(base, 3600 * 18),
        paidAt: null,
        recipientLabel: "Main settlement wallet",
        metadata: "engagement=retainer",
      },
      {
        id: "INV_9815",
        type: "standard",
        customer: "Mint Labs",
        email: "finance@mintlabs.io",
        amount: 480,
        currency: "USDCx",
        status: "paid",
        description: "Growth plan renewal",
        createdAt: isoAt(base, -7200 * 8),
        expiresAt: isoAt(base, -7200 * 4),
        paidAt: isoAt(base, -7200 * 5),
        recipientLabel: "Treasury wallet",
        metadata: "plan=growth",
        receiptId: "RCP_1201",
      },
      {
        id: "INV_9798",
        type: "standard",
        customer: "Relay FM",
        email: "accounts@relay.fm",
        amount: 220,
        currency: "STX",
        status: "expired",
        description: "Conference sponsorship",
        createdAt: isoAt(base, -86400),
        expiresAt: isoAt(base, -43200),
        paidAt: null,
        recipientLabel: "Main settlement wallet",
        metadata: "campaign=events",
      },
    ],
    receipts: [
      {
        id: "RCP_1201",
        invoiceId: "INV_9815",
        amount: 480,
        currency: "USDCx",
        payerLabel: "Mint Labs",
        timestamp: isoAt(base, -7200 * 5),
        txId: "0x92f4c00000000000",
      },
    ],
    paymentLinks: [
      {
        id: "LNK_1",
        slug: "studio-noon",
        title: "Studio Noon universal checkout",
        mode: "donation",
        currency: "sBTC",
        isActive: true,
        createdAt: isoAt(base, -86400 * 10),
      },
      {
        id: "LNK_2",
        slug: "studio-noon-april",
        title: "April retainership invoice",
        mode: "invoice",
        currency: "sBTC",
        invoiceId: "INV_9821",
        isActive: true,
        createdAt: isoAt(base, -3600),
      },
    ],
    plans: [
      {
        id: "PLN_1",
        name: "Pro Annual",
        amount: 120,
        currency: "USDCx",
        intervalLabel: "Monthly",
        intervalSeconds: 60 * 60 * 24 * 30,
        status: "active",
        metadata: "seats=team",
        createdAt: isoAt(base, -86400 * 25),
      },
      {
        id: "PLN_2",
        name: "Starter",
        amount: 15,
        currency: "USDCx",
        intervalLabel: "Monthly",
        intervalSeconds: 60 * 60 * 24 * 30,
        status: "active",
        metadata: "tier=starter",
        createdAt: isoAt(base, -86400 * 15),
      },
    ],
    subscriptions: [
      {
        id: "SUB_1",
        planId: "PLN_1",
        customer: "Acme Inc",
        email: "billing@acme.inc",
        seats: 24,
        status: "active",
        nextBillingAt: isoAt(base, 86400 * 7),
        createdAt: isoAt(base, -86400 * 40),
        lastInvoiceId: "INV_9815",
      },
      {
        id: "SUB_2",
        planId: "PLN_2",
        customer: "Nova Studio",
        email: "ops@nova.studio",
        seats: 10,
        status: "active",
        nextBillingAt: isoAt(base, 86400 * 12),
        createdAt: isoAt(base, -86400 * 18),
      },
    ],
    settlementPolicies: [
      {
        id: "POL_1",
        name: "Main Wallet",
        destination: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
        currency: "sBTC",
        trigger: "threshold",
        threshold: 2,
        minPayout: 0.2,
        nextSettlementAt: null,
        active: true,
        createdAt: isoAt(base, -86400 * 12),
      },
      {
        id: "POL_2",
        name: "Treasury Sweep",
        destination: "SP3K8PZ5Q4A9TWJ5FQ17QXVCWCR9YB59P9EB2M1K1",
        currency: "USDCx",
        trigger: "scheduled",
        cadenceHours: 168,
        minPayout: 100,
        nextSettlementAt: isoAt(base, 60 * 60 * 14),
        active: true,
        createdAt: isoAt(base, -86400 * 12),
      },
    ],
    settlementRuns: [
      {
        id: "SET_204",
        policyId: "POL_2",
        destination: "SP3K8PZ5Q4A9TWJ5FQ17QXVCWCR9YB59P9EB2M1K1",
        currency: "USDCx",
        amount: 4200,
        status: "completed",
        executedAt: isoAt(base, -86400),
        txId: "0x44aa900000000000",
      },
      {
        id: "SET_205",
        policyId: "POL_1",
        destination: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
        currency: "sBTC",
        amount: 1.2,
        status: "pending",
        executedAt: isoAt(base, 60 * 60 * 2),
        txId: "0x92f4c00000000000",
      },
    ],
    webhookDeliveries: [
      {
        id: "WH_1",
        event: "invoice.paid",
        status: "delivered",
        target: "https://api.studionoon.dev/stackpay/webhooks",
        attemptedAt: isoAt(base, -7200 * 5),
        summary: "Mint Labs payment confirmed for INV_9815",
      },
      {
        id: "WH_2",
        event: "settlement.completed",
        status: "delivered",
        target: "https://api.studionoon.dev/stackpay/webhooks",
        attemptedAt: isoAt(base, -86400),
        summary: "Treasury sweep completed",
      },
      {
        id: "WH_3",
        event: "invoice.created",
        status: "pending",
        target: "https://api.studionoon.dev/stackpay/webhooks",
        attemptedAt: isoAt(base, -3600),
        summary: "Invoice INV_9821 created",
      },
    ],
    balances: {
      sBTC: 1.82,
      STX: 4280,
      USDCx: 18900,
    },
  };
}

function sortByDateDesc<T extends { createdAt?: string; attemptedAt?: string; timestamp?: string; executedAt?: string }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const left = a.createdAt ?? a.attemptedAt ?? a.timestamp ?? a.executedAt ?? "";
    const right = b.createdAt ?? b.attemptedAt ?? b.timestamp ?? b.executedAt ?? "";
    return right.localeCompare(left);
  });
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<DemoState>(seedState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setState(JSON.parse(raw) as DemoState);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  function commit(mutator: (current: DemoState) => DemoState) {
    setState((current) => {
      const next = mutator(current);
      stateRef.current = next;
      return next;
    });
  }

  function pushDelivery(nextState: DemoState, event: string, summary: string, status: DeliveryStatus) {
    const delivery: DemoWebhookDelivery = {
      id: makeId("WH"),
      event,
      status,
      target: nextState.merchant.webhookUrl || "https://merchant.example/webhooks/stackpay",
      attemptedAt: new Date().toISOString(),
      summary,
    };
    nextState.webhookDeliveries = sortByDateDesc([delivery, ...nextState.webhookDeliveries]);
  }

  const actions: DemoContextValue["actions"] = {
    updateMerchantProfile(patch) {
      commit((current) => ({
        ...current,
        merchant: {
          ...current.merchant,
          ...patch,
        },
      }));
    },
    toggleNotification(key) {
      commit((current) => ({
        ...current,
        merchant: {
          ...current.merchant,
          notifications: {
            ...current.merchant.notifications,
            [key]: !current.merchant.notifications[key],
          },
        },
      }));
    },
    rotateApiKey() {
      const nextKey = makeApiKey();
      commit((current) => ({
        ...current,
        merchant: {
          ...current.merchant,
          apiKey: nextKey,
        },
      }));
      return nextKey;
    },
    rotateWebhookSecret() {
      const nextSecret = makeSecret("whsec_demo");
      commit((current) => ({
        ...current,
        merchant: {
          ...current.merchant,
          webhookSecret: nextSecret,
        },
      }));
      return nextSecret;
    },
    sendWebhookTest(event, target) {
      const delivery: DemoWebhookDelivery = {
        id: makeId("WH"),
        event,
        status: "delivered",
        target: target || stateRef.current.merchant.webhookUrl,
        attemptedAt: new Date().toISOString(),
        summary: `${event} test event delivered`,
      };
      commit((current) => ({
        ...current,
        webhookDeliveries: sortByDateDesc([delivery, ...current.webhookDeliveries]),
      }));
      return delivery;
    },
    createInvoice(input, options) {
      const now = new Date().toISOString();
      const invoice: DemoInvoice = {
        id: makeId("INV"),
        type: input.type,
        customer: input.customer || "New customer",
        email: input.email,
        amount: currencyValue(input.amount),
        currency: input.currency,
        status: options?.draft ? "draft" : "pending",
        description: input.description,
        createdAt: now,
        expiresAt:
          options?.draft || input.expirationHours === null
            ? null
            : new Date(Date.now() + input.expirationHours * 60 * 60 * 1000).toISOString(),
        paidAt: null,
        recipientLabel: input.recipientLabel,
        metadata: input.metadata,
      };

      const paymentLink: DemoPaymentLink = {
        id: makeId("LNK"),
        slug: `${stateRef.current.merchant.slug}-${invoice.id.toLowerCase()}`,
        title: `${invoice.customer} checkout`,
        mode: "invoice",
        currency: invoice.currency,
        invoiceId: invoice.id,
        isActive: true,
        createdAt: now,
      };

      commit((current) => {
        const next = {
          ...current,
          invoices: sortByDateDesc([{ ...invoice }, ...current.invoices]),
          paymentLinks: sortByDateDesc([paymentLink, ...current.paymentLinks]),
        };
        pushDelivery(next, "invoice.created", `Invoice ${invoice.id} created for ${invoice.customer}`, "pending");
        return next;
      });

      return invoice;
    },
    markInvoicePaid(invoiceId, payerLabel) {
      const current = stateRef.current;
      const target = current.invoices.find((invoice) => invoice.id === invoiceId);
      if (!target || target.status !== "pending") {
        return null;
      }

      const receipt: DemoReceipt = {
        id: makeId("RCP"),
        invoiceId,
        amount: target.amount,
        currency: target.currency,
        payerLabel,
        timestamp: new Date().toISOString(),
        txId: makeTxId(),
      };

      commit((base) => {
        const next: DemoState = {
          ...base,
          balances: {
            ...base.balances,
            [target.currency]: currencyValue(base.balances[target.currency] + target.amount),
          },
          invoices: base.invoices.map((invoice) =>
            invoice.id === invoiceId
              ? {
                  ...invoice,
                  status: "paid",
                  paidAt: receipt.timestamp,
                  receiptId: receipt.id,
                }
              : invoice
          ),
          receipts: sortByDateDesc([receipt, ...base.receipts]),
        };
        pushDelivery(next, "invoice.paid", `Payment received for ${invoiceId}`, "delivered");
        return next;
      });

      return receipt;
    },
    expireInvoice(invoiceId) {
      commit((current) => ({
        ...current,
        invoices: current.invoices.map((invoice) =>
          invoice.id === invoiceId && invoice.status === "pending"
            ? { ...invoice, status: "expired" }
            : invoice
        ),
      }));
    },
    createPaymentLink(input) {
      const link: DemoPaymentLink = {
        id: makeId("LNK"),
        slug: input.slug,
        title: input.title,
        mode: input.mode,
        currency: input.currency,
        invoiceId: input.invoiceId,
        planId: input.planId,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      commit((current) => ({
        ...current,
        paymentLinks: sortByDateDesc([link, ...current.paymentLinks]),
      }));
      return link;
    },
    regenerateUniversalLink() {
      const slug = `${stateRef.current.merchant.slug}-${Math.random().toString(36).slice(2, 6)}`;
      const link = {
        id: makeId("LNK"),
        slug,
        title: `${stateRef.current.merchant.businessName} universal checkout`,
        mode: "donation" as const,
        currency: stateRef.current.merchant.defaultCurrency,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      commit((current) => ({
        ...current,
        paymentLinks: current.paymentLinks.map((item) =>
          item.mode === "donation" ? { ...item, isActive: false } : item
        ),
        merchant: {
          ...current.merchant,
          slug,
        },
      }));
      commit((current) => ({
        ...current,
        paymentLinks: sortByDateDesc([link, ...current.paymentLinks]),
      }));
      return link;
    },
    createPlan(input) {
      const plan: DemoPlan = {
        id: makeId("PLN"),
        name: input.name,
        amount: currencyValue(input.amount),
        currency: input.currency,
        intervalLabel: input.intervalLabel,
        intervalSeconds: input.intervalSeconds,
        status: "active",
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
      };
      commit((current) => ({
        ...current,
        plans: sortByDateDesc([plan, ...current.plans]),
      }));
      return plan;
    },
    addSubscriber(input) {
      const subscription: DemoSubscription = {
        id: makeId("SUB"),
        planId: input.planId,
        customer: input.customer,
        email: input.email,
        seats: input.seats,
        status: "active",
        nextBillingAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      commit((current) => ({
        ...current,
        subscriptions: sortByDateDesc([subscription, ...current.subscriptions]),
      }));
      return subscription;
    },
    recordRenewal(subscriptionId) {
      const subscription = stateRef.current.subscriptions.find((item) => item.id === subscriptionId);
      const plan = stateRef.current.plans.find((item) => item.id === subscription?.planId);
      if (!subscription || !plan) {
        return null;
      }
      const invoice = actions.createInvoice({
        type: "subscription",
        customer: subscription.customer,
        email: subscription.email,
        amount: plan.amount,
        currency: plan.currency,
        description: `${plan.name} renewal`,
        expirationHours: 24,
        recipientLabel: "Subscription treasury wallet",
        metadata: `subscription=${subscription.id}`,
      });
      commit((current) => {
        const nextBilling = new Date(
          new Date(subscription.nextBillingAt).getTime() + plan.intervalSeconds * 1000
        ).toISOString();
        const next = {
          ...current,
          subscriptions: current.subscriptions.map((item) =>
            item.id === subscriptionId
              ? { ...item, lastInvoiceId: invoice.id, nextBillingAt: nextBilling }
              : item
          ),
        };
        pushDelivery(next, "subscription.renewal.invoice_created", `Renewal invoice ${invoice.id} created`, "delivered");
        return next;
      });
      return invoice;
    },
    createSettlementPolicy(input) {
      const policy: DemoSettlementPolicy = {
        id: makeId("POL"),
        name: input.name,
        destination: input.destination,
        currency: input.currency,
        trigger: input.trigger,
        threshold: input.threshold,
        cadenceHours: input.cadenceHours,
        minPayout: currencyValue(input.minPayout),
        nextSettlementAt:
          input.trigger === "scheduled" && input.cadenceHours
            ? new Date(Date.now() + input.cadenceHours * 60 * 60 * 1000).toISOString()
            : null,
        active: true,
        createdAt: new Date().toISOString(),
      };
      commit((current) => ({
        ...current,
        settlementPolicies: sortByDateDesc([policy, ...current.settlementPolicies]),
      }));
      return policy;
    },
    toggleSettlementPolicy(policyId) {
      commit((current) => ({
        ...current,
        settlementPolicies: current.settlementPolicies.map((policy) =>
          policy.id === policyId ? { ...policy, active: !policy.active } : policy
        ),
      }));
    },
    executeSettlement(policyId) {
      const policy = stateRef.current.settlementPolicies.find((item) => item.id === policyId);
      if (!policy) {
        return null;
      }
      const balance = stateRef.current.balances[policy.currency];
      const amount =
        policy.trigger === "threshold"
          ? Math.max(policy.minPayout, Math.min(balance, policy.threshold ?? balance))
          : Math.max(policy.minPayout, Math.min(balance, policy.minPayout * 2));

      if (balance < amount || amount <= 0) {
        return null;
      }

      const run: DemoSettlementRun = {
        id: makeId("SET"),
        policyId: policy.id,
        destination: policy.destination,
        currency: policy.currency,
        amount: currencyValue(amount),
        status: "completed",
        executedAt: new Date().toISOString(),
        txId: makeTxId(),
      };

      commit((current) => {
        const next: DemoState = {
          ...current,
          balances: {
            ...current.balances,
            [policy.currency]: currencyValue(current.balances[policy.currency] - amount),
          },
          settlementRuns: sortByDateDesc([run, ...current.settlementRuns]),
          settlementPolicies: current.settlementPolicies.map((item) =>
            item.id === policyId && item.cadenceHours
              ? {
                  ...item,
                  nextSettlementAt: new Date(
                    Date.now() + item.cadenceHours * 60 * 60 * 1000
                  ).toISOString(),
                }
              : item
          ),
        };
        pushDelivery(next, "settlement.completed", `Settlement ${run.id} completed for ${policy.name}`, "delivered");
        return next;
      });

      return run;
    },
    createInvoiceFromLink(input) {
      const link = stateRef.current.paymentLinks.find(
        (item) => item.slug === input.slug && item.isActive
      );
      if (!link) {
        return null;
      }

      if (link.mode === "invoice" && link.invoiceId) {
        return stateRef.current.invoices.find((item) => item.id === link.invoiceId) ?? null;
      }

      if (link.mode === "subscription") {
        return null;
      }

      const amount = currencyValue(input.amount ?? 0);
      if (amount <= 0) {
        return null;
      }

      return actions.createInvoice({
        type: "donation",
        customer: input.customer,
        email: input.email,
        amount,
        currency: link.currency,
        description: `${link.title} contribution`,
        expirationHours: 24,
        recipientLabel: "Universal checkout",
        metadata: `link=${link.slug}`,
      });
    },
    enrollFromLink(input) {
      const link = stateRef.current.paymentLinks.find(
        (item) => item.slug === input.slug && item.isActive && item.mode === "subscription"
      );
      if (!link || !link.planId) {
        return null;
      }
      return actions.addSubscriber({
        planId: link.planId,
        customer: input.customer,
        email: input.email,
        seats: 1,
      });
    },
  };

  return (
    <DemoContext.Provider value={{ hydrated, state, actions }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}

export function formatCurrencyAmount(amount: number, currency: Currency) {
  if (currency === "STX") {
    return `${amount.toLocaleString()} ${currency}`;
  }
  return `${amount} ${currency}`;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "No deadline";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "No expiry";
  }
  const diffMs = new Date(value).getTime() - Date.now();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours === 0) {
    const minutes = Math.round(diffMs / (1000 * 60));
    return minutes >= 0 ? `in ${minutes}m` : `${Math.abs(minutes)}m ago`;
  }
  return hours >= 0 ? `in ${hours}h` : `${Math.abs(hours)}h ago`;
}
