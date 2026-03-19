"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import StatusBadge from "@/components/app/StatusBadge";
import { getConnectedWalletAddress } from "@/lib/stacks";

type MerchantProfile = {
  company_name?: string;
  display_name?: string;
  slug?: string;
  settlement_wallet?: string | null;
};

type UniversalQrLink = {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_active: boolean;
};

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function QrLinkPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [universalLink, setUniversalLink] = useState<UniversalQrLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConnectedAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (!connectedAddress) {
      setMerchantProfile(null);
      setUniversalLink(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/merchant/profile?walletAddress=${encodeURIComponent(connectedAddress)}`).then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = await response.json();
        return (payload.data ?? null) as MerchantProfile | null;
      }),
      fetch(`/api/qr-link?walletAddress=${encodeURIComponent(connectedAddress)}`).then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = await response.json();
        return (payload.data ?? null) as UniversalQrLink | null;
      }),
    ])
      .then(([merchant, qrLink]) => {
        if (!cancelled) {
          setMerchantProfile(merchant);
          setUniversalLink(qrLink);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerchantProfile(null);
          setUniversalLink(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  const merchantName = (merchantProfile?.company_name || merchantProfile?.display_name || "").trim();
  const settlementWallet = merchantProfile?.settlement_wallet || connectedAddress || "";
  const ready = Boolean(connectedAddress && merchantName);
  const hostedHref = universalLink ? `/pay/link/${universalLink.slug}` : "";

  async function handleCopy() {
    if (!hostedHref) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${hostedHref}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleGenerate() {
    if (!connectedAddress) {
      setError("Connect a wallet before generating a QR link.");
      return;
    }

    if (!ready) {
      setError("Complete your merchant profile first so the QR route uses your real business identity.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/qr-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: connectedAddress,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to generate QR link.");
      }

      setUniversalLink(payload.data.paymentLink as UniversalQrLink);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to generate QR link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="QR Link"
        subtitle="Generate a permanent payment QR for real-world use. This route accepts sBTC, STX, and USDCx without asking you to predefine an amount."
      />

      {!connectedAddress ? (
        <GlassCard className="border border-white/20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Universal QR</div>
            <div className="mt-3 text-3xl font-semibold text-white">Connect a wallet to continue</div>
            <div className="mt-3 text-sm text-white/60">
              StackPay needs your connected merchant wallet before it can load or generate your permanent QR route.
            </div>
          </div>
        </GlassCard>
      ) : !ready ? (
        <GlassCard className="border border-white/20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Merchant setup required</div>
            <div className="mt-3 text-3xl font-semibold text-white">Finish Settings before generating your QR</div>
            <div className="mt-3 text-sm text-white/60">
              Add your business name or display name in Settings first. That merchant identity is what customers will see when they scan your QR code.
            </div>
            <Link
              href="/profile"
              className="mt-5 inline-flex rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-black"
            >
              Open Settings
            </Link>
          </div>
        </GlassCard>
      ) : !universalLink ? (
        <GlassCard className="border border-white/20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Universal QR</div>
            <div className="mt-3 text-3xl font-semibold text-white">
              {loading ? "Loading your QR state" : "Generate your permanent payment QR"}
            </div>
            <div className="mt-3 text-sm text-white/60">
              This is a one-time setup for {merchantName}. Customers can pay with sBTC, STX, or USDCx from a single stable route.
            </div>
            <button
              onClick={() => void handleGenerate()}
              disabled={submitting || loading}
              className="mt-5 rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-60"
            >
              {submitting ? "Generating..." : "Generate QR link"}
            </button>
            {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <GlassCard className="border border-white/20">
            <div className="mx-auto max-w-[560px]">
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Universal QR</div>
                <div className="mt-2 text-3xl font-semibold text-white">{merchantName}</div>
                <div className="mt-3 text-sm text-white/60">
                  Permanent payment route for daily payments. Customers choose the asset and amount at checkout.
                </div>
              </div>

              <div className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6">
                <div className="mx-auto max-w-[420px]">
                  <div className="rounded-[32px] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                    <QrPreview label={`stackpay.app/pay/link/${universalLink.slug}`} />
                  </div>
                </div>

                <div className="mx-auto mt-5 max-w-[560px] rounded-[28px] border border-white/10 bg-black/20 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 font-mono text-sm text-white/78">
                      https://stackpay.app/pay/link/{universalLink.slug}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm text-white/45">
                  Payments sent here can use sBTC, STX, or USDCx and should appear through standard invoice and receipt tracking once payment integration is wired end to end.
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-6">
            <GlassCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Status</div>
                  <div className="mt-2 text-xl font-semibold text-white">Permanent route active</div>
                </div>
                <StatusBadge label={universalLink.is_active ? "Live" : "Inactive"} />
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Accepted assets</div>
                  <div className="mt-2 text-sm text-white/80">sBTC, STX, USDCx</div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Settlement wallet</div>
                  <div className="mt-2 text-sm text-white/80">
                    {settlementWallet ? truncateAddress(settlementWallet) : "No settlement wallet set"}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Public slug</div>
                  <div className="mt-2 text-sm text-white/80">{universalLink.slug}</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Actions</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={hostedHref}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs text-white/70"
                >
                  Open hosted page
                </Link>
                <button
                  onClick={() => void handleGenerate()}
                  disabled={submitting}
                  className="rounded-full border border-white/20 bg-white px-5 py-3 text-xs font-semibold text-black disabled:opacity-60"
                >
                  {submitting ? "Regenerating..." : "Regenerate QR"}
                </button>
              </div>
              {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
