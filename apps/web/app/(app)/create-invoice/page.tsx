"use client";

import { useState } from "react";
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

const types: Array<{ id: InvoiceType; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "subscription", label: "Subscription" },
  { id: "donation", label: "Donation" },
];

const currencies: Currency[] = ["sBTC", "STX", "USDCx"];
const expirations = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
  { label: "Never", hours: null },
];

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
  const [result, setResult] = useState<{ id: string; href: string; draft: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const href = result ? `/pay/${result.id}` : "/pay/demo-preview";

  async function handleCopy() {
    if (!result) {
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/pay/${result.id}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function submit(draft: boolean) {
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
      id: invoice.id,
      href: `/pay/${invoice.id}`,
      draft,
    });
  }

  return (
    <div>
      <PageHeader
        title="Create Invoice"
        subtitle="Build a payment request, generate a hosted link and QR code, and test the entire invoice handoff without touching a backend yet."
      />
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="border border-white/20">
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Invoice details
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Invoice type</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {types.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setType(item.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${type === item.id
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Amount</label>
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
                      className={`rounded-full px-3 py-2 text-xs transition ${currency === item
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
                    className={`rounded-full px-3 py-2 text-xs transition ${expiration === item.hours
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Recipient</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {state.merchant.settlementWallet || "Main settlement wallet"}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Notifications</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  Webhook + in-app delivery log
                </div>
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

            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-white/40">Metadata</label>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                value={metadata}
                onChange={(event) => setMetadata(event.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                What happens next
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  "Invoice is stored in the demo merchant state",
                  "Hosted checkout and QR surface are generated immediately",
                  "Explorer, dashboard, and developer logs update in place",
                ].map((step, index) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      0{index + 1}
                    </div>
                    <div className="mt-2 text-sm text-white/65">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => submit(false)}
                className="button-glow rounded-full border border-white/50 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Generate invoice
              </button>
              <button
                onClick={() => submit(true)}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70"
              >
                Save draft
              </button>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Hosted payment preview
            </div>
            <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-semibold text-white">
                {customer || state.merchant.businessName}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {type} invoice · {formatCurrencyAmount(Number(amount || 0), currency)} ·{" "}
                {expiration === null ? "no expiry" : `expires in ${expiration}h`}
              </div>
              <div className="mt-6">
                <QrPreview label={result ? `stackpay.app/pay/${result.id}` : "stackpay.app/pay/demo-preview"} />
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
                href={href}
                className={`flex w-full items-center justify-center rounded-full border px-4 py-3 text-xs ${result
                    ? "border-white/35 bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/45"
                  }`}
              >
                {result ? "Open hosted checkout" : "Hosted checkout appears here"}
              </Link>
            </div>
          </GlassCard>

          {result ? (
            <GlassCard className="border border-white/20">
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                Generated result
              </div>
              <div className="mt-4 text-sm text-white/75">
                {result.id} was {result.draft ? "saved as a draft" : "created as a pending invoice"}.
              </div>
              <div className="mt-4 font-mono text-xs text-white/55">
                {result.href}
              </div>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
