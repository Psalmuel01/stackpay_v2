"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import QrPreview from "@/components/app/QrPreview";
import {
  formatCurrencyAmount,
  useDemo,
} from "@/components/app/DemoProvider";

export default function PublicPaymentLinkPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const { state, actions } = useDemo();
  const link = state.paymentLinks.find((item) => item.slug === params.slug && item.isActive);
  const linkedPlan = state.plans.find((item) => item.id === link?.planId);
  const [email, setEmail] = useState("customer@example.com");
  const [customer, setCustomer] = useState("Acme Inc");
  const [seats, setSeats] = useState("1");
  const suggestedAmounts = link?.suggestedAmounts ?? [];
  const [amount, setAmount] = useState(() => String(suggestedAmounts[0] ?? ""));
  const pageSummary = useMemo(() => {
    if (!link) {
      return "";
    }
    if (link.mode === "invoice") {
      return "Open the fixed invoice and continue straight into the hosted payment screen.";
    }
    if (link.mode === "subscription") {
      return "Capture minimal customer info, then create the subscriber record and hand off recurring billing to the merchant workspace.";
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
      customer: link.mode === "donation" ? "Public checkout supporter" : customer,
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
            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Public payment link</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">{link.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60">
              {pageSummary}
            </p>
          </div>

          <GlassCard className="border border-white/20">
            <QrPreview label={`stackpay.app/pay/link/${link.slug}`} />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Details</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                Merchant: {state.merchant.businessName}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                Mode: {link.mode}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                Currency: {link.currency}
              </div>
              {link.description ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                  {link.description}
                </div>
              ) : null}
              {linkedPlan ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                  Plan: {linkedPlan.name} · {formatCurrencyAmount(linkedPlan.amount, linkedPlan.currency)}
                </div>
              ) : null}
              {link.mode === "donation" && suggestedAmounts.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                  Suggested amounts:{" "}
                  {suggestedAmounts
                    .map((item) => formatCurrencyAmount(item, link.currency))
                    .join(" · ")}
                </div>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Continue</div>
            <div className="mt-4 space-y-3">
              {link.mode === "donation" ? (
                <>
                  {suggestedAmounts.length ? (
                    <div className="grid grid-cols-3 gap-2">
                      {suggestedAmounts.map((item) => {
                        const selected = Number(amount) === item;
                        return (
                          <button
                            key={item}
                            onClick={() => setAmount(String(item))}
                            className={`rounded-full px-4 py-3 text-sm transition ${
                              selected
                                ? "border border-white/20 bg-white text-black"
                                : "border border-white/10 bg-white/5 text-white/70"
                            }`}
                          >
                            {formatCurrencyAmount(item, link.currency)}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {link.allowCustomAmount ? (
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="Custom amount"
                    />
                  ) : null}
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
                      placeholder="Seats"
                    />
                  </div>
                </>
              ) : link.mode === "donation" ? (
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Receipt email (optional)"
                />
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
                href="/explorer"
                className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70"
              >
                Inspect in explorer
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
