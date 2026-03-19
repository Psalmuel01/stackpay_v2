"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import { getConnectedWalletAddress } from "@/lib/stacks";

type MerchantProfile = {
  display_name?: string;
  company_name?: string;
  email?: string;
  slug?: string;
  settlement_wallet?: string | null;
  webhook_url?: string | null;
  default_currency?: "sBTC" | "STX" | "USDCx";
};

const currencies: Array<"sBTC" | "STX" | "USDCx"> = ["sBTC", "STX", "USDCx"];

export default function ProfilePage() {
  const connectedAddress = getConnectedWalletAddress();
  const [profile, setProfile] = useState<MerchantProfile>({
    default_currency: "sBTC",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connectedAddress) {
      setProfile({ default_currency: "sBTC" });
      return;
    }

    let cancelled = false;

    fetch(`/api/merchant/profile?walletAddress=${encodeURIComponent(connectedAddress)}`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        return (payload.data ?? null) as MerchantProfile | null;
      })
      .then((merchant) => {
        if (cancelled) {
          return;
        }

        setProfile({
          display_name: merchant?.display_name ?? "",
          company_name: merchant?.company_name ?? "",
          email: merchant?.email ?? "",
          slug: merchant?.slug ?? "",
          settlement_wallet: merchant?.settlement_wallet ?? connectedAddress,
          webhook_url: merchant?.webhook_url ?? "",
          default_currency: merchant?.default_currency ?? "sBTC",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setProfile((current) => ({
            ...current,
            settlement_wallet: connectedAddress,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  function updateField(field: keyof MerchantProfile, value: string) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!connectedAddress) {
      setError("Connect a wallet before saving your merchant profile.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/merchant/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: connectedAddress,
          displayName: profile.display_name ?? "",
          companyName: profile.company_name ?? "",
          email: profile.email ?? "",
          slug: profile.slug ?? "",
          settlementWallet: profile.settlement_wallet || connectedAddress,
          webhookUrl: profile.webhook_url || "",
          defaultCurrency: profile.default_currency ?? "sBTC",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to save merchant profile.");
      }

      const merchant = payload.data as MerchantProfile;
      setProfile({
        display_name: merchant.display_name ?? "",
        company_name: merchant.company_name ?? "",
        email: merchant.email ?? "",
        slug: merchant.slug ?? "",
        settlement_wallet: merchant.settlement_wallet ?? connectedAddress,
        webhook_url: merchant.webhook_url ?? "",
        default_currency: merchant.default_currency ?? "sBTC",
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save merchant profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile & Settings"
        subtitle="Save merchant metadata, default settlement wallet, and webhook details for the current connected wallet."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-3 text-sm uppercase tracking-[0.3em] text-white/40">Merchant profile</div>
          <form onSubmit={handleSave} className="space-y-3">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.company_name ?? ""}
              onChange={(event) => updateField("company_name", event.target.value)}
              placeholder="Business name"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.display_name ?? ""}
              onChange={(event) => updateField("display_name", event.target.value)}
              placeholder="Display name"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.email ?? ""}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Email address"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.slug ?? ""}
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="Public slug"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.settlement_wallet ?? connectedAddress ?? ""}
              onChange={(event) => updateField("settlement_wallet", event.target.value)}
              placeholder="Settlement wallet"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.webhook_url ?? ""}
              onChange={(event) => updateField("webhook_url", event.target.value)}
              placeholder="Webhook endpoint"
            />

            <div className="grid grid-cols-3 gap-2">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => updateField("default_currency", currency)}
                  className={`rounded-full px-4 py-2 text-xs transition ${
                    profile.default_currency === currency
                      ? "border border-white/20 bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>

            <button
              disabled={saving}
              className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            {saved ? <div className="text-xs text-white/60">Merchant profile saved to Supabase.</div> : null}
            {error ? <div className="text-xs text-rose-300">{error}</div> : null}
          </form>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 text-sm uppercase tracking-[0.3em] text-white/40">Wallet state</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              {connectedAddress ? `Connected: ${connectedAddress}` : "No wallet connected"}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              {profile.settlement_wallet || connectedAddress || "Settlement wallet will default to the connected wallet."}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
              Invoice recipient defaults to the saved settlement wallet. If none is saved, StackPay uses the connected wallet address.
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
