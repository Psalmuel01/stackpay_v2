import {
  buildCreateInvoiceIntent,
  buildCreateInvoicePaymentLinkIntent,
  buildCreateMultipayLinkIntent,
  buildCreateUniversalQrIntent,
  type ContractIntent,
} from "@/lib/server/stackpay-contracts";
import { makeEntityKey, slugify } from "@/lib/server/ids";
import {
  insertRow,
  patchRows,
  selectRows,
  upsertRow,
} from "@/lib/server/supabase-admin";

export type Currency = "sBTC" | "STX" | "USDCx";
type Row = Record<string, any>;

type MerchantProfileInput = {
  walletAddress: string;
  displayName?: string;
  companyName?: string;
  email?: string;
  slug?: string;
  settlementWallet?: string;
  webhookUrl?: string;
  defaultCurrency?: Currency;
  metadata?: Record<string, unknown>;
};

type CreateInvoiceInput = {
  walletAddress: string;
  kind?: "standard" | "subscription" | "multipay";
  amount: number;
  currency: Currency;
  description: string;
  customerName?: string;
  customerEmail?: string;
  recipientAddress: string;
  recipientLabel?: string;
  expiresInSeconds?: number | null;
  metadata?: Record<string, unknown>;
};

type CreatePaymentLinkInput = {
  walletAddress: string;
  kind: "invoice" | "multipay" | "subscription";
  slug?: string;
  title: string;
  description?: string;
  linkedInvoiceId?: string;
  linkedSubscriptionPlanId?: string;
  defaultCurrency?: Currency;
  acceptedCurrencies?: Currency[];
  defaultAmount?: number | null;
  amountStep?: number | null;
  allowCustomAmount?: boolean;
  metadata?: Record<string, unknown>;
};

type CreateUniversalQrInput = {
  walletAddress: string;
  slug?: string;
  title?: string;
  description?: string;
};

type ChainConfirmationInput = {
  id: string;
  txId: string;
  onchainId: string;
};

async function selectSingle<T extends Row>(table: string, query: Record<string, string>) {
  const rows = (await selectRows(table, {
    select: "*",
    ...query,
    limit: 1,
  })) as T[] | null;

  return rows?.[0] ?? null;
}

function ensureWalletAddress(walletAddress: string) {
  const trimmed = walletAddress.trim();
  if (!trimmed) {
    throw new Error("walletAddress is required.");
  }
  return trimmed;
}

function ensurePositiveAmount(amount: number, fieldName: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
}

function buildAcceptedCurrencies(defaultCurrency?: Currency, acceptedCurrencies?: Currency[]) {
  if (acceptedCurrencies?.length) {
    return [...new Set(acceptedCurrencies)];
  }

  return defaultCurrency ? [defaultCurrency] : ["sBTC", "STX", "USDCx"];
}

async function recordActivity(
  merchantId: string,
  entityType: string,
  entityId: string,
  eventType: string,
  payload: Record<string, unknown>,
  txId?: string | null
) {
  await insertRow("activity_events", {
    merchant_id: merchantId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    tx_id: txId ?? null,
    payload,
  });
}

export async function getMerchantProfileByWallet(walletAddress: string) {
  return selectSingle<Row>("merchant_profiles", {
    wallet_address: `eq.${ensureWalletAddress(walletAddress)}`,
  });
}

export async function upsertMerchantProfile(input: MerchantProfileInput) {
  const walletAddress = ensureWalletAddress(input.walletAddress);
  const fallbackSlugBase = slugify(input.companyName || input.displayName || "merchant");
  const fallbackSlug = `${fallbackSlugBase}-${walletAddress.slice(-6).toLowerCase()}`;
  const merchant = await upsertRow(
    "merchant_profiles",
    {
      wallet_address: walletAddress,
      display_name: input.displayName ?? "",
      company_name: input.companyName ?? "",
      email: input.email ?? "",
      slug: input.slug ? slugify(input.slug) : fallbackSlug,
      settlement_wallet: input.settlementWallet ?? walletAddress,
      webhook_url: input.webhookUrl ?? null,
      default_currency: input.defaultCurrency ?? "sBTC",
      metadata: input.metadata ?? {},
    },
    "wallet_address"
  );

  if (!merchant) {
    throw new Error("Failed to upsert merchant profile.");
  }

  await upsertRow(
    "merchant_wallets",
    {
      merchant_id: merchant.id,
      wallet_address: walletAddress,
      network: process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet",
      label: "Primary wallet",
      is_primary: true,
    },
    "wallet_address"
  );

  return merchant;
}

export async function listInvoicesForWallet(walletAddress: string) {
  const merchant = await getMerchantProfileByWallet(walletAddress);
  if (!merchant) {
    return [];
  }

  return (await selectRows("invoices", {
    select: "*",
    merchant_id: `eq.${merchant.id as string}`,
    order: "created_at.desc",
  })) as Row[];
}

export async function createInvoiceDraft(input: CreateInvoiceInput) {
  ensurePositiveAmount(input.amount, "amount");
  const merchant = await upsertMerchantProfile({ walletAddress: input.walletAddress });
  const expiresInSeconds =
    input.expiresInSeconds && input.expiresInSeconds > 0 ? input.expiresInSeconds : 86_400;
  const invoiceKey = makeEntityKey("INV");
  const contractIntent = buildCreateInvoiceIntent({
    recipientAddress: input.recipientAddress,
    amount: input.amount,
    currency: input.currency,
    expiresInSeconds,
    description: input.description,
    metadata: JSON.stringify(input.metadata ?? {}),
    email: input.customerEmail ?? "",
    webhookUrl: typeof merchant.webhook_url === "string" ? merchant.webhook_url : null,
  });

  const invoice = await insertRow("invoices", {
    merchant_id: merchant.id,
    invoice_key: invoiceKey,
    kind: input.kind ?? "standard",
    status: "pending_signature",
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    customer_name: input.customerName ?? "",
    customer_email: input.customerEmail ?? "",
    recipient_address: input.recipientAddress,
    recipient_label: input.recipientLabel ?? "Settlement wallet",
    expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    metadata: input.metadata ?? {},
    draft_contract_call: contractIntent,
  });

  await recordActivity(merchant.id as string, "invoice", invoice.id as string, "invoice.draft.created", {
    invoiceKey,
    kind: input.kind ?? "standard",
  });

  return {
    invoice,
    merchant,
    contractIntent,
  };
}

export async function confirmInvoiceChain(input: ChainConfirmationInput) {
  const rows = (await patchRows(
    "invoices",
    { id: input.id },
    {
      tx_id: input.txId,
      onchain_invoice_id: input.onchainId,
      status: "pending_chain",
    }
  )) as Row[];

  const invoice = rows[0] ?? null;
  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  await recordActivity(
    invoice.merchant_id as string,
    "invoice",
    invoice.id as string,
    "invoice.chain.submitted",
    {
      onchainInvoiceId: input.onchainId,
    },
    input.txId
  );

  return invoice;
}

export async function listPaymentLinksForWallet(walletAddress: string) {
  const merchant = await getMerchantProfileByWallet(walletAddress);
  if (!merchant) {
    return [];
  }

  return (await selectRows("payment_links", {
    select: "*",
    merchant_id: `eq.${merchant.id as string}`,
    order: "created_at.desc",
  })) as Row[];
}

export async function createPaymentLinkDraft(input: CreatePaymentLinkInput) {
  const merchant = await upsertMerchantProfile({ walletAddress: input.walletAddress });
  const slug = slugify(input.slug || `${merchant.slug || merchant.company_name || "stackpay"}-${input.kind}`);
  const acceptedCurrencies = buildAcceptedCurrencies(input.defaultCurrency, input.acceptedCurrencies);
  let contractIntent: ContractIntent;

  if (input.kind === "invoice") {
    if (!input.linkedInvoiceId) {
      throw new Error("linkedInvoiceId is required for invoice payment links.");
    }

    const invoice = await selectSingle<Row>("invoices", {
      id: `eq.${input.linkedInvoiceId}`,
    });

    if (!invoice) {
      throw new Error("Linked invoice was not found.");
    }

    if (!invoice.onchain_invoice_id) {
      throw new Error("Linked invoice must be confirmed on-chain before creating its payment link.");
    }

    contractIntent = buildCreateInvoicePaymentLinkIntent({
      slug,
      onchainInvoiceId: String(invoice.onchain_invoice_id),
      title: input.title,
      description: input.description ?? "",
    });
  } else if (input.kind === "multipay") {
    const defaultCurrency = input.defaultCurrency ?? "sBTC";
    contractIntent = buildCreateMultipayLinkIntent({
      slug,
      title: input.title,
      description: input.description ?? "",
      defaultCurrency,
      defaultAmount: input.defaultAmount ?? null,
      amountStep: input.amountStep ?? null,
      allowCustomAmount: input.allowCustomAmount ?? true,
      acceptsStx: acceptedCurrencies.includes("STX"),
      acceptsSbtc: acceptedCurrencies.includes("sBTC"),
      acceptsUsdcx: acceptedCurrencies.includes("USDCx"),
    });
  } else {
    throw new Error("Subscription payment-link creation is not wired in this route yet.");
  }

  const linkKey = makeEntityKey("LNK");
  const paymentLink = await insertRow("payment_links", {
    merchant_id: merchant.id,
    link_key: linkKey,
    kind: input.kind,
    slug,
    title: input.title,
    description: input.description ?? "",
    linked_invoice_id: input.linkedInvoiceId ?? null,
    linked_subscription_plan_id: input.linkedSubscriptionPlanId ?? null,
    default_currency: input.defaultCurrency ?? null,
    accepted_currencies: acceptedCurrencies,
    default_amount: input.defaultAmount ?? null,
    amount_step: input.amountStep ?? null,
    allow_custom_amount: input.allowCustomAmount ?? input.kind === "multipay",
    is_universal: false,
    is_active: true,
    draft_contract_call: contractIntent,
    metadata: input.metadata ?? {},
  });

  await recordActivity(merchant.id as string, "payment_link", paymentLink.id as string, "payment_link.draft.created", {
    kind: input.kind,
    slug,
  });

  return {
    paymentLink,
    merchant,
    contractIntent,
  };
}

export async function confirmPaymentLinkChain(input: ChainConfirmationInput) {
  const rows = (await patchRows(
    "payment_links",
    { id: input.id },
    {
      tx_id: input.txId,
      onchain_link_id: input.onchainId,
    }
  )) as Row[];

  const paymentLink = rows[0] ?? null;
  if (!paymentLink) {
    throw new Error("Payment link not found.");
  }

  if (paymentLink.is_universal) {
    await patchRows(
      "payment_links",
      {
        merchant_id: String(paymentLink.merchant_id),
        is_universal: "eq.true",
        id: `neq.${String(paymentLink.id)}`,
      },
      {
        is_active: false,
      }
    );

    await patchRows(
      "payment_links",
      { id: String(paymentLink.id) },
      {
        is_active: true,
      }
    );
  }

  await recordActivity(
    paymentLink.merchant_id as string,
    "payment_link",
    paymentLink.id as string,
    "payment_link.chain.submitted",
    {
      onchainLinkId: input.onchainId,
    },
    input.txId
  );

  return paymentLink;
}

export async function getUniversalQrForWallet(walletAddress: string) {
  const merchant = await getMerchantProfileByWallet(walletAddress);
  if (!merchant) {
    return null;
  }

  return selectSingle<Row>("payment_links", {
    merchant_id: `eq.${merchant.id as string}`,
    is_universal: "eq.true",
    is_active: "eq.true",
    order: "created_at.desc",
  });
}

export async function createUniversalQrDraft(input: CreateUniversalQrInput) {
  const merchant = await upsertMerchantProfile({ walletAddress: input.walletAddress });
  const slug = slugify(input.slug || `${merchant.slug || merchant.company_name || "stackpay"}-pay`);
  const title = input.title || `${merchant.company_name || merchant.display_name || "StackPay"} QR`;
  const description =
    input.description || "Permanent universal QR route for daily payments across supported assets.";
  const contractIntent = buildCreateUniversalQrIntent({
    slug,
    title,
    description,
  });
  const linkKey = makeEntityKey("QR");

  const paymentLink = await insertRow("payment_links", {
    merchant_id: merchant.id,
    link_key: linkKey,
    kind: "multipay",
    slug,
    title,
    description,
    default_currency: null,
    accepted_currencies: ["sBTC", "STX", "USDCx"],
    default_amount: null,
    amount_step: null,
    allow_custom_amount: true,
    is_universal: true,
    is_active: true,
    draft_contract_call: contractIntent,
    metadata: {
      source: "universal-qr",
    },
  });

  await recordActivity(merchant.id as string, "payment_link", paymentLink.id as string, "payment_link.qr.created", {
    slug,
    universal: true,
  });

  return {
    paymentLink,
    merchant,
    contractIntent,
  };
}
