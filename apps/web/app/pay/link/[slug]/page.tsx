"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import {
  type Currency,
  formatCurrencyAmount,
  useDemo,
} from "@/components/app/DemoProvider";

type RemotePaymentLink = {
  kind: "invoice" | "multipay" | "subscription";
  slug: string;
  title: string;
  description: string;
  accepted_currencies?: Currency[];
  default_currency?: Currency | null;
  default_amount?: number | null;
  amount_step?: number | null;
  allow_custom_amount?: boolean;
  is_universal?: boolean;
  merchant?: {
    company_name?: string;
    display_name?: string;
    settlement_wallet?: string;
  } | null;
};

function defaultAmountConfig(currency: Currency) {
  if (currency === "sBTC") {
    return { defaultAmount: 0.01, amountStep: 0.005 };
  }
  if (currency === "STX") {
    return { defaultAmount: 50, amountStep: 25 };
  }
  return { defaultAmount: 25, amountStep: 25 };
}

function normalizeAmount(value: number, step: number, delta: number) {
  const next = value + step * delta;
  return Math.max(step > 0 ? step : 0, Math.round(next * 1000) / 1000);
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function PublicPaymentLinkPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const { state, actions } = useDemo();
  const [remoteLink, setRemoteLink] = useState<RemotePaymentLink | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(true);

  const localLink = state.paymentLinks.find((item) => item.slug === params.slug && item.isActive);
  const linkedPlan = state.plans.find((item) => item.id === localLink?.planId);

  useEffect(() => {
    let cancelled = false;
    setLoadingRemote(true);

    fetch(`/api/payment-links/public/${params.slug}`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = await response.json();
        return (payload.data ?? null) as RemotePaymentLink | null;
      })
      .then((payload) => {
        if (!cancelled) {
          setRemoteLink(payload);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRemote(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const link = localLink
    ? {
        source: "local" as const,
        mode: localLink.mode,
        title: localLink.title,
        description: localLink.description,
        acceptedCurrencies: localLink.acceptedCurrencies ?? [localLink.currency],
        currency: localLink.currency,
        defaultAmount: localLink.defaultAmount,
        amountStep: localLink.amountStep,
        allowCustomAmount: localLink.allowCustomAmount,
        invoiceId: localLink.invoiceId,
        slug: localLink.slug,
        merchantName: state.merchant.businessName,
        settlementWallet: state.merchant.settlementWallet,
        isUniversal: localLink.isUniversal,
      }
    : remoteLink
      ? {
          source: "remote" as const,
          mode: remoteLink.kind,
          title: remoteLink.title,
          description: remoteLink.description,
          acceptedCurrencies: remoteLink.accepted_currencies ?? (remoteLink.default_currency ? [remoteLink.default_currency] : ["sBTC", "STX", "USDCx"]),
          currency: remoteLink.default_currency ?? "sBTC",
          defaultAmount: remoteLink.default_amount ?? null,
          amountStep: remoteLink.amount_step ?? null,
          allowCustomAmount: remoteLink.allow_custom_amount ?? true,
          invoiceId: null,
          slug: remoteLink.slug,
          merchantName: remoteLink.merchant?.company_name || remoteLink.merchant?.display_name || "Merchant",
          settlementWallet: remoteLink.merchant?.settlement_wallet || "",
          isUniversal: remoteLink.is_universal ?? false,
        }
      : null;

  const availableCurrencies = link?.acceptedCurrencies ?? [];
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("sBTC");
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState("");
  const [seats, setSeats] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!link) {
      setSelectedCurrency("sBTC");
      setAmount("");
      return;
    }

    const initialCurrency = (availableCurrencies[0] ?? link.currency ?? "sBTC") as Currency;
    const defaults = defaultAmountConfig(initialCurrency);
    setSelectedCurrency(initialCurrency);
    setAmount(String(link.defaultAmount ?? defaults.defaultAmount));
  }, [link?.slug]);

  const amountStep = link?.amountStep ?? defaultAmountConfig(selectedCurrency).amountStep;

  const pageSummary = useMemo(() => {
    if (!link) {
      return "";
    }
    if (link.mode === "invoice") {
      return "Open the fixed invoice and continue directly into hosted checkout.";
    }
    if (link.mode === "subscription") {
      return "Capture a company name and billing email, then create the subscriber record for the selected plan.";
    }
    if (link.source === "remote") {
      return link.isUniversal
        ? "Permanent universal payment route. Customers can choose the asset and amount here."
        : "Public MultiPay route.";
    }
    return link.description || "Choose an asset, adjust the amount, generate a fresh invoice, and continue into hosted checkout.";
  }, [link]);

  if (!link) {
    return (
      <main className="flex min-h-screen items-center px-6 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <GlassCard>
            <div className="text-3xl font-semibold text-white">Payment link not found</div>
            <div className="mt-3 text-sm text-white/60">
              {loadingRemote
                ? "Looking up the public route."
                : "This public payment route could not be found."}
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  function adjustAmount(delta: number) {
    if (!link) {
      return;
    }

    const defaults = defaultAmountConfig(selectedCurrency);
    const base = Number(amount || link.defaultAmount || defaults.defaultAmount || 0);
    setAmount(String(normalizeAmount(base, amountStep, delta)));
  }

  function handleContinue() {
    if (!link) {
      return;
    }

    if (link.mode === "invoice" && link.invoiceId) {
      router.push(`/pay/${link.invoiceId}`);
      return;
    }

    if (link.source === "remote") {
      return;
    }

    if (link.mode === "subscription") {
      const subscription = actions.enrollFromLink({
        slug: link.slug,
        customer,
        email,
        seats: Number(seats || 1),
      });
      if (subscription) {
        router.push("/subscriptions");
      }
      return;
    }

    const invoice = actions.createInvoiceFromLink({
      slug: link.slug,
      customer: "MultiPay customer",
      email,
      amount: Number(amount || 0),
      currency: selectedCurrency,
    });
    if (invoice) {
      router.push(`/pay/${invoice.id}`);
    }
  }

  return (
    <main className="flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-white/40">
              {link.isUniversal ? "Hosted universal QR route" : "Hosted payment route"}
            </div>
            <h1 className="mt-3 text-4xl font-semibold text-white">{link.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60">{pageSummary}</p>
          </div>

          <GlassCard className="border border-white/20">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                Merchant: {link.merchantName}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                Assets: {availableCurrencies.join(", ")}
              </div>
              {link.settlementWallet ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  Settlement wallet: {truncateAddress(link.settlementWallet)}
                </div>
              ) : null}
              {linkedPlan ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  Plan: {linkedPlan.name} · {formatCurrencyAmount(linkedPlan.amount, linkedPlan.currency)}
                </div>
              ) : null}
              {link.description ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  {link.description}
                </div>
              ) : null}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="border border-white/20">
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Checkout</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {link.mode === "subscription" ? "Start subscription" : "Complete payment"}
          </div>

          <div className="mt-6 space-y-3">
            {link.mode === "multipay" ? (
              <>
                {availableCurrencies.length > 1 ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Pay with</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {availableCurrencies.map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setSelectedCurrency(item);
                            setAmount(String(defaultAmountConfig(item).defaultAmount));
                          }}
                          className={`rounded-full px-4 py-3 text-sm transition ${
                            selectedCurrency === item
                              ? "border border-white/20 bg-white text-black"
                              : "border border-white/10 bg-white/5 text-white/70"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Amount</div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => adjustAmount(-1)}
                      className="h-12 w-12 rounded-full border border-white/10 bg-black/20 text-xl text-white/75"
                    >
                      -
                    </button>
                    <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-lg font-semibold text-white">
                      {amount ? formatCurrencyAmount(Number(amount), selectedCurrency) : `0 ${selectedCurrency}`}
                    </div>
                    <button
                      onClick={() => adjustAmount(1)}
                      className="h-12 w-12 rounded-full border border-white/10 bg-black/20 text-xl text-white/75"
                    >
                      +
                    </button>
                  </div>
                  {link.allowCustomAmount ? (
                    <input
                      className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder={`Enter amount in ${selectedCurrency}`}
                    />
                  ) : null}
                </div>

                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Receipt email (optional)"
                />
              </>
            ) : null}

            {link.mode === "subscription" ? (
              <>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="Company or team name"
                />
                <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Billing email"
                  />
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                    value={seats}
                    onChange={(event) => setSeats(event.target.value)}
                    placeholder="1"
                  />
                </div>
              </>
            ) : null}

            {link.source === "remote" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                This public route is live and correctly branded, but automated invoice generation from remote public payment links is the next integration step.
              </div>
            ) : null}

            <button
              onClick={handleContinue}
              disabled={link.source === "remote"}
              className="w-full rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {link.mode === "subscription"
                ? "Start subscription"
                : link.mode === "multipay"
                  ? link.source === "remote"
                    ? "Public payment generation coming next"
                    : "Generate invoice"
                  : "Open invoice"}
            </button>

            <Link
              href="/invoices"
              className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70"
            >
              View merchant records
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
