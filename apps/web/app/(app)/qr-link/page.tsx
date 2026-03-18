"use client";

import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import StatusBadge from "@/components/app/StatusBadge";
import { useDemo } from "@/components/app/DemoProvider";

export default function QrLinkPage() {
  const { state, actions } = useDemo();
  const universalLink =
    state.paymentLinks.find(
      (link) => link.mode === "multipay" && link.isUniversal && link.isActive
    ) ?? null;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!universalLink) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/pay/link/${universalLink.slug}`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleGenerate() {
    actions.regenerateUniversalLink({
      title: `${state.merchant.businessName} universal QR`,
      description: "Permanent universal QR route for quick daily payments.",
    });
  }

  return (
    <div>
      <PageHeader
        title="QR Link"
        subtitle="This will be a one-time setup. Generate your permanent QR code for daily, real-world payments."
      />

      {!universalLink ? (
        <GlassCard className="border border-white/20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Universal QR</div>
            <div className="mt-3 text-3xl font-semibold text-white">Generate your permanent payment QR</div>
            <div className="mt-3 text-sm text-white/60">
              This route accepts sBTC, STX, and USDCx. Customers choose the asset and amount at checkout,
              while you keep one stable QR for everyday use.
            </div>
            <button
              onClick={handleGenerate}
              className="mt-5 rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-black"
            >
              Generate QR link
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

          {/* Left — QR display */}
          <GlassCard className="border border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Universal QR</div>
                <div className="mt-2 text-2xl font-semibold text-white">Permanent payment route</div>
                <div className="mt-3 text-sm text-white/60">
                  Customers can pay with sBTC, STX, or USDCx from this one route. Keep this QR visible at
                  checkout desks, events, and in physical spaces.
                </div>
              </div>
              <StatusBadge label="Live" />
            </div>

            <div className="mt-5 rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="mx-auto max-w-[420px]">
                <div className="rounded-[32px] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
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
                Payments sent here are reflected through standard receipts and invoice records.
              </div>
            </div>
          </GlassCard>

          {/* Right — two separate cards */}
          <div className="flex flex-col gap-6">
            <GlassCard>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Link state</div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Accepted assets</div>
                  <div className="mt-2 text-sm text-white/80">sBTC, STX, USDCx</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Slug</div>
                  <div className="mt-2 text-sm text-white/80">{universalLink.slug}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Use case</div>
                  <div className="mt-2 text-sm text-white/80">Daily in-person payments and permanent QR sharing</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Actions</div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/pay/link/${universalLink.slug}`}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs text-white/70"
                >
                  Open hosted page
                </Link>
                <button
                  onClick={() => actions.deactivatePaymentLink(universalLink.id)}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs text-white/70"
                >
                  Deactivate
                </button>
                {/* <button
                  onClick={handleGenerate}
                  className="rounded-full border border-white/20 bg-white px-5 py-3 text-xs font-semibold text-black"
                >
                  Regenerate later
                </button> */}
              </div>
            </GlassCard>
          </div>

        </div>
      )}
    </div>
  );
}