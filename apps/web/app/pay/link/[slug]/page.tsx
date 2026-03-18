"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import {
  formatCurrencyAmount,
  useDemo,
} from "@/components/app/DemoProvider";

function normalizeAmount(value: number, step: number, delta: number) {
  const next = value + step * delta;
  return Math.max(step > 0 ? step : 0, Math.round(next * 1000) / 1000);
}

export default function PublicPaymentLinkPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const { state, actions } = useDemo();
  const link = state.paymentLinks.find((item) => item.slug === params.slug && item.isActive);
  const linkedPlan = state.plans.find((item) => item.id === link?.planId);
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState("");
  const [seats, setSeats] = useState("");
  const [amount, setAmount] = useState(() => String(link?.defaultAmount ?? ""));
  const amountStep = link?.amountStep ?? 1;

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
    return link.description || "Choose an amount, generate a one-time invoice, and continue into hosted checkout.";
  }, [link]);

  if (!link) {
    return (
      <main className="flex min-h-screen items-center px-6 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <GlassCard>
            <div className="text-3xl font-semibold text-white">Payment link not found</div>
            <div className="mt-3 text-sm text-white/60">
              The merchant has not created this public route in the current demo workspace.
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
    const base = Number(amount || link.defaultAmount || 0);
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
      customer: "Public checkout supporter",
      email,
      amount: Number(amount || 0),
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
            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Hosted payment link</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">{link.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60">{pageSummary}</p>
          </div>

          <GlassCard className="border border-white/20">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                Merchant: {state.merchant.businessName}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                Asset: {link.currency}
              </div>
              {linkedPlan ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                  Plan: {linkedPlan.name} · {formatCurrencyAmount(linkedPlan.amount, linkedPlan.currency)}
                </div>
              ) : null}
              {link.description ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
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
            {link.mode === "donation" ? (
              <>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Amount</div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => adjustAmount(-1)}
                      className="h-12 w-12 rounded-full border border-white/10 bg-black/20 text-xl text-white/75"
                    >
                      -
                    </button>
                    <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-lg font-semibold text-white">
                      {amount ? formatCurrencyAmount(Number(amount), link.currency) : `0 ${link.currency}`}
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
                      placeholder="Enter custom amount"
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

            <button
              onClick={handleContinue}
              className="w-full rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              {link.mode === "subscription"
                ? "Start subscription"
                : link.mode === "donation"
                  ? "Generate invoice"
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
