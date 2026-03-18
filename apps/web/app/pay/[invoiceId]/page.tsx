"use client";

import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import ConnectWalletButton from "@/components/app/ConnectWalletButton";
import StatusBadge from "@/components/app/StatusBadge";
import {
  formatCurrencyAmount,
  formatDateTime,
  useDemo,
} from "@/components/app/DemoProvider";
import { getConnectedWalletAddress } from "@/lib/stacks";

export default function HostedPaymentPage({
  params,
}: {
  params: { invoiceId: string };
}) {
  const { state, actions } = useDemo();
  const invoice = state.invoices.find((item) => item.id === params.invoiceId);
  const receipt = state.receipts.find((item) => item.invoiceId === params.invoiceId);
  const connectedAddress = getConnectedWalletAddress();

  if (!invoice) {
    return (
      <main className="flex min-h-screen items-center px-6 py-12">
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
    <main className="flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <GlassCard className="border border-white/20">
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="text-xs uppercase tracking-[0.35em] text-white/40">Hosted payment</div>
              <h1 className="text-4xl font-semibold text-white">{state.merchant.businessName}</h1>
              <p className="mx-auto max-w-xl text-sm text-white/60">
                Review the invoice summary, connect a wallet, and complete payment. This demo writes the
                result back into the merchant dashboard, explorer, receipts, and webhook log.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                    Invoice {invoice.id}
                  </div>
                  <div className="mt-3 text-4xl font-semibold text-white">
                    {formatCurrencyAmount(invoice.amount, invoice.currency)}
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

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Description</div>
                  <div className="mt-2 text-sm text-white/75">{invoice.description}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Customer</div>
                  <div className="mt-2 text-sm text-white/75">{invoice.customer}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Expires</div>
                  <div className="mt-2 text-sm text-white/75">
                    {invoice.expiresAt ? formatDateTime(invoice.expiresAt) : "No expiry"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Wallet checkout</div>
              <div className="mt-4 flex flex-col items-center gap-4 text-center">
                <div className="max-w-md text-sm text-white/65">
                  {connectedAddress
                    ? `Connected wallet ${connectedAddress}`
                    : "Connect a Stacks wallet to simulate the payment confirmation step."}
                </div>
                <ConnectWalletButton />
                <button
                  onClick={() =>
                    actions.markInvoicePaid(
                      invoice.id,
                      connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Connected wallet"
                    )
                  }
                  disabled={disabled}
                  className="w-full max-w-sm rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {invoice.status === "paid"
                    ? "Payment complete"
                    : invoice.status === "expired"
                      ? "Invoice expired"
                      : "Confirm payment"}
                </button>
                {receipt ? (
                  <div className="w-full max-w-sm rounded-2xl bg-white/8 px-4 py-4 text-sm text-white/75">
                    Receipt {receipt.id} issued at {formatDateTime(receipt.timestamp)}.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white/70"
              >
                View dashboard
              </Link>
              <Link
                href="/explorer"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white/70"
              >
                Verify in explorer
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
