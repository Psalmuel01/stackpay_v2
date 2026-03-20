"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import { type Currency, formatCurrencyAmount } from "@/components/app/DemoProvider";
import { getConnectedWalletAddress } from "@/lib/stacks";

type PaymentLinkRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  is_universal: boolean;
  is_active: boolean;
  onchain_link_id?: string | null;
  default_currency?: Currency | null;
  default_amount?: number | null;
  metadata?: {
    pricingMode?: "fixed" | "suggested";
    suggestedAmounts?: number[];
  } | null;
  created_at: string;
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PaymentLinksPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [links, setLinks] = useState<PaymentLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWalletAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setLinks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/payment-links?walletAddress=${encodeURIComponent(walletAddress)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Failed to load payment links.");
        }

        if (!cancelled) {
          setLinks((payload.data ?? []) as PaymentLinkRecord[]);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load payment links.");
          setLinks([]);
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
  }, [walletAddress]);

  const multipayLinks = useMemo(
    () => links.filter((item) => item.kind === "multipay" && !item.is_universal),
    [links]
  );

  return (
    <div>
      <PageHeader
        title="Payment Links"
        subtitle="Review every reusable MultiPay route you have created, along with its pricing model and public checkout URL."
      />

      {!walletAddress ? (
        <GlassCard>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Payment links</div>
            <div className="mt-3 text-xl font-semibold text-white">Connect a wallet to load your links</div>
            <div className="mt-3 text-sm text-white/60">
              StackPay uses the connected merchant wallet to load your reusable public routes.
            </div>
          </div>
        </GlassCard>
      ) : loading ? (
        <GlassCard>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Loading</div>
            <div className="mt-3 text-xl font-semibold text-white">Loading payment links</div>
            <div className="mt-3 text-sm text-white/60">
              Fetching your active and historical MultiPay routes.
            </div>
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Payment links</div>
            <div className="mt-3 text-xl font-semibold text-white">Could not load payment links</div>
            <div className="mt-3 text-sm text-red-300">{error}</div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">MultiPay routes</div>
              <div className="mt-2 text-xl font-semibold text-white">
                {multipayLinks.length} reusable payment {multipayLinks.length === 1 ? "link" : "links"}
              </div>
            </div>
            <Link
              href="/create-invoice"
              className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Create new link
            </Link>
          </div>

          {multipayLinks.length ? (
            <div className="space-y-3">
              {multipayLinks.map((link) => {
                const suggestedAmounts =
                  ((link.metadata?.suggestedAmounts ?? []) as number[])
                    .map((value) => Number(value))
                    .filter((value) => Number.isFinite(value) && value > 0);
                const pricingLabel =
                  suggestedAmounts.length > 0
                    ? suggestedAmounts
                        .map((value) => formatCurrencyAmount(value, (link.default_currency ?? "STX") as Currency))
                        .join(" · ")
                    : link.default_amount
                      ? formatCurrencyAmount(Number(link.default_amount), (link.default_currency ?? "STX") as Currency)
                      : "No amount";

                return (
                  <div
                    key={link.id}
                    className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-5 xl:grid-cols-[1.2fr_1fr_180px]"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold text-white">{link.description || link.title}</div>
                        <StatusBadge
                          label={
                            link.onchain_link_id
                              ? link.is_active
                                ? "Live"
                                : "Inactive"
                              : "Pending"
                          }
                        />
                      </div>
                      <div className="mt-2 text-sm text-white/55">
                        /pay/link/{link.slug}
                      </div>
                      <div className="mt-3 text-sm text-white/60">
                        Created {formatCreatedAt(link.created_at)}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Pricing</div>
                        <div className="mt-2 text-sm text-white/80">{pricingLabel}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">Currency</div>
                        <div className="mt-2 text-sm text-white/80">{link.default_currency ?? "STX"}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-start justify-end gap-3 xl:flex-col xl:items-stretch">
                      <Link
                        href={`/pay/link/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white/75"
                      >
                        Open link
                      </Link>
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/pay/link/${link.slug}`)}
                        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/75"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-white/60">
              No MultiPay links yet. Create one from the invoice flow and it will appear here.
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
