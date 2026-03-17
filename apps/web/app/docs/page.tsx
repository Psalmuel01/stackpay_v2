import AppShell from "@/components/AppShell";
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
    <AppShell
      active="Developer"
      title="Technical Documentation"
      subtitle="Specification for on-chain invoices, settlement contracts, and the StackPay API."
    >
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
        <div className="space-y-3 text-sm text-white/70">
          <p>
            StackPay provides a Bitcoin-native payment layer on Stacks with on-chain invoices, webhooks, and
            SDKs. Use the docs to integrate invoice creation, subscription renewal, and settlement lifecycle
            events into any backend.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs">
            POST /v1/invoices
          </div>
        </div>
      </GlassCard>
    </AppShell>
  );
}
