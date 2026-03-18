"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import {
  type Currency,
  type InvoiceType,
  formatCurrencyAmount,
  useDemo,
} from "@/components/app/DemoProvider";

const types: Array<{ id: InvoiceType; label: string; summary: string }> = [
  {
    id: "standard",
    label: "Standard",
    summary: "Fixed amount invoice with expiry and direct hosted checkout.",
  },
  {
    id: "subscription",
    label: "Subscription",
    summary: "Create a recurring plan, optional seed subscriber, and public plan checkout link.",
  },
  {
    id: "donation",
    label: "Donation",
    summary: "Create a reusable public payment link with suggested amounts and custom slug.",
  },
];

const currencies: Currency[] = ["sBTC", "STX", "USDCx"];
const expirations = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
  { label: "Never", hours: null },
];
const intervals = [
  { label: "Weekly", seconds: 60 * 60 * 24 * 7 },
  { label: "Monthly", seconds: 60 * 60 * 24 * 30 },
  { label: "Quarterly", seconds: 60 * 60 * 24 * 90 },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSuggestedAmounts(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export default function CreateInvoicePage() {
  const { state, actions } = useDemo();
  const [type, setType] = useState<InvoiceType>("standard");
  const [amount, setAmount] = useState("0.018");
  const [currency, setCurrency] = useState<Currency>("sBTC");
  const [expiration, setExpiration] = useState<number | null>(24);
  const [customer, setCustomer] = useState("Studio Noon");
  const [email, setEmail] = useState("billing@studionoon.dev");
  const [description, setDescription] = useState("April subscription for StackPay Pro");
  const [metadata, setMetadata] = useState("campaign=spring");

  const [planName, setPlanName] = useState("StackPay Pro");
  const [interval, setInterval] = useState(intervals[1]);
  const [seedSubscriber, setSeedSubscriber] = useState(true);

  const [donationTitle, setDonationTitle] = useState("Support Studio Noon");
  const [donationSlug, setDonationSlug] = useState("studio-noon-support");
  const [suggestedAmounts, setSuggestedAmounts] = useState("0.01,0.025,0.05");

  const [result, setResult] = useState<{
    title: string;
    href: string;
    summary: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeType = types.find((item) => item.id === type)!;
  const previewLabel = useMemo(() => {
    if (result) {
      return result.href.replace(/^\//, "stackpay.app/");
    }
    if (type === "subscription") {
      return `stackpay.app/pay/link/${slugify(planName || "subscription")}`;
    }
    if (type === "donation") {
      return `stackpay.app/pay/link/${slugify(donationSlug || "donation")}`;
    }
    return "stackpay.app/pay/demo-preview";
  }, [donationSlug, planName, result, type]);

  async function handleCopy() {
    if (!result) {
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}${result.href}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function submit(draft: boolean) {
    if (type === "standard") {
      const invoice = actions.createInvoice(
        {
          type,
          customer,
          email,
          amount: Number(amount || 0),
          currency,
          description,
          expirationHours: expiration,
          recipientLabel: state.merchant.settlementWallet || "Main settlement wallet",
          metadata,
        },
        { draft }
      );
      setResult({
        title: invoice.id,
        href: `/pay/${invoice.id}`,
        summary: draft
          ? "Draft invoice saved to the workspace."
          : "Hosted invoice created and ready to share.",
      });
      return;
    }

    if (type === "subscription") {
      const plan = actions.createPlan({
        name: planName,
        amount: Number(amount || 0),
        currency,
        intervalLabel: interval.label,
        intervalSeconds: interval.seconds,
        metadata,
      });
      const link = actions.createPaymentLink({
        slug: slugify(planName || `${state.merchant.slug}-plan`),
        title: `${plan.name} checkout`,
        description: `${plan.name} subscription checkout for recurring billing.`,
        mode: "subscription",
        currency,
        planId: plan.id,
      });
      if (seedSubscriber && customer && email) {
        actions.addSubscriber({
          planId: plan.id,
          customer,
          email,
          seats: 1,
        });
      }
      setResult({
        title: plan.id,
        href: `/pay/link/${link.slug}`,
        summary: "Subscription plan, public checkout link, and optional seed subscriber created.",
      });
      return;
    }

    const link = actions.createPaymentLink({
      slug: slugify(donationSlug || `${state.merchant.slug}-support`),
      title: donationTitle,
      description,
      mode: "donation",
      currency,
      suggestedAmounts: parseSuggestedAmounts(suggestedAmounts),
      allowCustomAmount: true,
    });
    setResult({
      title: link.id,
      href: `/pay/link/${link.slug}`,
      summary: `Reusable donation link created with suggested amounts ${suggestedAmounts}.`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Create Payment Flow"
        subtitle="Switch between one-time invoices, subscription checkout, and reusable donation links. Each mode now has its own form and output behavior."
      />
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="border border-white/20">
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Flow details
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Flow type</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {types.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setType(item.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      type === item.id
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-white/55">{activeType.summary}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">
                  {type === "donation" ? "Suggested amount" : "Amount"}
                </label>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    className="w-full bg-transparent text-sm text-white/80 outline-none"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                  />
                  <span className="text-xs text-accent">{currency}</span>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Currency</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {currencies.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCurrency(item)}
                      className={`rounded-full px-3 py-2 text-xs transition ${
                        currency === item
                          ? "border border-white/20 bg-white text-black"
                          : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {type === "standard" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Customer</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Email</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Expiration</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expirations.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setExpiration(item.hours)}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          expiration === item.hours
                            ? "border border-white/20 bg-white text-black"
                            : "border border-white/10 bg-white/5 text-white/70"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Description</label>
                  <textarea
                    className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
              </>
            ) : null}

            {type === "subscription" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Plan name</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={planName}
                      onChange={(event) => setPlanName(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Billing interval</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {intervals.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setInterval(item)}
                          className={`rounded-full px-3 py-2 text-xs transition ${
                            interval.label === item.label
                              ? "border border-white/20 bg-white text-black"
                              : "border border-white/10 bg-white/5 text-white/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Seed subscriber</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Subscriber email</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSeedSubscriber((value) => !value)}
                  className={`inline-flex rounded-full px-4 py-2 text-xs transition ${
                    seedSubscriber
                      ? "border border-white/20 bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {seedSubscriber ? "Seed subscriber on" : "Seed subscriber off"}
                </button>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Plan metadata</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                    value={metadata}
                    onChange={(event) => setMetadata(event.target.value)}
                  />
                </div>
              </>
            ) : null}

            {type === "donation" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Link title</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={donationTitle}
                      onChange={(event) => setDonationTitle(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Custom slug</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={donationSlug}
                      onChange={(event) => setDonationSlug(slugify(event.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Suggested amounts</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                    value={suggestedAmounts}
                    onChange={(event) => setSuggestedAmounts(event.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Campaign copy</label>
                  <textarea
                    className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
              </>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Recipient</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {state.merchant.settlementWallet.substring(0, 6)}...{state.merchant.settlementWallet.slice(-4) || "Main settlement wallet"}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Outcome</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {type === "standard"
                    ? "Creates an invoice immediately"
                    : type === "subscription"
                      ? "Creates a plan + public checkout link"
                      : "Creates a reusable payment link"}
                </div>
              </div>
            </div>

            {/* <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                What happens next
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(type === "standard"
                    ? [
                      "Invoice is stored in workspace state",
                      "Hosted checkout opens immediately",
                      "Invoices and dashboard update after payment",
                    ]
                  : type === "subscription"
                    ? [
                        "Plan is created in subscriptions",
                        "Public link starts subscription enrollment",
                        "Renewal invoices can be generated from the plan",
                      ]
                    : [
                        "Public link becomes shareable instantly",
                        "Donor picks or enters amount on the public page",
                        "Donation invoice is created on demand",
                      ]
                ).map((step, index) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      0{index + 1}
                    </div>
                    <div className="mt-2 text-sm text-white/65">{step}</div>
                  </div>
                ))}
              </div>
            </div> */}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => submit(false)}
                className="button-glow rounded-full border border-white/50 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                {type === "standard"
                  ? "Generate invoice"
                  : type === "subscription"
                    ? "Create plan flow"
                    : "Create share link"}
              </button>
              {type === "standard" ? (
                <button
                  onClick={() => submit(true)}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70"
                >
                  Save draft
                </button>
              ) : null}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Hosted preview
            </div>
            <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-semibold text-white">
                {type === "subscription"
                  ? planName
                  : type === "donation"
                    ? donationTitle
                    : customer || state.merchant.businessName}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {type === "subscription"
                  ? `${interval.label} · ${formatCurrencyAmount(Number(amount || 0), currency)}`
                  : type === "donation"
                    ? `Reusable link · ${parseSuggestedAmounts(suggestedAmounts).length || 1} suggested amount options`
                    : `${type} invoice · ${formatCurrencyAmount(Number(amount || 0), currency)}`}
              </div>
              <div className="mt-6">
                <QrPreview label={previewLabel} />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Distribution
            </div>
            <div className="mt-4 space-y-3">
              <button
                onClick={handleCopy}
                disabled={!result}
                className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 disabled:opacity-50"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <Link
                href={result?.href ?? "#"}
                className={`flex w-full items-center justify-center rounded-full border px-4 py-3 text-xs ${
                  result
                    ? "border-white/35 bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/45"
                }`}
              >
                {result ? "Open generated flow" : "Generated flow appears here"}
              </Link>
            </div>
          </GlassCard>

          {result ? (
            <GlassCard className="border border-white/20">
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Generated result
              </div>
              <div className="mt-4 text-sm text-white/75">{result.summary}</div>
              <div className="mt-3 text-sm text-white">{result.title}</div>
              <div className="mt-4 font-mono text-xs text-white/55">{result.href}</div>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
