import GlassCard from "@/components/GlassCard";
import ConnectWalletButton from "@/components/app/ConnectWalletButton";
import StatusBadge from "@/components/app/StatusBadge";
import { supportedCurrencies } from "@stackpay/domain";

export default function HostedPaymentPage({
  params,
}: {
  params: { invoiceId: string };
}) {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Hosted payment</div>
            <h1 className="text-4xl font-semibold text-white">Invoice {params.invoiceId}</h1>
            <p className="max-w-2xl text-sm text-white/60 md:text-base">
              This route is the missing handoff between invoice creation and customer payment. It now
              exists as the canonical hosted payment surface for QR links and shared invoices.
            </p>
          </div>

          <GlassCard className="border border-accent/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                  Merchant
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">StackPay Demo Merchant</div>
              </div>
              <StatusBadge label="Pending" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Amount</div>
                <div className="mt-2 text-3xl font-semibold text-white">0.018 sBTC</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Description</div>
                <div className="mt-2 text-sm text-white/75">April StackPay Pro invoice</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                Accepted currencies
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {supportedCurrencies.map((currency) => (
                  <div
                    key={currency.symbol}
                    className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75"
                  >
                    {currency.symbol}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Checkout</div>
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/70">
                Next step for MVP: bind this screen to a real invoice lookup, then call the processor
                contract based on selected currency.
              </div>
              <ConnectWalletButton />
              <button className="w-full rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black">
                Pay invoice
              </button>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Lifecycle</div>
            <div className="mt-4 space-y-3">
              {[
                "Load invoice and merchant details by public id",
                "Connect customer wallet and select supported asset",
                "Submit processor call and redirect to receipt page",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-accent">
                    0{index + 1}
                  </div>
                  <div className="mt-2 text-sm text-white/70">{step}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
