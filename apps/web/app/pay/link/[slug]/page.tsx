"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [customer, setCustomer] = useState("Walk-in customer");
  const [email, setEmail] = useState("customer@example.com");
  const [amount, setAmount] = useState("0.01");
  const link = state.paymentLinks.find((item) => item.slug === params.slug && item.isActive);
  const linkedPlan = state.plans.find((item) => item.id === link?.planId);

  if (!link) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl">
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
      });
      if (subscription) {
        router.push("/subscriptions");
      }
      return;
    }

    const invoice = actions.createInvoiceFromLink({
      slug: link.slug,
      customer,
      email,
      amount: Number(amount || 0),
    });
    if (invoice) {
      router.push(`/pay/${invoice.id}`);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Public payment link</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">{link.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60">
              This route resolves the merchant QR/link surface. It can send users into a fixed invoice,
              generate a donation invoice, or enroll a subscription depending on link mode.
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
              {linkedPlan ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                  Plan: {linkedPlan.name} · {formatCurrencyAmount(linkedPlan.amount, linkedPlan.currency)}
                </div>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Continue</div>
            <div className="mt-4 space-y-3">
              {link.mode === "donation" ? (
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Donation amount"
                />
              ) : null}
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Customer name"
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Customer email"
              />
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
