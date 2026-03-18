import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import StatusBadge from "@/components/app/StatusBadge";

const channels = [
  { name: "Countertop QR", description: "Tap-to-pay at checkout desks", status: "Active" },
  { name: "Payment link", description: "Send by email, DM, or invoice receipt", status: "Active" },
  { name: "POS embed", description: "Use inside your in-store tablet flow", status: "Draft" },
];

export default function QrLinkPage() {
  return (
    <div>
      <PageHeader
        title="QR Link"
        subtitle="Generate reusable payment entry points for in-person and shared payment flows."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard className="border border-accent/20">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Universal payment link
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                Point your customer to one stable entry point
              </div>
            </div>
            <StatusBadge label="Active" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Destination", "Main settlement wallet"],
              ["Currency mode", "Merchant-selectable"],
              ["QR refresh", "Static"],
              ["Fallback", "Hosted payment page"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                  {label}
                </div>
                <div className="mt-2 text-sm text-white/78">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              Flow
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Customer scans QR or opens link",
                "Hosted page resolves active invoice or collection mode",
                "Wallet signs on Stacks testnet and receipt is issued",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-accent">
                    0{index + 1}
                  </div>
                  <div className="mt-2 text-sm text-white/72">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <QrPreview label="stackpay.app/pay/merchant/studio-noon" />
          <div className="mt-5 flex gap-3">
            <button className="flex-1 rounded-full border border-accent/35 bg-white px-4 py-3 text-sm font-semibold text-black">
              Regenerate
            </button>
            <button className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Copy Link
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard>
          <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Distribution channels
          </div>
          <div className="space-y-3">
            {channels.map((channel, index) => (
              <div
                key={channel.name}
                className={`rounded-2xl border px-4 py-4 ${
                  index === 0 ? "border-accent/20 bg-accent/5" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">{channel.name}</div>
                    <div className="mt-1 text-sm text-white/55">{channel.description}</div>
                  </div>
                  <StatusBadge label={channel.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Latest generated links
          </div>
          <div className="space-y-3">
            {[
              ["Countertop terminal", "stackpay.app/pay/merchant/studio-noon", "Updated 4m ago"],
              ["Expo booth poster", "stackpay.app/pay/merchant/booth-west", "Updated yesterday"],
              ["Podcast QR insert", "stackpay.app/pay/merchant/relay-store", "Updated 2d ago"],
            ].map(([name, link, updated]) => (
              <div
                key={link}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="text-sm font-medium text-white">{name}</div>
                <div className="mt-2 font-mono text-xs text-white/65">{link}</div>
                <div className="mt-3 text-xs text-white/40">{updated}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
