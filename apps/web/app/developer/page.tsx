import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";

export default function DeveloperPage() {
  return (
    <AppShell
      active="Developer"
      title="Developer Tools"
      subtitle="API keys, webhooks, SDKs, and live delivery logs for StackPay integrations."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">API keys</div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-white/40">Secret key</div>
              <div className="mt-1 font-mono text-xs text-white/70">sk_live_34f...c9d</div>
            </div>
            <button className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
              Rotate key
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Webhooks</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Endpoint: https://api.stackpay.app/webhooks</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Events: invoice.created, invoice.paid</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">SDK quick start</div>
        <pre className="whitespace-pre-wrap font-mono text-xs text-white/70">
{`npm install @stackpay/sdk\n\nimport { StackPay } from "@stackpay/sdk";\n\nconst client = new StackPay({ apiKey: process.env.STACKPAY_API_KEY });\nconst invoice = await client.invoices.create({ amount: 0.012, currency: "sBTC" });`}
        </pre>
      </GlassCard>
    </AppShell>
  );
}
