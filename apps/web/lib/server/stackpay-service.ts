import {
  buildCreatePublicInvoiceFromLinkIntent,
  buildCreateInvoiceIntent,
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
  amount: number;
  currency: Currency;
  description: string;
  customerName?: string;
  customerEmail?: string;
  recipientAddress: string;
  expiresInSeconds?: number | null;
};

type CreatePaymentLinkInput = {
  walletAddress: string;
  kind: "multipay";
  recipientAddress?: string;
  slug?: string;
  title: string;
  description?: string;
  defaultCurrency?: Currency;
  acceptedCurrencies?: Currency[];
  defaultAmount?: number | null;
  amountStep?: number | null;
  allowCustomAmount?: boolean;
  metadata?: Record<string, unknown>;
};

type CreateUniversalQrInput = {
  walletAddress: string;
  recipientAddress?: string;
  slug?: string;
  title?: string;
  description?: string;
  rotate?: boolean;
};

type ConfirmInvoiceInput = {
  walletAddress: string;
  txId: string;
  onchainId: string;
  amount: number;
  currency: Currency;
  description: string;
  customerName?: string;
  customerEmail?: string;
  recipientAddress: string;
  expiresInSeconds: number;
  confirmedAt?: number | null;
};

type ChainConfirmationInput = {
  id: string;
  txId: string;
  onchainId?: string | null;
};

type PreparePublicInvoiceFromLinkInput = {
  slug: string;
  amount: number;
  currency: Currency;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  expiresInSeconds?: number | null;
};

type ConfirmPublicInvoiceInput = {
  slug: string;
  txId: string;
  onchainId: string;
  amount: number;
  currency: Currency;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  expiresInSeconds: number;
  confirmedAt?: number | null;
};

type ConfirmInvoicePaymentInput = {
  invoiceId: string;
  txId: string;
  receiptId: string;
  payerWalletAddress?: string | null;
  confirmedAt?: number | null;
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

function merchantDisplayName(merchant: Row | null) {
  if (!merchant) {
    return "";
  }

  const companyName = String(merchant.company_name ?? "").trim();
  const displayName = String(merchant.display_name ?? "").trim();
  return companyName || displayName;
}

function assertMerchantSetupReady(merchant: Row | null) {
  if (!merchant) {
    throw new Error("Complete your merchant settings before creating an invoice.");
  }

  if (!merchantDisplayName(merchant)) {
    throw new Error("Add a business name or display name in Settings before creating an invoice.");
  }
}

async function syncExpiredInvoices(filters: Record<string, string>) {
  const invoices = (await selectRows("invoices", {
    select: "id,status,expires_at",
    ...filters,
  })) as Row[] | null;

  const now = Date.now();
  const expiredIds =
    invoices
      ?.filter((invoice) => {
        const expiresAt = invoice.expires_at ? Date.parse(String(invoice.expires_at)) : Number.NaN;
        return invoice.status === "pending" && Number.isFinite(expiresAt) && expiresAt <= now;
      })
      .map((invoice) => String(invoice.id)) ?? [];

  for (const id of expiredIds) {
    await patchRows("invoices", { id }, { status: "expired" });
  }
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

  await syncExpiredInvoices({
    merchant_id: `eq.${merchant.id as string}`,
  });

  return (await selectRows("invoices", {
    select: "*",
    merchant_id: `eq.${merchant.id as string}`,
    order: "created_at.desc",
  })) as Row[];
}

export async function getInvoiceByIdOrOnchainId(invoiceId: string) {
  await syncExpiredInvoices({
    onchain_invoice_id: `eq.${invoiceId}`,
  });

  return selectSingle<Row>("invoices", {
    onchain_invoice_id: `eq.${invoiceId}`,
  });
}

export async function getInvoiceDetailsByOnchainId(invoiceId: string) {
  const invoice = await getInvoiceByIdOrOnchainId(invoiceId);
  if (!invoice) {
    return null;
  }

  const merchant = await selectSingle<Row>("merchant_profiles", {
    id: `eq.${String(invoice.merchant_id)}`,
  });

  return {
    ...invoice,
    merchant: merchant
      ? {
          display_name: merchant.display_name ?? "",
          company_name: merchant.company_name ?? "",
          slug: merchant.slug ?? "",
        }
      : null,
  };
}

export async function prepareInvoiceCreation(input: CreateInvoiceInput) {
  ensurePositiveAmount(input.amount, "amount");
  const walletAddress = ensureWalletAddress(input.walletAddress);
  const merchant = await getMerchantProfileByWallet(walletAddress);
  assertMerchantSetupReady(merchant);
  const expiresInSeconds =
    input.expiresInSeconds && input.expiresInSeconds > 0 ? input.expiresInSeconds : 86_400;
  const recipientAddress = input.recipientAddress?.trim() || walletAddress;
  const contractIntent = buildCreateInvoiceIntent({
    recipientAddress,
    amount: input.amount,
    currency: input.currency,
    expiresInSeconds,
    description: input.description,
  });

  return {
    merchant,
    contractIntent,
    invoice: {
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      customer_name: input.customerName ?? "",
      customer_email: input.customerEmail ?? "",
      recipient_address: recipientAddress,
      expires_in_seconds: expiresInSeconds,
    },
  };
}

export async function confirmInvoiceCreation(input: ConfirmInvoiceInput) {
  ensurePositiveAmount(input.amount, "amount");
  const walletAddress = ensureWalletAddress(input.walletAddress);
  const merchant = await upsertMerchantProfile({
    walletAddress,
    settlementWallet: input.recipientAddress || walletAddress,
  });

  const confirmedAtMs =
    typeof input.confirmedAt === "number" && input.confirmedAt > 0
      ? input.confirmedAt * 1000
      : Date.now();

  const invoice = await upsertRow(
    "invoices",
    {
      merchant_id: merchant.id,
      onchain_invoice_id: input.onchainId,
      tx_id: input.txId,
      status: "pending",
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      customer_name: input.customerName ?? "",
      customer_email: input.customerEmail ?? "",
      recipient_address: input.recipientAddress || walletAddress,
      expires_at: new Date(confirmedAtMs + input.expiresInSeconds * 1000).toISOString(),
    },
    "onchain_invoice_id"
  );

  await recordActivity(
    merchant.id as string,
    "invoice",
    input.onchainId,
    "invoice.created",
    {
      onchainInvoiceId: input.onchainId,
      amount: input.amount,
      currency: input.currency,
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

export async function getPublicPaymentLinkBySlug(slug: string) {
  const paymentLink = await selectSingle<Row>("payment_links", {
    slug: `eq.${slug}`,
    is_active: "eq.true",
  });

  if (!paymentLink) {
    return null;
  }

  const merchant = await selectSingle<Row>("merchant_profiles", {
    id: `eq.${String(paymentLink.merchant_id)}`,
  });

  return {
    ...paymentLink,
    merchant: merchant
      ? {
          display_name: merchant.display_name ?? "",
          company_name: merchant.company_name ?? "",
          slug: merchant.slug ?? "",
          settlement_wallet: merchant.settlement_wallet ?? "",
        }
      : null,
  };
}

export async function createPaymentLinkDraft(input: CreatePaymentLinkInput) {
  const merchant = await getMerchantProfileByWallet(input.walletAddress);
  assertMerchantSetupReady(merchant);
  const ensuredMerchant = merchant as Row;
  const slug = slugify(input.slug || `${ensuredMerchant.slug || ensuredMerchant.company_name || "stackpay"}-${input.kind}`);
  const acceptedCurrencies = buildAcceptedCurrencies(input.defaultCurrency, input.acceptedCurrencies);
  const recipientAddress =
    input.recipientAddress?.trim() ||
    String(ensuredMerchant.settlement_wallet || input.walletAddress);
  const defaultCurrency = input.defaultCurrency ?? "sBTC";
  const contractIntent: ContractIntent = buildCreateMultipayLinkIntent({
    recipientAddress,
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

  const linkKey = makeEntityKey("LNK");
  const paymentLink = await insertRow("payment_links", {
    merchant_id: ensuredMerchant.id,
    link_key: linkKey,
    kind: input.kind,
    slug,
    title: input.title,
    description: input.description ?? "",
    linked_invoice_id: null,
    linked_subscription_plan_id: null,
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

  await recordActivity(ensuredMerchant.id as string, "payment_link", paymentLink.id as string, "payment_link.draft.created", {
    kind: input.kind,
    slug,
  });

  return {
    paymentLink,
    merchant: ensuredMerchant,
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

  const activeLink = await selectSingle<Row>("payment_links", {
    merchant_id: `eq.${merchant.id as string}`,
    is_universal: "eq.true",
    is_active: "eq.true",
    order: "created_at.desc",
  });

  if (activeLink) {
    return activeLink;
  }

  return selectSingle<Row>("payment_links", {
    merchant_id: `eq.${merchant.id as string}`,
    is_universal: "eq.true",
    order: "created_at.desc",
  });
}

export async function createUniversalQrDraft(input: CreateUniversalQrInput) {
  const walletAddress = ensureWalletAddress(input.walletAddress);
  const merchant = await getMerchantProfileByWallet(walletAddress);
  assertMerchantSetupReady(merchant);
  const ensuredMerchant = merchant as Row;
  const existingUniversalLink = await getUniversalQrForWallet(walletAddress);

  if (existingUniversalLink && !input.rotate) {
    const restoredLink =
      existingUniversalLink.is_active
        ? existingUniversalLink
        : await patchRows(
            "payment_links",
            { id: String(existingUniversalLink.id) },
            { is_active: true }
          ).then((rows) => (rows as Row[])[0] ?? existingUniversalLink);

    return {
      paymentLink: restoredLink,
      merchant: ensuredMerchant,
      contractIntent: existingUniversalLink.onchain_link_id
        ? null
        : (existingUniversalLink.draft_contract_call ?? null),
      reusedExisting: true,
    };
  }

  const merchantName = merchantDisplayName(ensuredMerchant);
  const merchantSlug = String(ensuredMerchant.slug ?? merchantName);
  const slug = slugify(
    input.slug ||
      (input.rotate
        ? `${merchantSlug}-pay-${Date.now().toString(36).slice(-6)}`
        : `${merchantSlug}-pay`)
  );
  const title = input.title || `${merchantName} QR`;
  const description =
    input.description || "Multi-purpose payments across supported assets.";
  const recipientAddress =
    input.recipientAddress?.trim() ||
    String(ensuredMerchant.settlement_wallet || walletAddress);
  const contractIntent = buildCreateUniversalQrIntent({
    recipientAddress,
    slug,
    title,
    description,
  });
  const linkKey = makeEntityKey("QR");

  const paymentLink = await insertRow("payment_links", {
    merchant_id: ensuredMerchant.id,
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

  await recordActivity(ensuredMerchant.id as string, "payment_link", paymentLink.id as string, "payment_link.qr.created", {
    slug,
    universal: true,
  });

  return {
    paymentLink,
    merchant: ensuredMerchant,
    contractIntent,
    reusedExisting: false,
  };
}

export async function preparePublicInvoiceFromLink(input: PreparePublicInvoiceFromLinkInput) {
  ensurePositiveAmount(input.amount, "amount");
  const paymentLink = (await getPublicPaymentLinkBySlug(input.slug)) as Row | null;
  if (!paymentLink) {
    throw new Error("Public payment link not found.");
  }

  if (!paymentLink.onchain_link_id) {
    throw new Error("Public payment link is not confirmed on-chain yet.");
  }

  const acceptedCurrencies = (paymentLink.accepted_currencies as Currency[] | undefined) ?? [];
  if (!acceptedCurrencies.includes(input.currency)) {
    throw new Error("Selected currency is not enabled for this payment link.");
  }

  const defaultAmount = Number(paymentLink.default_amount ?? 0);
  const allowCustomAmount = Boolean(paymentLink.allow_custom_amount);
  if (defaultAmount > 0 && !allowCustomAmount && Number(input.amount) !== defaultAmount) {
    throw new Error("This payment link uses a fixed amount.");
  }

  const expiresInSeconds =
    input.expiresInSeconds && input.expiresInSeconds > 0 ? input.expiresInSeconds : 86_400;
  const description = String(
    input.description?.trim() || paymentLink.description || paymentLink.title || "Payment via StackPay"
  ).trim();
  const contractIntent = buildCreatePublicInvoiceFromLinkIntent({
    onchainLinkId: String(paymentLink.onchain_link_id),
    currency: input.currency,
    amount: input.amount,
    expiresInSeconds,
    description,
  });

  return {
    paymentLink,
    contractIntent,
    invoice: {
      amount: input.amount,
      currency: input.currency,
      description,
      customer_name: input.customerName ?? "",
      customer_email: input.customerEmail ?? "",
      expires_in_seconds: expiresInSeconds,
    },
  };
}

export async function confirmPublicInvoiceCreation(input: ConfirmPublicInvoiceInput) {
  ensurePositiveAmount(input.amount, "amount");
  const paymentLink = (await getPublicPaymentLinkBySlug(input.slug)) as Row | null;
  if (!paymentLink) {
    throw new Error("Public payment link not found.");
  }

  const confirmedAtMs =
    typeof input.confirmedAt === "number" && input.confirmedAt > 0
      ? input.confirmedAt * 1000
      : Date.now();

  const invoice = await upsertRow(
    "invoices",
    {
      merchant_id: paymentLink.merchant_id,
      onchain_invoice_id: input.onchainId,
      tx_id: input.txId,
      status: "pending",
      amount: input.amount,
      currency: input.currency,
      description: String(
        input.description?.trim() || paymentLink.description || paymentLink.title || "Payment via StackPay"
      ),
      customer_name: input.customerName ?? "",
      customer_email: input.customerEmail ?? "",
      recipient_address: String(paymentLink.merchant?.settlement_wallet || ""),
      expires_at: new Date(confirmedAtMs + input.expiresInSeconds * 1000).toISOString(),
    },
    "onchain_invoice_id"
  );

  await recordActivity(
    String(paymentLink.merchant_id),
    "invoice",
    input.onchainId,
    "invoice.created.public-link",
    {
      onchainInvoiceId: input.onchainId,
      slug: input.slug,
      amount: input.amount,
      currency: input.currency,
    },
    input.txId
  );

  return invoice;
}

export async function confirmInvoicePayment(input: ConfirmInvoicePaymentInput) {
  const invoice = await getInvoiceByIdOrOnchainId(input.invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const paidAt =
    typeof input.confirmedAt === "number" && input.confirmedAt > 0
      ? new Date(input.confirmedAt * 1000).toISOString()
      : new Date().toISOString();

  const rows = (await patchRows(
    "invoices",
    { onchain_invoice_id: input.invoiceId },
    {
      status: "paid",
      paid_at: paidAt,
    }
  )) as Row[];

  const updatedInvoice = rows[0] ?? invoice;

  await upsertRow(
    "receipts",
    {
      merchant_id: updatedInvoice.merchant_id,
      invoice_id: updatedInvoice.id,
      receipt_key: input.receiptId,
      onchain_receipt_id: input.receiptId,
      tx_id: input.txId,
      payer_wallet_address: input.payerWalletAddress ?? null,
      amount: updatedInvoice.amount,
      currency: updatedInvoice.currency,
      paid_at: paidAt,
    },
    "receipt_key"
  );

  await recordActivity(
    String(updatedInvoice.merchant_id),
    "invoice",
    input.invoiceId,
    "invoice.paid",
    {
      onchainInvoiceId: input.invoiceId,
      receiptId: input.receiptId,
    },
    input.txId
  );

  return updatedInvoice;
}
