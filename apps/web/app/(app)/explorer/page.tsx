import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";

const publicFeed = [
  { id: "INV_9821", amount: "0.012 sBTC", merchant: "Studio Noon", status: "Pending" },
  { id: "INV_9815", amount: "480 USDCx", merchant: "Mint Labs", status: "Settled" },
  { id: "INV_9798", amount: "220 STX", merchant: "Relay FM", status: "Expired" },
];

export default function ExplorerPage() {
  return (
    <div>
      <PageHeader
        title="Explorer"
        subtitle="Search invoices, verify receipts, and inspect the public payment surface without opening the full dashboard."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="border border-accent/20">
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
            Invoice lookup
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 outline-none"
              placeholder="Search by invoice hash, payment link, or receipt id"
            />
            <button className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black">
              Verify
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.24em] text-white/40">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Public invoice
            </span>
            <span className="rounded-full border border-accent/30 bg-accent/5 px-3 py-2 text-accent">
              Receipt verification
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Settlement trace
            </span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
            Network snapshot
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {[
              ["Total invoices", "12,841"],
              ["Active merchants", "426"],
              ["Settlements today", "92"],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`rounded-2xl border px-4 py-4 ${
                  index === 1 ? "border-accent/20 bg-accent/5" : "border-white/10 bg-white/5"
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
                Verified invoice
              </div>
              <div className="mt-2 text-xl font-semibold text-white">INV_9815</div>
            </div>
            <StatusBadge label="Settled" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Merchant", "Mint Labs"],
              ["Amount", "480 USDCx"],
              ["Created", "Mar 16, 14:22 UTC"],
              ["Receipt", "RCP_122"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                  {label}
                </div>
                <div className="mt-2 text-sm text-white/80">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              Timeline
            </div>
            <div className="mt-4 space-y-4">
              {[
                "Invoice created and indexed",
                "Customer paid from Xverse wallet",
                "Processor wrote receipt and emitted webhook event",
              ].map((step, index) => (
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
            {publicFeed.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">{item.id}</div>
                    <div className="mt-1 text-sm text-white/55">{item.merchant}</div>
                  </div>
                  <StatusBadge label={item.status} />
                </div>
                <div className="mt-3 text-sm text-white/75">{item.amount}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
