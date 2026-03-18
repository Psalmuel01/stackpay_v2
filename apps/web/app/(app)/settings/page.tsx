"use client";

import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import { settingsNavigation } from "@stackpay/ui";

const summaries: Record<string, string> = {
  "/settlements": "Configure payout rules, thresholds, and settlement execution history.",
  "/developer": "Inspect API keys, webhook deliveries, and integration test events.",
  "/profile": "Update merchant identity, settlement wallet, defaults, and notification settings.",
};

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Merchant controls, developer tools, and payout configuration live here so the main navigation can stay focused on daily payment operations."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {settingsNavigation.map((item) => (
          <Link key={item.href} href={item.href}>
            <GlassCard className="h-full border border-white/10 transition hover:border-white/20 hover:bg-white/10">
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Settings</div>
              <div className="mt-3 text-2xl font-semibold text-white">{item.label}</div>
              <div className="mt-2 text-sm text-white/60">
                {summaries[item.href] ?? "Open the merchant configuration view."}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
