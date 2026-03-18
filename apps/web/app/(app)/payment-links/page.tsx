"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import StatusBadge from "@/components/app/StatusBadge";
import { type Currency, useDemo } from "@/components/app/DemoProvider";

const currencies: Currency[] = ["sBTC", "STX", "USDCx"];

function parseSuggestedAmounts(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PaymentLinksPage() {
  const { state, actions } = useDemo();
  const universalLink =
    state.paymentLinks.find((link) => link.mode === "donation" && link.isUniversal && link.isActive) ||
    state.paymentLinks.find((link) => link.mode === "donation" && link.isActive) ||
    state.paymentLinks[0];
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("Conference tip jar");
  const [slug, setSlug] = useState("conference-tip-jar");
  const [description, setDescription] = useState("Reusable public payment link for event attendees.");
  const [currency, setCurrency] = useState<Currency>(state.merchant.defaultCurrency);
  const [suggestedAmounts, setSuggestedAmounts] = useState("0.01, 0.025, 0.05");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const recentLinks = useMemo(
    () => state.paymentLinks.filter((link) => link.isActive).slice(0, 5),
    [state.paymentLinks]
  );

  async function handleCopyUniversal() {
    if (!universalLink) {
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/pay/link/${universalLink.slug}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleCreateCustomLink() {
    const link = actions.createPaymentLink({
      slug: slugify(slug),
      title,
      description,
      mode: "donation",
      currency,
      suggestedAmounts: parseSuggestedAmounts(suggestedAmounts),
      allowCustomAmount: true,
    });
    setCreatedSlug(link.slug);
  }

  return (
    <div>
      <PageHeader
        title="Payment Links"
        subtitle="Manage one universal public checkout link for quick sharing, then create more focused links for campaigns, events, or one-off collections."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="border border-white/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Universal payment link
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                One stable link for quick customer payments
              </div>
              <div className="mt-3 max-w-xl text-sm text-white/60">
                For the MVP, the universal link settles in a single asset. It currently uses your
                merchant default currency so the checkout stays predictable and simple.
              </div>
            </div>
            <StatusBadge label="Live" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr">
            <div className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Share link</div>
                <div className="mt-3 font-mono text-sm text-white/80">
                  stackpay.app/pay/link/{universalLink?.slug ?? state.merchant.slug}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Currency</div>
                  <div className="mt-2 text-sm text-white/80">
                    {universalLink?.currency ?? state.merchant.defaultCurrency}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Best used for</div>
                  <div className="mt-2 text-sm text-white/80">Tips, quick invoices, donation-style payments</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                If you want support for all three assets from one public route later, we should add an
                asset picker plus quote handling in the backend. For now, one link equals one settlement asset.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => actions.regenerateUniversalLink()}
                  className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black"
                >
                  Regenerate link
                </button>
                <button
                  onClick={handleCopyUniversal}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
                <Link
                  href={`/pay/link/${universalLink?.slug ?? state.merchant.slug}`}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70"
                >
                  Open hosted page
                </Link>
              </div>
            </div>

            {/* <div className="rounded-[32px] border border-white/10 bg-[#0f0f10] p-5">
              <QrPreview label={`stackpay.app/pay/link/${universalLink?.slug ?? state.merchant.slug}`} />
            </div> */}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Custom payment link</div>
          <div className="mt-2 text-2xl font-semibold text-white">Create a focused shareable link</div>
          <div className="mt-3 text-sm text-white/60">
            Use custom links for campaigns, event counters, support pages, or any shareable payment context
            that should not reuse the main universal route.
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.22em] text-white/40">Link title</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Conference tip jar"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.22em] text-white/40">Slug</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder="conference-tip-jar"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-white/40">Settlement asset</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {currencies.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCurrency(item)}
                    className={`rounded-full px-3 py-3 text-sm transition ${currency === item
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-white/40">Description</label>
              <textarea
                className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short merchant-facing context that appears on the hosted page."
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-white/40">Suggested amounts</label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                value={suggestedAmounts}
                onChange={(event) => setSuggestedAmounts(event.target.value)}
                placeholder="0.01, 0.025, 0.05"
              />
            </div>

            <button
              onClick={handleCreateCustomLink}
              className="w-full rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Create payment link
            </button>

            {createdSlug ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                Link created at{" "}
                <Link href={`/pay/link/${createdSlug}`} className="text-white">
                  /pay/link/{createdSlug}
                </Link>
              </div>
            ) : null}
          </div>
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Active links</div>
              <div className="mt-2 text-2xl font-semibold text-white">Current hosted payment routes</div>
            </div>
            <div className="text-sm text-white/45">{recentLinks.length} active links</div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <div className="hidden grid-cols-[1.3fr_1fr_120px_120px] gap-4 bg-white/5 px-5 py-4 text-[11px] uppercase tracking-[0.22em] text-white/40 md:grid">
              <div>Link</div>
              <div>Route</div>
              <div>Asset</div>
              <div>Action</div>
            </div>
            <div className="divide-y divide-white/10">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1.3fr_1fr_120px_120px] md:items-center"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{link.title}</div>
                    <div className="mt-1 text-xs text-white/45">
                      {link.isUniversal ? "Universal link" : "Custom link"} · {link.mode}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-white/65">/pay/link/{link.slug}</div>
                  <div className="text-sm text-white/75">{link.currency}</div>
                  <Link
                    href={`/pay/link/${link.slug}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
