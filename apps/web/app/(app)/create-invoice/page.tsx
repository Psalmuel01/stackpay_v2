"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import { type Currency, formatCurrencyAmount } from "@/components/app/DemoProvider";
import {
  getConnectedWalletAddress,
  submitContractIntent,
  type StackPayContractIntent,
} from "@/lib/stacks";

type CreateFlow = "standard" | "multipay";
type ExpirationOption = number | "custom";

type MerchantProfile = {
  settlement_wallet?: string | null;
  display_name?: string;
  company_name?: string;
  email?: string;
  slug?: string | null;
};

const flows: Array<{ id: CreateFlow; label: string; summary: string }> = [
  {
    id: "standard",
    label: "Standard",
    summary: "One invoice, one payment. The invoice closes after it is paid.",
  },
  {
    id: "multipay",
    label: "MultiPay",
    summary: "Reusable public route for multiple payments. Each customer payment creates a fresh invoice.",
  },
];

const currencies: Currency[] = ["STX", "sBTC", "USDCx"];
const expirations = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
  { label: "Custom", hours: "custom" as const },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function truncateAddress(address: string) {
  if (address.length <= 12) {
    return address;
  }

  return `${address.substring(0, 6)}...${address.slice(-4)}`;
}

function sanitizeDecimalInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...fractionParts] = sanitized.split(".");

  if (fractionParts.length === 0) {
    return whole;
  }

  return `${whole}.${fractionParts.join("")}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function CreateInvoicePage() {
  const [flow, setFlow] = useState<CreateFlow>("standard");
  const [currency, setCurrency] = useState<Currency>("STX");
  const [amount, setAmount] = useState("");
  const [expiration, setExpiration] = useState<ExpirationOption>(1);
  const [customExpirationValue, setCustomExpirationValue] = useState("");
  const [customExpirationUnit, setCustomExpirationUnit] = useState<"minutes" | "hours" | "days">("minutes");
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [amountStep, setAmountStep] = useState("");
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [result, setResult] = useState<{
    title: string;
    href?: string;
    summary: string;
    contractIntent?: StackPayContractIntent;
    storage?: string;
    txId?: string;
    onchainInvoiceId?: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const resolvedRecipientAddress = merchantProfile?.settlement_wallet || connectedAddress || "";
  const merchantName = (merchantProfile?.company_name || merchantProfile?.display_name || "").trim();
  const merchantReady = Boolean(
    connectedAddress &&
      (merchantProfile?.company_name ?? "").trim().length > 6 &&
      (merchantProfile?.display_name ?? "").trim() &&
      isValidEmail((merchantProfile?.email ?? "").trim())
  );

  useEffect(() => {
    setConnectedAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (!connectedAddress) {
      setMerchantProfile(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/merchant/profile?walletAddress=${encodeURIComponent(connectedAddress)}`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        return (payload.data ?? null) as MerchantProfile | null;
      })
      .then((profile) => {
        if (!cancelled) {
          setMerchantProfile(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerchantProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  const previewLabel = useMemo(() => {
    if (result?.href) {
      return result.href.replace(/^\//, "stackpay.app/");
    }
    if (flow === "multipay") {
      const previewSlug = slugify(slug || `${merchantProfile?.slug || ""}-multipay`);
      return previewSlug
        ? `stackpay.app/pay/link/${previewSlug}`
        : "Generated payment link appears after confirmation";
    }
    if (result?.txId && !result?.href) {
      return "Waiting for confirmed invoice link";
    }
    return "Generated invoice link appears after confirmation";
  }, [flow, result, slug]);

  async function handleCopy() {
    if (!result?.href) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${result.href}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function resetCreateForm() {
    setAmount("");
    setCustomer("");
    setEmail("");
    setDescription("");
    setTitle("");
    setSlug("");
    setAmountStep("");
    setCustomExpirationValue("");
  }

  async function confirmInvoiceFromChain(input: {
    txId: string;
    amount: number;
    currency: Currency;
    description: string;
    customerName: string;
    customerEmail: string;
    recipientAddress: string;
    expiresInSeconds: number;
  }) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch("/api/invoices/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: connectedAddress,
          ...input,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to confirm invoice transaction.");
      }

      if (payload.data?.sync?.status === "success" && payload.data?.sync?.onchainInvoiceId) {
        return {
          invoice: payload.data.invoice,
          txId: input.txId,
          onchainInvoiceId: payload.data.sync.onchainInvoiceId as string,
        };
      }

      if (
        payload.data?.sync?.status === "failed" ||
        payload.data?.sync?.status === "abort_by_response" ||
        payload.data?.sync?.status === "abort_by_post_condition"
      ) {
        throw new Error(payload.data?.sync?.result ?? "Invoice transaction failed on-chain.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    }

    return {
      invoice: null,
      txId: input.txId,
      onchainInvoiceId: null,
    };
  }

  async function confirmPaymentLinkFromChain(paymentLinkId: string, txId: string) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch(`/api/payment-links/${paymentLinkId}/chain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to confirm payment link transaction.");
      }

      if (payload.data?.onchain_link_id) {
        return payload.data;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    }

    return null;
  }

  async function submit() {
    setError(null);
    setSuccessMessage(null);

    if (flow === "standard") {
      if (!connectedAddress) {
        setError("Connect a merchant wallet before creating an invoice.");
        return;
      }

      const numericAmount = Number(amount || 0);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        setError("Enter a valid invoice amount.");
        return;
      }

      const customValue = Number(customExpirationValue || 0);
      const expiresInSeconds =
        expiration === "custom"
          ? customExpirationUnit === "minutes"
            ? customValue * 60
            : customExpirationUnit === "hours"
              ? customValue * 60 * 60
              : customValue * 24 * 60 * 60
          : expiration * 60 * 60;

      if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
        setError("Enter a valid expiration window.");
        return;
      }

      if (email.trim() && !isValidEmail(email.trim())) {
        setError("Enter a valid email address.");
        return;
      }

      if (!resolvedRecipientAddress) {
        setError("Save a settlement wallet in Settings or connect a wallet first.");
        return;
      }

      if (!merchantReady) {
        setError("Complete Settings first with a valid business name, display name, and email address before creating invoices.");
        return;
      }

      setSubmitting(true);

      try {
        const response = await fetch("/api/invoices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: connectedAddress,
            amount: numericAmount,
            currency,
            description,
            customerName: customer,
            customerEmail: email,
            recipientAddress: resolvedRecipientAddress,
            expiresInSeconds,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Failed to prepare invoice.");
        }

        const preparedInvoice = payload.data.invoice;
        const contractIntent = payload.data.contractIntent as StackPayContractIntent;

        await submitContractIntent(contractIntent, {
          onCancel: () => {
            setError("Contract call was canceled.");
            setSubmitting(false);
          },
          onFinish: async ({ txId }) => {
            try {
              setResult({
                title: "Awaiting confirmation",
                summary: "Transaction broadcast. Waiting for the chain to confirm and return the invoice id.",
                contractIntent,
                storage: "Stacks pending",
                txId,
              });

              const chain = await confirmInvoiceFromChain({
                txId,
                amount: preparedInvoice.amount,
                currency,
                description: preparedInvoice.description,
                customerName: preparedInvoice.customer_name,
                customerEmail: preparedInvoice.customer_email,
                recipientAddress: preparedInvoice.recipient_address,
                expiresInSeconds: preparedInvoice.expires_in_seconds,
              });

              setResult({
                title: chain.onchainInvoiceId ?? "Invoice created",
                href: chain.onchainInvoiceId ? `/pay/${chain.onchainInvoiceId}` : undefined,
                summary: chain.onchainInvoiceId
                  ? "Invoice created on-chain and stored in Supabase. The hosted link now uses the on-chain invoice id."
                  : "Transaction is still pending confirmation. The invoice will be stored once the chain returns the id.",
                contractIntent,
                storage: chain.onchainInvoiceId ? "Supabase + Stacks" : "Stacks pending",
                txId,
                onchainInvoiceId: chain.onchainInvoiceId,
              });
              if (chain.onchainInvoiceId) {
                setSuccessMessage("Invoice generated successfully.");
                resetCreateForm();
              }
            } catch (syncError) {
              setError(syncError instanceof Error ? syncError.message : "Failed to confirm invoice transaction.");
            } finally {
              setSubmitting(false);
            }
          },
        });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to create invoice.");
        setSubmitting(false);
      }

      return;
    }

    if (!connectedAddress) {
      setError("Connect a merchant wallet before creating a MultiPay route.");
      return;
    }

    if (!merchantReady) {
      setError("Complete Settings first with a valid business name, display name, and email address.");
      return;
    }

    if (email.trim() && !isValidEmail(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: connectedAddress,
          kind: "multipay",
          recipientAddress: resolvedRecipientAddress,
          slug: slugify(slug || `${merchantProfile?.slug || ""}-multipay`),
          title: title || "MultiPay route",
          description,
          defaultCurrency: currency,
          acceptedCurrencies: [currency],
          defaultAmount: Number(amount || 0) || null,
          amountStep: Number(amountStep || 0) || null,
          allowCustomAmount: true,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to prepare payment link.");
      }

      const paymentLink = payload.data.paymentLink;
      const contractIntent = payload.data.contractIntent as StackPayContractIntent;

      await submitContractIntent(contractIntent, {
        onCancel: () => {
          setError("Contract call was canceled.");
          setSubmitting(false);
        },
        onFinish: async ({ txId }) => {
          try {
            setResult({
              title: paymentLink.slug,
              summary: "Transaction broadcast. Waiting for the chain to confirm the payment link.",
              contractIntent,
              storage: "Stacks pending",
              txId,
            });

            const chainLink = await confirmPaymentLinkFromChain(paymentLink.id, txId);
            setResult({
              title: chainLink?.onchain_link_id ?? paymentLink.slug,
              href: `/pay/link/${paymentLink.slug}`,
              summary: "MultiPay route created and stored. Customers can now use this public route to generate invoices and pay.",
              contractIntent,
              storage: "Supabase + Stacks",
              txId,
            });
            setSuccessMessage("MultiPay route created successfully.");
            resetCreateForm();
          } catch (syncError) {
            setError(syncError instanceof Error ? syncError.message : "Failed to confirm payment link.");
          } finally {
            setSubmitting(false);
          }
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create MultiPay route.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Create Invoice"
        subtitle="Choose between a standard single-payment invoice and a reusable MultiPay route."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="border border-white/20">
          <div className="space-y-5">
            <div>
              <div className="mt-3 flex flex-wrap gap-3">
                {flows.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFlow(item.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${flow === item.id
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-white/55">
                {flows.find((item) => item.id === flow)?.summary}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">
                  {flow === "multipay" ? "Default amount" : "Amount"}
                </label>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    className="w-full bg-transparent text-sm text-white/80 outline-none"
                    value={amount}
                    onChange={(event) => setAmount(sanitizeDecimalInput(event.target.value))}
                    placeholder={flow === "multipay" ? "Starting checkout amount" : "Invoice amount"}
                    inputMode="decimal"
                  />
                  <span className="text-xs text-white/55">{currency}</span>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Currency</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {currencies.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCurrency(item)}
                      className={`rounded-full px-3 py-2 text-xs transition ${currency === item
                          ? "border border-white/20 bg-white text-black"
                          : "border border-white/10 bg-white/5 text-white/70"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {flow === "standard" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Customer</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                      placeholder="Customer or company"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Email</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="billing@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Expiration</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expirations.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setExpiration(item.hours)}
                        className={`rounded-full px-3 py-2 text-xs transition ${expiration === item.hours
                            ? "border border-white/20 bg-white text-black"
                            : "border border-white/10 bg-white/5 text-white/70"
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {expiration === "custom" ? (
                    <>
                      <div className="mt-3 max-w-xs">
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                          value={customExpirationValue}
                          onChange={(event) => setCustomExpirationValue(event.target.value)}
                          placeholder="5"
                        />
                      </div>
                      <div className="mt-3 max-w-xs">
                        <div className="grid grid-cols-3 gap-2">
                          {(["minutes", "hours", "days"] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => setCustomExpirationUnit(unit)}
                              className={`rounded-full px-3 py-2 text-xs transition ${customExpirationUnit === unit
                                  ? "border border-white/20 bg-white text-black"
                                  : "border border-white/10 bg-white/5 text-white/70"
                                }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-white/45">
                        Custom expiry is a duration from now. Choose the value and whether it is in minutes, hours, or days.
                      </div>
                    </>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Description</label>
                  <textarea
                    className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What the customer is paying for"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Link title</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Countertop checkout"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Public slug</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={slug}
                      onChange={(event) => setSlug(slugify(event.target.value))}
                      placeholder="countertop-checkout"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Amount step</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={amountStep}
                      onChange={(event) => setAmountStep(sanitizeDecimalInput(event.target.value))}
                      placeholder="Plus/minus increment"
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Description</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Short note shown on hosted checkout"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  MultiPay links stay active after each payment. Every customer session creates its own invoice,
                  so you can reuse the same route for ongoing payments.
                </div>
              </>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Recipient</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {resolvedRecipientAddress ? truncateAddress(resolvedRecipientAddress) : "No wallet configured"}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Merchant</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {merchantName || "Complete Settings first"}
                </div>
              </div>
            </div>

            {flow === "standard" && !merchantReady ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Set up your profile in{" "}
                <Link href="/profile" className="text-white underline underline-offset-4">
                  Profile
                </Link>{" "}
                first before creating invoices.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void submit()}
                disabled={submitting || (flow === "standard" && !merchantReady)}
                className="button-glow rounded-full border border-white/50 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (flow === "standard" ? "Generating..." : "Creating...") : flow === "standard" ? "Generate invoice" : "Create MultiPay route"}
              </button>
            </div>

            {flow === "standard" && !connectedAddress && (
              <div className="text-xs text-white/45">
                Connect a Stacks wallet first. StackPay only stores the invoice after the contract succeeds and returns the on-chain invoice id.
              </div>
            )}

            {successMessage ? <div className="text-sm text-emerald-300">{successMessage}</div> : null}
            {error ? <div className="text-sm text-red-300">{error}</div> : null}
          </div>
        </GlassCard>

        <div className="space-y-3">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Hosted preview</div>
            <div className="mt-3 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-semibold text-white">
                {flow === "standard" ? customer || "New invoice" : title || "MultiPay route"}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {flow === "standard"
                  ? `Single payment · ${formatCurrencyAmount(Number(amount || 0), currency)}`
                  : `Reusable route · starts at ${formatCurrencyAmount(Number(amount || 0), currency)}`}
              </div>
              <div className="mt-5">
                <QrPreview
                  caption={flow === "standard" ? "Invoice link" : "Payment link"}
                  label={previewLabel}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Distribution</div>
            <div className="mt-3 space-y-3">
              <button
                onClick={handleCopy}
                disabled={!result?.href}
                className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 disabled:opacity-50"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <Link
                href={result?.href ?? "#"}
                className={`flex w-full items-center justify-center rounded-full border px-4 py-3 text-xs ${result?.href
                    ? "border-white/35 bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/45"
                  }`}
              >
                {result?.href ? "Open generated invoice" : "Generated invoice appears here"}
              </Link>
            </div>
          </GlassCard>

          {/* {result ? (
            <GlassCard className="border border-white/20">
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Generated result</div>
              <div className="mt-3 text-sm text-white/75">{result.summary}</div>
              <div className="mt-3 text-sm text-white">{result.title}</div>
              {result.href ? <div className="mt-3 font-mono text-xs text-white/55">{result.href}</div> : null}
              {result.storage ? (
                <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">
                  Stored in {result.storage}
                </div>
              ) : null}
              {result.txId ? (
                <div className="mt-3 font-mono text-xs text-white/55">tx: {result.txId}</div>
              ) : null}
              {result.onchainInvoiceId ? (
                <div className="mt-2 font-mono text-xs text-white/55">
                  on-chain invoice id: {result.onchainInvoiceId}
                </div>
              ) : null}
              {result.contractIntent ? (
                <>
                  <div className="mt-4 text-[11px] uppercase tracking-[0.26em] text-white/40">Contract intent</div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-white">
                      {result.contractIntent.contractId} :: {result.contractIntent.functionName}
                    </div>
                    <div className="mt-2 text-xs text-white/50">
                      Network: {result.contractIntent.network}
                    </div>
                    <pre className="mt-3 overflow-x-auto text-xs text-white/60">
                      {JSON.stringify(result.contractIntent.arguments, null, 2)}
                    </pre>
                  </div>
                </>
              ) : null}
            </GlassCard>
          ) : null} */}
        </div>
      </div>
    </div>
  );
}
