"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import { formatCurrencyAmount, formatDateTime, useDemo } from "@/components/app/DemoProvider";
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
};

export default function InvoicesPage() {
  const { state } = useDemo();
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [remoteInvoices, setRemoteInvoices] = useState<RemoteInvoice[]>([]);

  useEffect(() => {
    setConnectedAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (!connectedAddress) {
      setRemoteInvoices([]);
      return;
    }

    let cancelled = false;

    fetch(`/api/invoices?walletAddress=${encodeURIComponent(connectedAddress)}`)
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
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  const invoices = useMemo(() => {
    if (remoteInvoices.length > 0) {
      return remoteInvoices
        .filter((invoice) => {
          const matchesFilter = filter === "all" ? true : invoice.status === filter;
          const haystack =
            `${invoice.onchain_invoice_id} ${invoice.customer_name} ${invoice.customer_email} ${invoice.amount} ${invoice.currency}`.toLowerCase();
          return matchesFilter && haystack.includes(query.toLowerCase());
        })
        .map((invoice) => ({
          id: invoice.onchain_invoice_id,
          customer: invoice.customer_name,
          email: invoice.customer_email,
          description: invoice.description,
          amount: Number(invoice.amount),
          currency: invoice.currency,
          status: invoice.status,
          expiresAt: invoice.expires_at,
          paidAt: invoice.paid_at,
          type: "standard",
          source: "remote" as const,
        }));
    }

    return state.invoices
      .filter((invoice) => {
        const matchesFilter = filter === "all" ? true : invoice.status === filter;
        const haystack =
          `${invoice.id} ${invoice.customer} ${invoice.email} ${invoice.amount} ${invoice.currency}`.toLowerCase();
        return matchesFilter && haystack.includes(query.toLowerCase());
      })
      .map((invoice) => ({
        ...invoice,
        source: "demo" as const,
      }));
  }, [filter, query, remoteInvoices, state.invoices]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Review invoice records from Supabase for the connected merchant wallet. Demo data is shown only when no remote invoices exist yet."
      />

      <GlassCard className="border border-white/20">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "paid", "expired"] as Filter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-full px-4 py-2 text-xs uppercase transition ${
                  filter === tab
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
            placeholder="Search by invoice id, customer, or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-white/10 lg:block">
          <div className="grid grid-cols-[1.2fr_0.95fr_0.75fr_0.9fr_110px] gap-6 bg-white/5 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
            <div>Invoice</div>
            <div>Customer</div>
            <div>Amount</div>
            <div>Status</div>
            <div>View</div>
          </div>

          <div className="divide-y divide-white/10">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-[1.2fr_0.95fr_0.75fr_0.9fr_110px] gap-6 px-6 py-4"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{invoice.id}</div>
                  <div className="mt-1 text-xs text-white/40">
                    {invoice.status === "paid"
                      ? `Paid ${formatDateTime(invoice.paidAt)}`
                      : invoice.expiresAt
                        ? `Expires ${formatDateTime(invoice.expiresAt)}`
                        : "No expiry"}
                  </div>
                  <div className="mt-2 text-xs text-white/45">{invoice.description || "No description"}</div>
                </div>

                <div>
                  <div className="text-sm text-white/78">{invoice.customer || "Walk-in customer"}</div>
                  <div className="mt-1 text-xs text-white/40">{invoice.email || "No email attached"}</div>
                </div>

                <div className="text-sm font-medium text-white">
                  {formatCurrencyAmount(invoice.amount, invoice.currency)}
                </div>

                <div className="flex items-start">
                  <StatusBadge
                    label={
                      invoice.status === "paid"
                        ? "Paid"
                        : invoice.status === "pending"
                          ? "Pending"
                          : "Expired"
                    }
                  />
                </div>

                <div>
                  <Link
                    href={`/pay/${invoice.id}`}
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
              key={invoice.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{invoice.id}</div>
                  <div className="mt-1 text-sm text-white/60">{invoice.customer || "Walk-in customer"}</div>
                </div>
                <StatusBadge
                  label={
                    invoice.status === "paid"
                      ? "Paid"
                      : invoice.status === "pending"
                        ? "Pending"
                        : "Expired"
                  }
                />
              </div>

              <div className="mt-3 text-sm text-white/75">
                {formatCurrencyAmount(invoice.amount, invoice.currency)}
              </div>
              <div className="mt-2 text-sm text-white/45">{invoice.description || "No description"}</div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-white/40">
                  {invoice.status === "paid"
                    ? `Paid ${formatDateTime(invoice.paidAt)}`
                    : invoice.expiresAt
                      ? `Expires ${formatDateTime(invoice.expiresAt)}`
                      : "No expiry"}
                </div>
                <Link
                  href={`/pay/${invoice.id}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
