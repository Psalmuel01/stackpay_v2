"use client";

import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import DonutBreakdown from "@/components/app/DonutBreakdown";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import TrendChart from "@/components/app/TrendChart";
import {
  formatCurrencyAmount,
  formatDateTime,
  formatRelativeTime,
  useDemo,
} from "@/components/app/DemoProvider";

export default function DashboardPage() {
  const { state } = useDemo();

  const paidInvoices = state.invoices.filter((invoice) => invoice.status === "paid");
  const pendingInvoices = state.invoices.filter((invoice) => invoice.status === "pending");
  const expiredInvoices = state.invoices.filter((invoice) => invoice.status === "expired");
  const totalVolume = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const activePolicies = state.settlementPolicies.filter((policy) => policy.active);
  const upcomingSettlement = activePolicies.find((policy) => policy.nextSettlementAt);

  const balanceCards = (Object.entries(state.balances) as Array<
    [keyof typeof state.balances, number]
  >).map(([token, amount]) => ({
    token,
    available: amount,
    locked:
      token === "sBTC"
        ? pendingInvoices
            .filter((invoice) => invoice.currency === token)
            .reduce((sum, invoice) => sum + invoice.amount, 0)
        : token === "USDCx"
          ? 1250
          : 320,
  }));

  const trendPoints = paidInvoices
    .slice(0, 6)
    .reverse()
    .map((invoice, index) => ({
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        new Date(invoice.paidAt || invoice.createdAt)
      ),
      value: Number(invoice.amount) + index * 2,
    }));

  const needsAttention = pendingInvoices.slice(0, 3).map((invoice) => ({
    invoice: invoice.id,
    customer: invoice.customer,
    amount: formatCurrencyAmount(invoice.amount, invoice.currency),
    status: invoice.status === "pending" ? "Pending" : "Expired",
    eta: invoice.expiresAt ? `Expires ${formatRelativeTime(invoice.expiresAt)}` : "Open ended",
  }));

  const activity = [
    ...state.webhookDeliveries.slice(0, 2).map((delivery) => ({
      title: delivery.event,
      detail: delivery.summary,
      status: delivery.status === "delivered" ? "Settled" : "Pending",
    })),
    ...state.settlementRuns.slice(0, 1).map((run) => ({
      title: `${run.id} settlement completed`,
      detail: `${formatCurrencyAmount(run.amount, run.currency)} to ${run.destination.slice(0, 10)}...`,
      status: run.status === "completed" ? "Settled" : "Pending",
    })),
    ...expiredInvoices.slice(0, 1).map((invoice) => ({
      title: `${invoice.id} expired`,
      detail: `${invoice.customer} missed the payment window`,
      status: "Expired",
    })),
  ].slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Merchant Dashboard"
        subtitle="Track demo invoice volume, settlement pressure, subscription renewals, and the hosted payment flows you can act on next."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {balanceCards.map((balance, index) => (
          <GlassCard
            key={balance.token}
            className={index === 0 ? "border border-white/25" : undefined}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/35">
                  {balance.token}
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">
                  {balance.available.toLocaleString()}
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/45">
                Available
              </span>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-white/55">
              <span>Locked</span>
              <span>{balance.locked.toLocaleString()}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="border border-white/30">
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Total Volume</div>
          <div className="mt-3 text-3xl font-semibold text-white">{totalVolume.toLocaleString()}</div>
          <div className="mt-2 text-sm text-white/55">Paid invoices across the demo merchant</div>
        </GlassCard>
        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Active Invoices</div>
          <div className="mt-3 text-3xl font-semibold text-white">{pendingInvoices.length}</div>
          <div className="mt-2 text-sm text-white/55">Hosted payment links ready to share</div>
        </GlassCard>
        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Subscriptions</div>
          <div className="mt-3 text-3xl font-semibold text-white">{state.subscriptions.length}</div>
          <div className="mt-2 text-sm text-white/55">Recurring customers under management</div>
        </GlassCard>
        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Next Settlement</div>
          <div className="mt-3 text-xl font-semibold text-white">
            {upcomingSettlement?.nextSettlementAt
              ? formatDateTime(upcomingSettlement.nextSettlementAt)
              : "Manual only"}
          </div>
          <div className="mt-2 text-sm text-white/55">
            {upcomingSettlement ? upcomingSettlement.name : "Create a policy to automate payouts"}
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <GlassCard className="border border-white/20">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Payment volume
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                Recent paid invoice activity
              </div>
            </div>
            <StatusBadge label="Active" />
          </div>
          <TrendChart
            points={
              trendPoints.length > 1
                ? trendPoints
                : [
                    { label: "Seed", value: 5 },
                    { label: "Demo", value: 8 },
                    { label: "Flow", value: 11 },
                    { label: "Ready", value: 13 },
                    { label: "For", value: 16 },
                    { label: "Integrations", value: 20 },
                  ]
            }
            accent
          />
        </GlassCard>

        <GlassCard>
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Invoice status
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              Distribution in the demo workspace
            </div>
          </div>
          <DonutBreakdown
            slices={[
              { label: "Paid", value: paidInvoices.length, color: "#34d399" },
              { label: "Pending", value: pendingInvoices.length, color: "#f59e0b" },
              { label: "Expired", value: expiredInvoices.length, color: "#737373" },
            ]}
          />
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Recent activity
            </div>
            <span className="text-xs text-white/40">Demo webhook mirror</span>
          </div>
          <div className="space-y-3">
            {activity.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`rounded-2xl border px-4 py-4 ${
                  index === 1
                    ? "border-white/20 bg-accent/5"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-white/55">{item.detail}</div>
                  </div>
                  <StatusBadge label={item.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Needs attention
            </div>
            <span className="text-xs text-white/40">
              {needsAttention.length} invoices need a next step
            </span>
          </div>
          <div className="space-y-3">
            {needsAttention.map((row) => (
              <div
                key={row.invoice}
                className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <div className="text-sm font-medium text-white">{row.invoice}</div>
                  <div className="mt-1 text-sm text-white/55">{row.customer}</div>
                </div>
                <div className="text-sm text-white/75">{row.amount}</div>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <StatusBadge label={row.status} />
                  <span className="text-xs text-white/45">{row.eta}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <Link
              href="/create-invoice"
              className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Create invoice
            </Link>
            <Link
              href="/settlements"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70"
            >
              Run settlements
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
