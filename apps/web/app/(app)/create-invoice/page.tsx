import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";

const types = ["Standard", "Subscription", "Donation"];
const currencies = ["sBTC", "STX", "USDCx"];
const expirations = ["1h", "24h", "7d", "30d", "Never"];

export default function CreateInvoicePage() {
  return (
    <div>
      <PageHeader
        title="Create Invoice"
        subtitle="Generate a payment link with QR code, expiration, and on-chain settlement rules."
      />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-6 text-sm uppercase tracking-[0.3em] text-white/40">Invoice details</div>

          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Invoice type</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {types.map((type, idx) => (
                  <button
                    key={type}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      idx === 0
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
                <label className="text-xs uppercase tracking-[0.3em] text-white/40">Amount</label>
                <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    className="w-full bg-transparent text-sm text-white/80 outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-xs text-white/40">sBTC</span>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-white/40">Currency</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {currencies.map((currency, idx) => (
                    <button
                      key={currency}
                      className={`rounded-full px-3 py-2 text-xs transition ${
                        idx === 0
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
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">Expiration</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {expirations.map((exp, idx) => (
                  <button
                    key={exp}
                    className={`rounded-full px-3 py-2 text-xs transition ${
                      idx === 1
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">Description</label>
              <textarea
                className="mt-2 h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                placeholder="Monthly subscription for StackPay Pro"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="button-glow rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]">
                Generate invoice
              </button>
              <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70">
                Save draft
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="space-y-5">
          <div className="text-sm uppercase tracking-[0.3em] text-white/40">Live preview</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto mb-4 h-32 w-32 rounded-2xl border border-white/10 bg-white/10" />
            <div className="text-base font-semibold">stackpay.app/pay/0x8c...a41</div>
            <p className="mt-2 text-sm text-white/60">Expires in 24 hours · sBTC</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              Copy link
            </button>
            <button className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              Download QR
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
