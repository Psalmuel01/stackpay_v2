import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage merchant info, connected wallets, and notification preferences."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Merchant profile</div>
          <div className="space-y-4">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              placeholder="Business name"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              placeholder="Email address"
            />
            <button className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black">
              Save changes
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Connected wallets</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Leather · Connected</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Xverse · Add wallet</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Notifications</div>
        <div className="flex flex-wrap gap-3">
          {[
            "Invoice paid",
            "Settlement completed",
            "Subscription renewed",
            "Webhook failure"
          ].map((item, idx) => (
            <button
              key={item}
              className={`rounded-full px-4 py-2 text-xs transition ${
                idx < 2
                  ? "border border-white/20 bg-white text-black"
                  : "border border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
