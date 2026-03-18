"use client";

import Link from "next/link";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import ConnectWalletButton from "@/components/app/ConnectWalletButton";
import StatusBadge from "@/components/app/StatusBadge";
import {
  formatCurrencyAmount,
  formatDateTime,
  useDemo,
} from "@/components/app/DemoProvider";

export default function HostedPaymentPage({
  params,
}: {
  params: { invoiceId: string };
}) {
  const { state, actions } = useDemo();
  const [payerName, setPayerName] = useState("Xverse wallet");
  const invoice = state.invoices.find((item) => item.id === params.invoiceId);
  const receipt = state.receipts.find((item) => item.invoiceId === params.invoiceId);

  if (!invoice) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <GlassCard>
            <div className="text-3xl font-semibold text-white">Invoice not found</div>
            <div className="mt-3 text-sm text-white/60">
              This demo checkout only knows about invoices created in the current local workspace.
            </div>
            <Link
              href="/create-invoice"
              className="mt-5 inline-flex rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Create a new invoice
            </Link>
          </GlassCard>
        </div>
      </main>
    );
  }

  const disabled = invoice.status !== "pending";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Hosted payment</div>
            <h1 className="text-4xl font-semibold text-white">Invoice {params.invoiceId}</h1>
            <p className="max-w-2xl text-sm text-white/60 md:text-base">
              This is the working handoff from invoice creation into customer checkout. Paying here updates
              the dashboard, explorer, balances, receipts, and webhook log in one shared demo state.
            </p>
          </div>

          <GlassCard className="border border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Merchant</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {state.merchant.businessName}
                </div>
              </div>
              <StatusBadge
                label={
                  invoice.status === "paid"
                    ? "Paid"
                    : invoice.status === "expired"
                      ? "Expired"
                      : invoice.status === "draft"
                        ? "Draft"
                        : "Pending"
                }
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Amount</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {formatCurrencyAmount(invoice.amount, invoice.currency)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Description</div>
                <div className="mt-2 text-sm text-white/75">{invoice.description}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Customer</div>
                <div className="mt-2 text-sm text-white/75">{invoice.customer}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Created</div>
                <div className="mt-2 text-sm text-white/75">{formatDateTime(invoice.createdAt)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Expires</div>
                <div className="mt-2 text-sm text-white/75">
                  {invoice.expiresAt ? formatDateTime(invoice.expiresAt) : "No expiry"}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Checkout</div>
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <input
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                placeholder="Payer label"
              />
              <ConnectWalletButton />
              <button
                onClick={() => actions.markInvoicePaid(invoice.id, payerName)}
                disabled={disabled}
                className="w-full rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {invoice.status === "paid"
                  ? "Already paid"
                  : invoice.status === "expired"
                    ? "Invoice expired"
                    : "Pay invoice"}
              </button>
              {receipt ? (
                <div className="rounded-2xl border border-white/20 bg-accent/5 px-4 py-4 text-sm text-white/75">
                  Receipt {receipt.id} issued at {formatDateTime(receipt.timestamp)}.
                </div>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Next steps</div>
            <div className="mt-4 space-y-3">
              <Link
                href="/dashboard"
                className="flex rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70"
              >
                Review balances and webhook effects on the dashboard
              </Link>
              <Link
                href={`/explorer`}
                className="flex rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70"
              >
                Verify the invoice and receipt inside Explorer
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
