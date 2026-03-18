import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";

export default function SettlementsPage() {
  return (
    <div>
      <PageHeader
        title="Settlements"
        subtitle="Configure payout logic, preview batch execution, and inspect completed settlement runs."
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard className="border border-accent/20">
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Settlement rules
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Main Wallet</div>
                  <div className="mt-1 text-sm text-white/55">
                    Auto-settle when balance exceeds 2 sBTC
                  </div>
                </div>
                <StatusBadge label="Active" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Treasury Wallet</div>
                  <div className="mt-1 text-sm text-white/55">
                    Weekly sweep on Friday at 18:00 UTC
                  </div>
                </div>
                <StatusBadge label="Active" />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Upcoming execution
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-white">Batch #204</div>
                <div className="mt-1 text-sm text-white/55">
                  1.2 sBTC and 4,200 USDCx queued for release
                </div>
              </div>
              <StatusBadge label="Pending" />
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-8">
        <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
          Settlement history
        </div>
        <div className="space-y-3 text-sm text-white/70">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            0x92...f4c - Main Wallet - 1.2 sBTC - completed 14m ago
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            0x44...9aa - Treasury Wallet - 4,200 USDCx - completed yesterday
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
