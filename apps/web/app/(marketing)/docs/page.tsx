import Footer from "@/components/Footer";
import GlassCard from "@/components/GlassCard";

const sections = [
  "Overview",
  "Guides",
  "SDK",
  "Smart Contracts",
  "Frontend Logic",
  "Backend API"
];

export default function DocsPage() {
  return (
    <div className="section-pad">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 space-y-4">
          <span className="text-xs uppercase tracking-[0.4em] text-white/40">Docs</span>
          <h1 className="text-4xl font-semibold md:text-5xl">Technical Documentation</h1>
          <p className="max-w-2xl text-sm text-white/60 md:text-base">
            Everything you need to integrate StackPay — from on-chain invoice creation to webhook delivery and SDK usage.
          </p>
        </div>

        <GlassCard>
          <div className="mb-6 flex flex-wrap gap-2">
            {sections.map((section, idx) => (
              <button
                key={section}
                className={`rounded-full px-4 py-2 text-xs transition ${
                  idx === 0
                    ? "border border-white/20 bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
          <div className="space-y-4 text-sm text-white/70">
            <p>
              StackPay provides a Bitcoin-native payment layer on Stacks with on-chain invoices, webhooks, and SDKs. Use the
              docs to integrate invoice creation, subscription renewal, and settlement lifecycle events into any backend.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs">
              POST /v1/invoices
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.3em] text-white/40">SDK Install</div>
                <div className="mt-2 font-mono text-xs text-white/70">npm install @stackpay/sdk</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.3em] text-white/40">Webhook events</div>
                <div className="mt-2 text-xs text-white/70">invoice.created · invoice.paid · settlement.completed</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}
