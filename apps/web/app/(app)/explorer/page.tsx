import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";

export default function ExplorerPage() {
  return (
    <div>
      <PageHeader
        title="Explorer"
        subtitle="Search public invoices and verify payments on-chain."
      />
      <GlassCard className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70"
            placeholder="Search by invoice hash"
          />
          <button className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black">
            Verify
          </button>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Total invoices", value: "12,841" },
          { label: "Active merchants", value: "426" },
          { label: "Settlements today", value: "92" }
        ].map((stat) => (
          <GlassCard key={stat.label}>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Recent public activity</div>
        <div className="space-y-3 text-sm text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Invoice 0x8c...a41 settled · 0.018 sBTC</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Invoice 0x1f...19d pending · 450 USDCx</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Invoice 0x9b...7ef expired · 12 STX</div>
        </div>
      </GlassCard>
    </div>
  );
}
