"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import { formatCurrencyAmount, formatDateTime } from "@/components/app/DemoProvider";
import { getConnectedWalletAddress } from "@/lib/stacks";

type Filter = "all" | "pending" | "paid" | "expired";

type RemoteInvoice = {
  onchain_invoice_id: string;
  status: "pending" | "paid" | "expired";
  amount: number;
  currency: "sBTC" | "STX" | "USDCx";
  description: string;
  customer_name: string;
  customer_email: string;
  expires_at: string | null;
  paid_at: string | null;
  created_at?: string | null;
};

function getEffectiveStatus(invoice: RemoteInvoice, nowMs: number) {
  if (invoice.status !== "pending") {
    return invoice.status;
  }

  const expiresAtMs = invoice.expires_at ? Date.parse(invoice.expires_at) : Number.NaN;
  if (Number.isFinite(expiresAtMs) && expiresAtMs <= nowMs) {
    return "expired";
  }

  return "pending";
}

export default function InvoicesPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [remoteInvoices, setRemoteInvoices] = useState<RemoteInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setConnectedAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!connectedAddress) {
      setRemoteInvoices([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/invoices?walletAddress=${encodeURIComponent(connectedAddress)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return [];
        }

        const payload = await response.json();
        return (payload.data ?? []) as RemoteInvoice[];
      })
      .then((rows) => {
        if (!cancelled) {
          setRemoteInvoices(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteInvoices([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  const invoices = useMemo(() => {
    return remoteInvoices
      .map((invoice) => {
        const effectiveStatus = getEffectiveStatus(invoice, nowMs);
        return {
          ...invoice,
          effectiveStatus,
        };
      })
      .filter((invoice) => {
        const matchesFilter = filter === "all" ? true : invoice.effectiveStatus === filter;
        const haystack = [
          invoice.onchain_invoice_id,
          invoice.customer_name,
          invoice.customer_email,
          String(invoice.amount),
          invoice.currency,
          invoice.description,
        ]
          .join(" ")
          .toLowerCase();
        return matchesFilter && haystack.includes(query.toLowerCase());
      });
  }, [filter, nowMs, query, remoteInvoices]);

  const emptyLabel = !connectedAddress
    ? "Connect a wallet to load invoice records."
    : loading
      ? "Loading invoices."
      : "No invoices yet.";

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Live invoice records for the connected merchant wallet."
      />

      <GlassCard className="border border-white/20">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "paid", "expired"] as Filter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-full px-4 py-2 text-xs uppercase transition ${filter === tab
                    ? "border border-white/20 bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/70"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <input
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 outline-none lg:w-80"
            placeholder="Search invoices"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <div className="text-sm text-white/70">{emptyLabel}</div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-white/10 lg:block">
              <div className="grid grid-cols-[1.25fr_0.95fr_0.75fr_0.7fr_0.95fr_100px] gap-6 bg-white/5 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
                <div>Invoice</div>
                <div>Customer</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Timeline</div>
                <div>Open</div>
              </div>

              <div className="divide-y divide-white/10">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.onchain_invoice_id}
                    className="grid grid-cols-[1.25fr_0.95fr_0.75fr_0.7fr_0.95fr_100px] gap-6 px-6 py-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{invoice.onchain_invoice_id}</div>
                      <div className="mt-2 text-xs text-white/45">
                        {invoice.description || "No description"}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-white/78">
                        {invoice.customer_name || "Customer"}
                      </div>
                      <div className="mt-1 text-xs text-white/40">
                        {invoice.customer_email || "No email"}
                      </div>
                    </div>

                    <div className="text-sm font-medium text-white">
                      {formatCurrencyAmount(Number(invoice.amount), invoice.currency)}
                    </div>

                    <div className="flex items-start">
                      <StatusBadge
                        label={
                          invoice.effectiveStatus === "paid"
                            ? "Paid"
                            : invoice.effectiveStatus === "expired"
                              ? "Expired"
                              : "Pending"
                        }
                      />
                    </div>

                    <div className="text-xs text-white/45">
                      {invoice.effectiveStatus === "paid"
                        ? `Paid ${formatDateTime(invoice.paid_at)}`
                        : invoice.expires_at
                          ? `Expires ${formatDateTime(invoice.expires_at)}`
                          : "No expiry"}
                    </div>

                    <div>
                      <Link
                        href={`/pay/${invoice.onchain_invoice_id}`}
                        className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {invoices.map((invoice) => (
                <div
                  key={invoice.onchain_invoice_id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{invoice.onchain_invoice_id}</div>
                      <div className="mt-1 text-sm text-white/60">
                        {invoice.customer_name || "Customer"}
                      </div>
                    </div>
                    <StatusBadge
                      label={
                        invoice.effectiveStatus === "paid"
                          ? "Paid"
                          : invoice.effectiveStatus === "expired"
                            ? "Expired"
                            : "Pending"
                      }
                    />
                  </div>

                  <div className="mt-3 text-sm text-white/75">
                    {formatCurrencyAmount(Number(invoice.amount), invoice.currency)}
                  </div>
                  <div className="mt-2 text-sm text-white/45">{invoice.description || "No description"}</div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="text-xs text-white/40">
                      {invoice.effectiveStatus === "paid"
                        ? `Paid ${formatDateTime(invoice.paid_at)}`
                        : invoice.expires_at
                          ? `Expires ${formatDateTime(invoice.expires_at)}`
                          : "No expiry"}
                    </div>
                    <Link
                      href={`/pay/${invoice.onchain_invoice_id}`}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
