import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";

const stats = [
  { label: "Total Volume", value: "24.8 sBTC", change: "+12.4%" },
  { label: "Active Invoices", value: "128", change: "+5" },
  { label: "Pending Settlements", value: "4", change: "-2" },
  { label: "Success Rate", value: "98.4%", change: "+0.6%" }
];

const activity = [
  "Invoice 0x8c...a41 paid in sBTC",
  "Subscription Plan Pro renewed",
  "Settlement batch sent to Main Wallet",
  "Invoice 0x1f...19d expired"
];

export default function DashboardPage() {
  return (
    <AppShell
      active="Dashboard"
      title="Merchant Dashboard"
      subtitle="Live volume, settlements, and invoice performance across your StackPay account."
    >
      <div className="grid gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</div>
            <div className="text-2xl font-semibold text-white">{stat.value}</div>
            <div className="text-xs text-emerald-300/80">{stat.change}</div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GlassCard className="h-[320px]">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.3em] text-white/40">Payment volume</div>
            <div className="text-xs text-white/50">Last 30 days</div>
          </div>
          <div className="flex h-full items-end gap-3">
            {[40, 65, 45, 80, 55, 90, 70].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-full bg-white/10"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Recent activity</div>
          <div className="space-y-3 text-sm text-white/70">
            {activity.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {["Invoice Status", "Settlement Health", "Top Merchants"].map((title) => (
          <GlassCard key={title}>
            <div className="mb-3 text-sm uppercase tracking-[0.3em] text-white/40">{title}</div>
            <div className="text-sm text-white/60">
              Visualize distribution metrics, settlement latency, and channel performance.
            </div>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
