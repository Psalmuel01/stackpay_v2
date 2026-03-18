"use client";

import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import { apiResources, webhookEvents } from "@stackpay/integrations";
import { useDemo } from "@/components/app/DemoProvider";

export default function DeveloperPage() {
  const { state, actions } = useDemo();
  const [webhookTarget, setWebhookTarget] = useState(state.merchant.webhookUrl);
  const [selectedEvent, setSelectedEvent] = useState("invoice.paid");

  return (
    <div>
      <PageHeader
        title="Developer Tools"
        subtitle="Rotate demo keys, test webhook delivery, and inspect the integration surface that the real API and indexer will mirror."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">API keys</div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-white/40">Secret key</div>
              <div className="mt-1 font-mono text-xs text-white/70">{state.merchant.apiKey}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-white/40">Webhook signing secret</div>
              <div className="mt-1 font-mono text-xs text-white/70">{state.merchant.webhookSecret}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => actions.rotateApiKey()}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70"
              >
                Rotate key
              </button>
              <button
                onClick={() => actions.rotateWebhookSecret()}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70"
              >
                Rotate secret
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Webhooks</div>
          <div className="space-y-3 text-sm text-white/70">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 outline-none"
              value={webhookTarget}
              onChange={(event) => setWebhookTarget(event.target.value)}
            />
            <select
              value={selectedEvent}
              onChange={(event) => setSelectedEvent(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 outline-none"
            >
              {webhookEvents.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                actions.updateMerchantProfile({ webhookUrl: webhookTarget });
                actions.sendWebhookTest(selectedEvent, webhookTarget);
              }}
              className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black"
            >
              Send test event
            </button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">SDK quick start</div>
        <pre className="whitespace-pre-wrap font-mono text-xs text-white/70">
{`npm install @stackpay/sdk\n\nimport { StackPay } from "@stackpay/sdk";\n\nconst client = new StackPay({ apiKey: process.env.STACKPAY_API_KEY });\nconst invoice = await client.invoices.create({ amount: 0.012, currency: "sBTC" });`}
        </pre>
      </GlassCard>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">REST surface</div>
        <div className="space-y-3">
          {apiResources.map((resource) => (
            <div
              key={`${resource.method}-${resource.path}`}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="font-mono text-xs text-accent">
                {resource.method} {resource.path}
              </div>
              <div className="mt-2 text-sm text-white/70">{resource.purpose}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Delivery log</div>
        <div className="space-y-3">
          {state.webhookDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{delivery.event}</div>
                  <div className="mt-1 text-xs text-white/45">{delivery.summary}</div>
                </div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                  {delivery.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
