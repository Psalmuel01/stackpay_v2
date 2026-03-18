"use client";

import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import {
  formatCurrencyAmount,
  formatDateTime,
  useDemo,
} from "@/components/app/DemoProvider";

export default function ExplorerPage() {
  const { state } = useDemo();
  const [query, setQuery] = useState(state.invoices[0]?.id ?? "");

  const invoice = state.invoices.find(
    (item) =>
      item.id.toLowerCase() === query.toLowerCase() ||
      item.receiptId?.toLowerCase() === query.toLowerCase()
  );
  const receipt = state.receipts.find(
    (item) =>
      item.id.toLowerCase() === query.toLowerCase() ||
      item.invoiceId.toLowerCase() === query.toLowerCase()
  );
  const paymentLink = state.paymentLinks.find((item) => item.slug.toLowerCase() === query.toLowerCase());

  return (
    <div>
      <PageHeader
        title="Explorer"
        subtitle="Search invoices, payment links, and receipts against the shared demo state so public verification and merchant operations behave like one system."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="border border-white/20">
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
            Invoice lookup
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 outline-none"
              placeholder="Search by invoice hash, payment slug, or receipt id"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black">
              Verify
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.24em] text-white/40">
            <button
              onClick={() => setQuery(state.invoices[0]?.id ?? "")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
            >
              Public invoice
            </button>
            <button
              onClick={() => setQuery(state.receipts[0]?.id ?? "")}
              className="rounded-full border border-white/30 bg-accent/5 px-3 py-2 text-accent"
            >
              Receipt verification
            </button>
            <button
              onClick={() => setQuery(state.paymentLinks[0]?.slug ?? "")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
            >
              Payment link
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
            Network snapshot
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {[
              ["Total invoices", `${state.invoices.length}`],
              ["Active merchants", "1 demo merchant"],
              ["Settlements", `${state.settlementRuns.length}`],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`rounded-2xl border px-4 py-4 ${index === 1 ? "border-white/20 bg-accent/5" : "border-white/10 bg-white/5"
                  }`}
              >
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                  {label}
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Verified object
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                {invoice?.id || receipt?.id || paymentLink?.slug || "No match yet"}
              </div>
            </div>
            <StatusBadge
              label={
                invoice?.status === "paid"
                  ? "Settled"
                  : invoice?.status === "pending"
                    ? "Pending"
                    : receipt
                      ? "Settled"
                      : paymentLink
                        ? "Active"
                        : "Draft"
              }
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {invoice
              ? [
                ["Merchant", state.merchant.businessName],
                ["Amount", formatCurrencyAmount(invoice.amount, invoice.currency)],
                ["Created", formatDateTime(invoice.createdAt)],
                ["Receipt", invoice.receiptId || "Pending"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                    {label}
                  </div>
                  <div className="mt-2 text-sm text-white/80">{value}</div>
                </div>
              ))
              : receipt
                ? [
                  ["Receipt", receipt.id],
                  ["Invoice", receipt.invoiceId],
                  ["Amount", formatCurrencyAmount(receipt.amount, receipt.currency)],
                  ["Timestamp", formatDateTime(receipt.timestamp)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                      {label}
                    </div>
                    <div className="mt-2 text-sm text-white/80">{value}</div>
                  </div>
                ))
                : paymentLink
                  ? [
                    ["Slug", paymentLink.slug],
                    ["Mode", paymentLink.mode],
                    ["Currency", paymentLink.currency],
                    ["Created", formatDateTime(paymentLink.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                        {label}
                      </div>
                      <div className="mt-2 text-sm text-white/80">{value}</div>
                    </div>
                  ))
                  : null}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Timeline</div>
            <div className="mt-4 space-y-3">
              {(invoice
                ? [
                  "Invoice created and indexed",
                  invoice.status === "paid" ? "Customer payment received" : "Waiting on customer payment",
                  invoice.receiptId ? "Receipt attached and webhook delivered" : "Receipt will appear after payment",
                ]
                : paymentLink
                  ? [
                    "Reusable payment link created",
                    "Hosted route resolves merchant mode",
                    "Link can create or resolve invoice state",
                  ]
                  : [
                    "Search by invoice id",
                    "Search by receipt id",
                    "Search by payment link slug",
                  ]
              ).map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />
                  <div className="text-sm text-white/70">
                    <span className="mr-2 text-white/40">0{index + 1}</span>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Public activity
          </div>
          <div className="space-y-3">
            {state.invoices.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">{item.id}</div>
                    <div className="mt-1 text-sm text-white/55">{item.customer}</div>
                  </div>
                  <StatusBadge
                    label={
                      item.status === "paid"
                        ? "Settled"
                        : item.status === "pending"
                          ? "Pending"
                          : item.status === "expired"
                            ? "Expired"
                            : "Draft"
                    }
                  />
                </div>
                <div className="mt-3 text-sm text-white/75">
                  {formatCurrencyAmount(item.amount, item.currency)}
                </div>
                <Link
                  href={`/pay/${item.id}`}
                  className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/65"
                >
                  Open checkout
                </Link>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
