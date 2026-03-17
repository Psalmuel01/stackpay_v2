import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";

const invoices = [
  { hash: "0x8c...a41", amount: "0.018 sBTC", status: "Settled" },
  { hash: "0x1f...19d", amount: "450 USDCx", status: "Pending" },
  { hash: "0x9b...7ef", amount: "12 STX", status: "Expired" }
];

export default function InvoicesPage() {
  return (
    <AppShell
      active="Invoices"
      title="Invoices"
      subtitle="Filter, search, and share payment links across all invoice types."
    >
      <GlassCard>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {["All", "Pending", "Settled", "Expired"].map((tab, idx) => (
              <button
                key={tab}
                className={`rounded-full px-4 py-2 text-xs transition ${
                  idx === 0
                    ? "border border-white/20 bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 md:w-72"
            placeholder="Search by invoice hash"
          />
        </div>

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.hash}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-white">{invoice.hash}</div>
                <div className="text-xs text-white/40">Created 2 hours ago</div>
              </div>
              <div className="text-sm text-white/80">{invoice.amount}</div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {invoice.status}
                </span>
                <button className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </AppShell>
  );
}
