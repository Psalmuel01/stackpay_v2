import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";

const plans = [
  { name: "Pro Annual", amount: "120 USDCx", interval: "Yearly" },
  { name: "Starter", amount: "15 USDCx", interval: "Monthly" }
];

export default function SubscriptionsPage() {
  return (
    <AppShell
      active="Subscriptions"
      title="Subscriptions"
      subtitle="Create recurring billing plans and track every renewal in real-time."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.3em] text-white/40">Plans</div>
            <button className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
              New plan
            </button>
          </div>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{plan.name}</div>
                    <div className="text-xs text-white/40">{plan.interval}</div>
                  </div>
                  <div className="text-sm text-white/70">{plan.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Active subscribers</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Acme Inc — 24 seats</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Nova Studio — 10 seats</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Mint Labs — 4 seats</div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
