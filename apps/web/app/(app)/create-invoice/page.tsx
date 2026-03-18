import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import QrPreview from "@/components/app/QrPreview";

const types = ["Standard", "Subscription", "Donation"];
const currencies = ["sBTC", "STX", "USDCx"];
const expirations = ["1h", "24h", "7d", "30d", "Never"];

export default function CreateInvoicePage() {
  return (
    <div>
      <PageHeader
        title="Create Invoice"
        subtitle="Build the payment request, preview the hosted flow, and hand off to a shareable link or QR."
      />
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="border border-accent/20">
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Invoice details
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Invoice type</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {types.map((type, idx) => (
                  <button
                    key={type}
                    className={`rounded-full px-4 py-2 text-sm transition ${idx === 0
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                  >
                    {type}
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
                    placeholder="0.00"
                  />
                  <span className="text-xs text-accent">sBTC</span>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Currency</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {currencies.map((currency, idx) => (
                    <button
                      key={currency}
                      className={`rounded-full px-3 py-2 text-xs transition ${idx === 0
                          ? "border border-white/20 bg-white text-black"
                          : "border border-white/10 bg-white/5 text-white/70"
                        }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-white/40">Expiration</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {expirations.map((exp, idx) => (
                  <button
                    key={exp}
                    className={`rounded-full px-3 py-2 text-xs transition ${idx === 1
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Recipient</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  Main settlement wallet
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.24em] text-white/40">Notifications</label>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  Webhook + in-app toast
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-white/40">Description</label>
              <textarea
                className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                placeholder="April subscription for StackPay Pro"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                What happens next
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  "Invoice record is written on-chain",
                  "Hosted link and QR are generated instantly",
                  "Payment updates sync back to the dashboard",
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
              <button className="button-glow rounded-full border border-accent/50 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]">
                Generate invoice
              </button>
              <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70">
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
              <div className="text-lg font-semibold text-white">Studio Noon</div>
              <div className="mt-1 text-sm text-white/55">
                One-time invoice · 0.018 sBTC · expires in 24 hours
              </div>
              <div className="mt-6">
                <QrPreview label="stackpay.app/pay/INV_9821" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">
              Distribution
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                Copy link
              </button>
              <button className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                Download QR
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
