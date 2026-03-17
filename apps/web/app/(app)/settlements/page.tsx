import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";

export default function SettlementsPage() {
  return (
    <div>
      <PageHeader
        title="Settlements"
        subtitle="Automate payouts to your wallets with thresholds or schedules."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-6 text-sm uppercase tracking-[0.3em] text-white/40">Settlement rules</div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm font-semibold">Main Wallet</div>
              <div className="text-xs text-white/50">Auto-settle when balance exceeds 2 sBTC</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm font-semibold">Treasury Wallet</div>
              <div className="text-xs text-white/50">Schedule: Weekly · Friday 18:00 UTC</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Settlement history</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              0x92...f4c → Main Wallet · 1.2 sBTC
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              0x44...9aa → Treasury Wallet · 4,200 USDCx
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
