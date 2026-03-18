import GlassCard from "@/components/GlassCard";
import DonutBreakdown from "@/components/app/DonutBreakdown";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import TrendChart from "@/components/app/TrendChart";

const stats = [
  { label: "Total Volume", value: "24.8 sBTC", change: "+12.4%", accent: true },
  { label: "Active Invoices", value: "128", change: "+5", accent: false },
  { label: "Pending Settlements", value: "4", change: "Next run in 38m", accent: false },
  { label: "Success Rate", value: "98.4%", change: "Up 0.6%", accent: false },
];

const balances = [
  { token: "sBTC", available: "1.82", locked: "0.14" },
  { token: "STX", available: "4,280", locked: "320" },
  { token: "USDCx", available: "18,900", locked: "1,250" },
];

const volumePoints = [
  { label: "Mar 12", value: 9 },
  { label: "Mar 13", value: 13 },
  { label: "Mar 14", value: 11 },
  { label: "Mar 15", value: 19 },
  { label: "Mar 16", value: 17 },
  { label: "Today", value: 26 },
];

const activity = [
  { title: "Invoice INV_9812 settled", detail: "0.018 sBTC from Studio Noon", status: "Settled" },
  { title: "Weekly treasury sweep queued", detail: "USDCx batch closes at 18:00 UTC", status: "Pending" },
  { title: "Subscription Pro renewed", detail: "Mint Labs charged 120 USDCx", status: "Paid" },
  { title: "Invoice INV_9798 expired", detail: "No payment before the 24h window", status: "Expired" },
];

const actionRows = [
  {
    invoice: "INV_9821",
    customer: "Studio Noon",
    amount: "0.012 sBTC",
    status: "Pending",
    eta: "Expires in 18m",
  },
  {
    invoice: "INV_9815",
    customer: "Mint Labs",
    amount: "480 USDCx",
    status: "Settled",
    eta: "Webhook delivered",
  },
  {
    invoice: "INV_9798",
    customer: "Relay FM",
    amount: "220 STX",
    status: "Expired",
    eta: "Retry invoice",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Merchant Dashboard"
        subtitle="Track live volume, settlement pressure, and the invoices that need action next."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {balances.map((balance, index) => (
          <GlassCard
            key={balance.token}
            className={index === 0 ? "border border-accent/25" : undefined}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/35">
                  {balance.token}
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">
                  {balance.available}
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/45">
                Available
              </span>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-white/55">
              <span>Locked</span>
              <span>{balance.locked}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard
            key={stat.label}
            className={stat.accent ? "border border-accent/30" : undefined}
          >
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              {stat.label}
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
            <div className="mt-2 text-sm text-white/55">{stat.change}</div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <GlassCard className="border border-accent/20">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Payment volume
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                6 day flow across sBTC, STX, and USDCx
              </div>
            </div>
            <StatusBadge label="Active" />
          </div>
          <TrendChart points={volumePoints} accent />
        </GlassCard>

        <GlassCard>
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Invoice status
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              Distribution this cycle
            </div>
          </div>
          <DonutBreakdown
            slices={[
              { label: "Settled", value: 64, color: "#34d399" },
              { label: "Pending", value: 18, color: "#f59e0b" },
              { label: "Expired", value: 9, color: "#737373" },
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
            <span className="text-xs text-white/40">Live webhook mirror</span>
          </div>
          <div className="space-y-3">
            {activity.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-2xl border px-4 py-4 ${
                  index === 1
                    ? "border-accent/20 bg-accent/5"
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
            <span className="text-xs text-white/40">3 invoices require follow-up</span>
          </div>
          <div className="space-y-3">
            {actionRows.map((row) => (
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
        </GlassCard>
      </div>
    </div>
  );
}
