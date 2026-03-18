"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import { type Currency, formatCurrencyAmount, useDemo } from "@/components/app/DemoProvider";

const currencies: Currency[] = ["sBTC", "STX", "USDCx"];

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
  const recentLinks = useMemo(
    () => state.paymentLinks.filter((link) => link.isActive).slice(0, 6),
    [state.paymentLinks]
  );

  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>(state.merchant.defaultCurrency);
  const [defaultAmount, setDefaultAmount] = useState("");
  const [amountStep, setAmountStep] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

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
      title: title || "Custom payment link",
      description,
      mode: "donation",
      currency,
      defaultAmount: Number(defaultAmount || 0),
      amountStep: Number(amountStep || 0),
      allowCustomAmount: true,
    });
    setCreatedSlug(link.slug);
    setTitle("");
    setSlug("");
    setDescription("");
    setDefaultAmount("");
    setAmountStep("");
  }

  return (
    <div>
      <PageHeader
        title="Payment Links"
        subtitle="Use one universal link for fast sharing, then create custom payment links for campaigns, events, or focused collections."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="border border-white/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Universal payment link
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                One stable public route for quick payments
              </div>
              <div className="mt-3 max-w-xl text-sm text-white/60">
                For MVP, a payment link should settle in one asset, not all assets at once. That keeps
                the hosted checkout simple and avoids quote logic before the backend is in place.
              </div>
            </div>
            <StatusBadge label="Live" />
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Public route</div>
            <div className="mt-3 font-mono text-sm text-white/80">
              stackpay.app/pay/link/{universalLink?.slug ?? state.merchant.slug}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Asset</div>
              <div className="mt-2 text-sm text-white/80">
                {universalLink?.currency ?? state.merchant.defaultCurrency}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Default amount</div>
              <div className="mt-2 text-sm text-white/80">
                {universalLink?.defaultAmount
                  ? formatCurrencyAmount(universalLink.defaultAmount, universalLink.currency)
                  : "Not set"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Amount step</div>
              <div className="mt-2 text-sm text-white/80">
                {universalLink?.amountStep
                  ? formatCurrencyAmount(universalLink.amountStep, universalLink.currency)
                  : "Flexible"}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
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
        </GlassCard>

        <GlassCard>
          <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Custom payment link</div>
          <div className="mt-2 text-2xl font-semibold text-white">Create a focused link</div>
          <div className="mt-3 text-sm text-white/60">
            Ideal for support pages, conference counters, product launches, and other share flows that
            should have their own title, copy, and default checkout amount.
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.22em] text-white/40">Default amount</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                  value={defaultAmount}
                  onChange={(event) => setDefaultAmount(event.target.value)}
                  placeholder="Starting amount at checkout"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.22em] text-white/40">Amount step</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                  value={amountStep}
                  onChange={(event) => setAmountStep(event.target.value)}
                  placeholder="Plus/minus increment"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-white/40">Description</label>
              <textarea
                className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short context shown on the hosted payment page."
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
            <div className="hidden grid-cols-[1.2fr_1fr_140px_140px] gap-4 bg-white/5 px-5 py-4 text-[11px] uppercase tracking-[0.22em] text-white/40 lg:grid">
              <div>Link</div>
              <div>Route</div>
              <div>Amount</div>
              <div>Action</div>
            </div>
            <div className="divide-y divide-white/10">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_1fr_140px_140px] lg:items-center"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{link.title}</div>
                    <div className="mt-1 text-xs text-white/45">
                      {link.isUniversal ? "Universal link" : "Custom link"} · {link.currency}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-white/65">/pay/link/{link.slug}</div>
                  <div className="text-sm text-white/75">
                    {link.defaultAmount ? formatCurrencyAmount(link.defaultAmount, link.currency) : "Flexible"}
                  </div>
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
