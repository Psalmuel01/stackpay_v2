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

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<MerchantProfile>({
    default_currency: "sBTC",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSettlement, setEditingSettlement] = useState(false);
  const [settlementDraft, setSettlementDraft] = useState("");

  useEffect(() => {
    setConnectedAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (!connectedAddress) {
      setProfile({ default_currency: "sBTC" });
      setSettlementDraft("");
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

        const settlementWallet = merchant?.settlement_wallet ?? connectedAddress;

        setProfile({
          display_name: merchant?.display_name ?? "",
          company_name: merchant?.company_name ?? "",
          email: merchant?.email ?? "",
          slug: merchant?.slug ?? "",
          settlement_wallet: settlementWallet,
          webhook_url: merchant?.webhook_url ?? "",
          default_currency: merchant?.default_currency ?? "sBTC",
        });
        setSettlementDraft(settlementWallet);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile((current) => ({
            ...current,
            settlement_wallet: connectedAddress,
          }));
          setSettlementDraft(connectedAddress);
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
      const settlementWallet = settlementDraft.trim() || connectedAddress;
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
          settlementWallet,
          webhookUrl: profile.webhook_url || "",
          defaultCurrency: profile.default_currency ?? "sBTC",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to save merchant profile.");
      }

      const merchant = payload.data as MerchantProfile;
      const nextSettlementWallet = merchant.settlement_wallet ?? connectedAddress;

      setProfile({
        display_name: merchant.display_name ?? "",
        company_name: merchant.company_name ?? "",
        email: merchant.email ?? "",
        slug: merchant.slug ?? "",
        settlement_wallet: nextSettlementWallet,
        webhook_url: merchant.webhook_url ?? "",
        default_currency: merchant.default_currency ?? "sBTC",
      });
      setSettlementDraft(nextSettlementWallet);
      setEditingSettlement(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save merchant profile.");
    } finally {
      setSaving(false);
    }
  }

  const resolvedSettlement = settlementDraft || profile.settlement_wallet || connectedAddress || "";
  const merchantName = (profile.company_name || profile.display_name || "").trim();

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Save your merchant identity and payout settings before creating invoices or public payment routes."
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Merchant profile</div>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              value={profile.webhook_url ?? ""}
              onChange={(event) => updateField("webhook_url", event.target.value)}
              placeholder="Webhook endpoint"
            />

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Settlement wallet</div>
                  <div className="mt-2 text-sm text-white/80">
                    {resolvedSettlement ? truncateAddress(resolvedSettlement) : "Will default to the connected wallet"}
                  </div>
                  <div className="mt-2 text-xs text-white/45">
                    StackPay sends invoice payouts to this address. If you leave it empty, the connected wallet is used.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSettlement((current) => !current);
                    setSettlementDraft(profile.settlement_wallet ?? connectedAddress ?? "");
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75"
                >
                  {editingSettlement ? "Close" : profile.settlement_wallet ? "Change" : "Set wallet"}
                </button>
              </div>

              {editingSettlement ? (
                <div className="mt-4 space-y-3">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70"
                    value={settlementDraft}
                    onChange={(event) => setSettlementDraft(event.target.value)}
                    placeholder={connectedAddress ?? "Connect wallet first"}
                  />
                  <button
                    type="button"
                    onClick={() => setSettlementDraft(connectedAddress ?? "")}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75"
                  >
                    Use connected wallet
                  </button>
                </div>
              ) : null}
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

        <div className="grid gap-6">
          <GlassCard>
            <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Connected wallet</div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Primary address</div>
              <div className="mt-2 text-sm text-white/80">
                {connectedAddress ? truncateAddress(connectedAddress) : "No wallet connected"}
              </div>
              <div className="mt-2 text-xs text-white/45">
                This wallet is used to sign invoice creation transactions and acts as the default payout address until you set a separate settlement wallet.
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Readiness</div>
            <div className="grid gap-3">
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Merchant name</div>
                <div className="mt-2 text-sm text-white/80">
                  {merchantName || "Add a business or display name"}
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Settlement destination</div>
                <div className="mt-2 text-sm text-white/80">
                  {resolvedSettlement ? truncateAddress(resolvedSettlement) : "Waiting for wallet connection"}
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Customers will see your saved merchant name on hosted invoices and QR routes. Finish this page first for a cleaner payment experience.
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
