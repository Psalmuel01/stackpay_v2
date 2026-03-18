"use client";

import Link from "next/link";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import {
  formatCurrencyAmount,
  formatDateTime,
  useDemo,
} from "@/components/app/DemoProvider";

type Filter = "all" | "pending" | "paid" | "expired" | "draft";

export default function InvoicesPage() {
  const { state, actions } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const invoices = state.invoices.filter((invoice) => {
    const matchesFilter = filter === "all" ? true : invoice.status === filter;
    const haystack = `${invoice.id} ${invoice.customer} ${invoice.amount} ${invoice.currency}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Search live demo payment requests, mark them paid or expired, and jump directly into hosted checkout."
      />
      <GlassCard className="border border-white/20">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "paid", "expired", "draft"] as Filter[]).map((tab) => (
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
            placeholder="Search by invoice hash, customer, or amount"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:grid-cols-[1.2fr_0.8fr_auto]"
            >
              <div>
                <div className="text-sm font-semibold text-white">{invoice.id}</div>
                <div className="mt-1 text-sm text-white/55">{invoice.customer}</div>
                <div className="mt-1 text-xs text-white/35">
                  {invoice.status === "paid"
                    ? `Paid ${formatDateTime(invoice.paidAt)}`
                    : invoice.expiresAt
                      ? `Expires ${formatDateTime(invoice.expiresAt)}`
                      : "No expiry"}
                </div>
              </div>
              <div className="text-sm text-white/78">
                <div>{formatCurrencyAmount(invoice.amount, invoice.currency)}</div>
                <div className="mt-1 text-xs text-white/35">{invoice.description}</div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                <StatusBadge
                  label={
                    invoice.status === "paid"
                      ? "Paid"
                      : invoice.status === "pending"
                        ? "Pending"
                        : invoice.status === "draft"
                          ? "Draft"
                          : "Expired"
                  }
                />
                {invoice.status === "pending" ? (
                  <button
                    onClick={() => actions.markInvoicePaid(invoice.id, invoice.customer)}
                    className="rounded-full border border-white/25 bg-white px-3 py-1 text-xs font-semibold text-black"
                  >
                    Mark paid
                  </button>
                ) : null}
                {invoice.status === "pending" ? (
                  <button
                    onClick={() => actions.expireInvoice(invoice.id)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    Expire
                  </button>
                ) : null}
                <Link
                  href={`/pay/${invoice.id}`}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
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
