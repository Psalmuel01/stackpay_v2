import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";

const invoices = [
  { hash: "INV_9821", amount: "0.018 sBTC", customer: "Studio Noon", status: "Pending" },
  { hash: "INV_9815", amount: "450 USDCx", customer: "Mint Labs", status: "Settled" },
  { hash: "INV_9798", amount: "12 STX", customer: "Relay FM", status: "Expired" },
];

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Search payment requests, inspect state transitions, and jump into follow-up actions."
      />
      <GlassCard className="border border-accent/20">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
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
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 outline-none lg:w-80"
            placeholder="Search by invoice hash, customer, or amount"
          />
        </div>

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.hash}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:grid-cols-[1.2fr_0.8fr_auto]"
            >
              <div>
                <div className="text-sm font-semibold text-white">{invoice.hash}</div>
                <div className="mt-1 text-sm text-white/55">{invoice.customer}</div>
              </div>
              <div className="text-sm text-white/78">{invoice.amount}</div>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <StatusBadge label={invoice.status} />
                <button className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
