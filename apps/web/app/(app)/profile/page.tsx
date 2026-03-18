"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import {
  type Currency,
  useDemo,
} from "@/components/app/DemoProvider";

const currencies: Currency[] = ["sBTC", "STX", "USDCx"];

export default function ProfilePage() {
  const { state, actions } = useDemo();
  const [saved, setSaved] = useState(false);
  const universalLink =
    state.paymentLinks.find((link) => link.mode === "donation" && link.isUniversal && link.isActive) ??
    state.paymentLinks.find((link) => link.mode === "donation" && link.isActive);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    actions.updateMerchantProfile({
      businessName: String(formData.get("businessName") || ""),
      email: String(formData.get("email") || ""),
      slug: String(formData.get("slug") || ""),
      settlementWallet: String(formData.get("wallet") || ""),
      webhookUrl: String(formData.get("webhookUrl") || ""),
      defaultCurrency: String(formData.get("defaultCurrency") || "sBTC") as Currency,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage merchant identity, public checkout slug, settlement wallet, and developer defaults for the demo workspace."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Merchant profile</div>
          <form onSubmit={handleSave} className="space-y-3">
            <input
              name="businessName"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              defaultValue={state.merchant.businessName}
              placeholder="Business name"
            />
            <input
              name="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              defaultValue={state.merchant.email}
              placeholder="Email address"
            />
            <input
              name="slug"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              defaultValue={state.merchant.slug}
              placeholder="Public slug"
            />
            <input
              name="wallet"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              defaultValue={state.merchant.settlementWallet}
              placeholder="Settlement wallet"
            />
            <input
              name="webhookUrl"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              defaultValue={state.merchant.webhookUrl}
              placeholder="Webhook endpoint"
            />
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => actions.updateMerchantProfile({ defaultCurrency: currency })}
                  className={`rounded-full px-4 py-2 text-xs transition ${state.merchant.defaultCurrency === currency
                    ? "border border-white/20 bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                >
                  {currency}
                </button>
              ))}
            </div>
            <input type="hidden" name="defaultCurrency" value={state.merchant.defaultCurrency} />
            <button className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black">
              Save changes
            </button>
            {saved ? <div className="text-xs text-white/60">Profile updated in local demo state.</div> : null}
          </form>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Connected wallets</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Leather · Demo connected
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Xverse · Ready for wallet auth
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
              Merchant slug: stackpay.app/{state.merchant.slug}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
              Public checkout: stackpay.app/pay/link/{universalLink?.slug ?? state.merchant.slug}
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Notifications</div>
        <div className="flex flex-wrap gap-3">
          {[
            ["invoicePaid", "Invoice paid"],
            ["settlementCompleted", "Settlement completed"],
            ["subscriptionRenewed", "Subscription renewed"],
            ["webhookFailure", "Webhook failure"],
          ].map(([key, label]) => {
            const active = state.merchant.notifications[key as keyof typeof state.merchant.notifications];
            return (
              <button
                key={key}
                onClick={() => actions.toggleNotification(key as keyof typeof state.merchant.notifications)}
                className={`rounded-full px-4 py-2 text-xs transition ${active
                  ? "border border-white/20 bg-white text-black"
                  : "border border-white/10 bg-white/5 text-white/70"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
