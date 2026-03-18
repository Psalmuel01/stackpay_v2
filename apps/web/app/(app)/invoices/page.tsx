"use client";

import Link from "next/link";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import { formatCurrencyAmount, formatDateTime, useDemo } from "@/components/app/DemoProvider";

type Filter = "all" | "pending" | "paid" | "expired" | "draft";

export default function InvoicesPage() {
  const { state } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const invoices = state.invoices.filter((invoice) => {
    const matchesFilter = filter === "all" ? true : invoice.status === filter;
    const haystack = `${invoice.id} ${invoice.customer} ${invoice.email} ${invoice.amount} ${invoice.currency}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Review invoice records and statuses from the shared demo state. Payment and expiry changes will eventually be driven automatically by chain activity and backend jobs."
      />

      <GlassCard className="border border-white/20">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
            placeholder="Search by invoice id, customer, or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-white/10 lg:block">
          <div className="grid grid-cols-[1.05fr_0.9fr_0.6fr_0.8fr_0.8fr_100px] gap-6 bg-white/5 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
            <div>Invoice</div>
            <div>Customer</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Status</div>
            <div>View</div>
          </div>

          <div className="divide-y divide-white/10">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-[1.05fr_0.9fr_0.6fr_0.8fr_0.8fr_100px] gap-6 px-6 py-4"
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
                </div>

                <div>
                  <div className="text-sm text-white/78">{invoice.customer || "Walk-in customer"}</div>
                  <div className="mt-1 text-xs text-white/40">{invoice.email || "No email attached"}</div>
                </div>

                <div className="text-sm capitalize text-white/72">{invoice.type}</div>

                <div>
                  <div className="text-sm font-medium text-white">
                    {formatCurrencyAmount(invoice.amount, invoice.currency)}
                  </div>
                  <div className="mt-1 text-xs text-white/40">{invoice.description}</div>
                </div>

                <div className="flex items-start">
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
                        : invoice.status === "draft"
                          ? "Draft"
                          : "Expired"
                  }
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="text-sm text-white/75">
                  {formatCurrencyAmount(invoice.amount, invoice.currency)}
                </div>
                <div className="text-sm capitalize text-white/55">{invoice.type}</div>
              </div>

              <div className="mt-2 text-sm text-white/45">{invoice.description}</div>

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
