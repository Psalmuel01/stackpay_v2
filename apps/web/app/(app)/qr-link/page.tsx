"use client";

import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import StatusBadge from "@/components/app/StatusBadge";
import { useDemo } from "@/components/app/DemoProvider";

function parseSuggestedAmounts(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export default function QrLinkPage() {
  const { state, actions } = useDemo();
  const universalLink =
    state.paymentLinks.find((link) => link.mode === "donation" && link.isUniversal && link.isActive) ||
    state.paymentLinks[0];
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("Conference tip jar");
  const [slug, setSlug] = useState("conference-tip-jar");
  const [description, setDescription] = useState("Reusable public payment link for event attendees.");
  const [suggestedAmounts, setSuggestedAmounts] = useState("0.01,0.025,0.05");

  async function handleCopy() {
    if (!universalLink) {
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/pay/link/${universalLink.slug}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const channels = [
    { name: "Countertop QR", description: "Tap-to-pay at checkout desks", status: "Active" },
    { name: "Payment link", description: "Share through email, DM, and receipts", status: "Active" },
    { name: "POS embed", description: "Resolved via hosted page or invoice routing", status: "Draft" },
  ];

  return (
    <div>
      <PageHeader
        title="QR Link"
        subtitle="Generate reusable payment entry points for in-person and shared payment flows, then open the live hosted link route from the same demo state."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard className="border border-white/20">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Universal payment link
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                Point customers to one stable payment entry point
              </div>
            </div>
            <StatusBadge label="Active" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Slug", universalLink?.slug ?? state.merchant.slug],
              ["Currency mode", state.merchant.defaultCurrency],
              ["QR refresh", "Regeneratable"],
              ["Fallback", "Hosted payment page"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                  {label}
                </div>
                <div className="mt-2 text-sm text-white/78">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              Flow
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Customer scans QR or opens link",
                "Hosted page resolves invoice, donation, or subscription mode",
                "Checkout continues into the invoice payment surface",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                    0{index + 1}
                  </div>
                  <div className="mt-2 text-sm text-white/72">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
            Create custom link
          </div>
          <div className="mt-4 space-y-3 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Link title"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="custom-slug"
            />
            <textarea
              className="h-24 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short description shown on the hosted page"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
              value={suggestedAmounts}
              onChange={(event) => setSuggestedAmounts(event.target.value)}
              placeholder="0.01,0.025,0.05"
            />
            <button
              onClick={() =>
                actions.createPaymentLink({
                  slug,
                  title,
                  description,
                  mode: "donation",
                  currency: state.merchant.defaultCurrency,
                  suggestedAmounts: parseSuggestedAmounts(suggestedAmounts),
                  allowCustomAmount: true,
                })
              }
              className="w-full rounded-full border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-black"
            >
              Create customizable link
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <QrPreview label={`stackpay.app/pay/link/${universalLink?.slug ?? state.merchant.slug}`} />
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => actions.regenerateUniversalLink()}
              className="flex-1 rounded-full border border-white/35 bg-white px-4 py-3 text-sm font-semibold text-black"
            >
              Regenerate
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <Link
            href={`/pay/link/${universalLink?.slug ?? state.merchant.slug}`}
            className="mt-3 flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
          >
            Open hosted route
          </Link>
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard>
          <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Distribution channels
          </div>
          <div className="space-y-3">
            {channels.map((channel, index) => (
              <div
                key={channel.name}
                className={`rounded-2xl border px-4 py-4 ${index === 0 ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">{channel.name}</div>
                    <div className="mt-1 text-sm text-white/55">{channel.description}</div>
                  </div>
                  <StatusBadge label={channel.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Latest generated links
          </div>
          <div className="space-y-3">
            {state.paymentLinks.slice(0, 3).map((link) => (
              <div
                key={link.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="text-sm font-medium text-white">{link.title}</div>
                <div className="mt-2 font-mono text-xs text-white/65">
                  stackpay.app/pay/link/{link.slug}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                  <span>{link.isUniversal ? "universal" : link.mode}</span>
                  <Link href={`/pay/link/${link.slug}`} className="text-white/65">
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
