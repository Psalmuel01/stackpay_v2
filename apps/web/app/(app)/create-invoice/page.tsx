"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";
import { type Currency, formatCurrencyAmount, useDemo } from "@/components/app/DemoProvider";

type CreateFlow = "standard" | "multipay";

const flows: Array<{ id: CreateFlow; label: string; summary: string }> = [
  {
    id: "standard",
    label: "Standard",
    summary: "One invoice, one payment. The invoice closes after it is paid.",
  },
  {
    id: "multipay",
    label: "MultiPay",
    summary: "Reusable public route for multiple payments. Each customer payment creates a fresh invoice.",
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateInvoicePage() {
  const { state, actions } = useDemo();
  const [flow, setFlow] = useState<CreateFlow>("standard");
  const [currency, setCurrency] = useState<Currency>("sBTC");
  const [amount, setAmount] = useState("");
  const [expiration, setExpiration] = useState<number | null>(24);

  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [metadata, setMetadata] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [amountStep, setAmountStep] = useState("");

  const [result, setResult] = useState<{
    title: string;
    href: string;
    summary: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const previewLabel = useMemo(() => {
    if (result) {
      return result.href.replace(/^\//, "stackpay.app/");
    }
    if (flow === "multipay") {
      return `stackpay.app/pay/link/${slugify(slug || "multipay")}`;
    }
    return "stackpay.app/pay/demo-preview";
  }, [flow, result, slug]);

  async function handleCopy() {
    if (!result) {
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}${result.href}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function submit(draft: boolean) {
    if (flow === "standard") {
      const invoice = actions.createInvoice(
        {
          type: "standard",
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
          ? "Draft invoice saved in the workspace."
          : "Single-payment invoice created. It will close after payment.",
      });
      return;
    }

    const link = actions.createPaymentLink({
      slug: slugify(slug || `${state.merchant.slug}-multipay`),
      title: title || "MultiPay route",
      description,
      mode: "multipay",
      currency,
      defaultAmount: Number(amount || 0),
      amountStep: Number(amountStep || 0),
      allowCustomAmount: true,
    });

    setResult({
      title: link.id,
      href: `/pay/link/${link.slug}`,
      summary: "MultiPay link created. It stays active and can generate multiple payments over time.",
    });
  }

  return (
    <div>
      <PageHeader
        title="Create Invoice"
        subtitle="Choose between a standard single-payment invoice and a reusable MultiPay route."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="border border-white/20">
          <div className="space-y-5">
            <div>
              <div className="mt-3 flex flex-wrap gap-3">
                {flows.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFlow(item.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      flow === item.id
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-white/55">
                {flows.find((item) => item.id === flow)?.summary}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">
                  {flow === "multipay" ? "Default amount" : "Amount"}
                </label>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    className="w-full bg-transparent text-sm text-white/80 outline-none"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={flow === "multipay" ? "Starting checkout amount" : "Invoice amount"}
                  />
                  <span className="text-xs text-white/55">{currency}</span>
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

            {flow === "standard" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Customer</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                      placeholder="Customer or company"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Email</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="billing@example.com"
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
                    placeholder="What the customer is paying for"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.24em] text-white/40">Metadata</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                    value={metadata}
                    onChange={(event) => setMetadata(event.target.value)}
                    placeholder="campaign=spring"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Link title</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Countertop checkout"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Public slug</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={slug}
                      onChange={(event) => setSlug(slugify(event.target.value))}
                      placeholder="countertop-checkout"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Amount step</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={amountStep}
                      onChange={(event) => setAmountStep(event.target.value)}
                      placeholder="Plus/minus increment"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.24em] text-white/40">Description</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Short note shown on hosted checkout"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  MultiPay links stay active after each payment. Every customer session creates its own invoice,
                  so you can reuse the same route for ongoing payments.
                </div>
              </>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Recipient</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {state.merchant.settlementWallet.substring(0, 6)}...{state.merchant.settlementWallet.slice(-4)}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Outcome</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {flow === "standard"
                    ? "Creates a single-payment invoice"
                    : "Creates a reusable MultiPay route"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => submit(false)}
                className="button-glow rounded-full border border-white/50 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                {flow === "standard" ? "Generate invoice" : "Create MultiPay route"}
              </button>
              {flow === "standard" ? (
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

        <div className="space-y-3">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Hosted preview</div>
            <div className="mt-3 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-semibold text-white">
                {flow === "standard" ? customer || "New invoice" : title || "MultiPay route"}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {flow === "standard"
                  ? `Single payment · ${formatCurrencyAmount(Number(amount || 0), currency)}`
                  : `Reusable route · starts at ${formatCurrencyAmount(Number(amount || 0), currency)}`}
              </div>
              <div className="mt-5">
                <QrPreview label={previewLabel} />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Distribution</div>
            <div className="mt-3 space-y-3">
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
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Generated result</div>
              <div className="mt-3 text-sm text-white/75">{result.summary}</div>
              <div className="mt-3 text-sm text-white">{result.title}</div>
              <div className="mt-3 font-mono text-xs text-white/55">{result.href}</div>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
