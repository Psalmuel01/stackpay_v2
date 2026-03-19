"use client";

import { useEffect, useState } from "react";
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
  const [remoteInvoice, setRemoteInvoice] = useState<any | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const localInvoice = state.invoices.find((item) => item.id === params.invoiceId) ?? null;
  const invoice = localInvoice ?? remoteInvoice;
  const receipt = state.receipts.find((item) => item.invoiceId === params.invoiceId);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const merchantName =
    remoteInvoice?.merchant?.company_name ||
    remoteInvoice?.merchant?.display_name ||
    state.merchant.businessName;

  useEffect(() => {
    setConnectedAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (state.invoices.find((item) => item.id === params.invoiceId)) {
      setRemoteInvoice(null);
      return;
    }

    let cancelled = false;
    setLoadingRemote(true);

    fetch(`/api/invoices/${params.invoiceId}`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        return payload.data;
      })
      .then((payload) => {
        if (!cancelled) {
          setRemoteInvoice(payload);
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
  }, [params.invoiceId, state.invoices]);

  if (!invoice) {
    return (
      <main className="flex min-h-screen items-center px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <GlassCard>
            <div className="text-3xl font-semibold text-white">Invoice not found</div>
            <div className="mt-3 text-sm text-white/60">
              {loadingRemote
                ? "Looking up the invoice in StackPay storage."
                : "This checkout could not find a matching invoice locally or in Supabase."}
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

  const isRemoteOnly = !localInvoice && Boolean(remoteInvoice);
  const disabled = isRemoteOnly || invoice.status !== "pending";

  return (
    <main className="flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <GlassCard className="border border-white/20">
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="text-xs uppercase tracking-[0.35em] text-white/40">Hosted payment</div>
              <h1 className="text-4xl font-semibold text-white">{merchantName}</h1>
              <p className="mx-auto max-w-xl text-sm text-white/60">
                Review the invoice summary, connect a wallet, and complete payment.
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
                  <div className="mt-2 text-sm text-white/75">
                    {invoice.customer ?? invoice.customer_name ?? "No customer label"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Expires</div>
                  <div className="mt-2 text-sm text-white/75">
                    {invoice.expiresAt || invoice.expires_at
                      ? formatDateTime(invoice.expiresAt ?? invoice.expires_at)
                      : "No expiry"}
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
                      : isRemoteOnly
                        ? "Awaiting hosted payment integration"
                      : "Confirm payment"}
                </button>
                {receipt ? (
                  <div className="w-full max-w-sm rounded-2xl bg-white/8 px-4 py-4 text-sm text-white/75">
                    Receipt {receipt.id} issued at {formatDateTime(receipt.timestamp)}.
                  </div>
                ) : null}
                {invoice.onchain_invoice_id ? (
                  <div className="w-full max-w-sm rounded-2xl bg-white/8 px-4 py-4 text-sm text-white/75">
                    On-chain invoice id {invoice.onchain_invoice_id}
                  </div>
                ) : null}
                {isRemoteOnly ? (
                  <div className="max-w-md text-xs text-white/45">
                    This invoice was loaded from Supabase by id. Customer payment confirmation on this hosted page
                    still needs the real on-chain payment integration.
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
                href="/invoices"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white/70"
              >
                View invoices
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
