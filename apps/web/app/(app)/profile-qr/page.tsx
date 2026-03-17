import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";

export default function ProfileQrPage() {
  return (
    <div>
      <PageHeader
        title="Profile QR"
        subtitle="Generate a universal QR for fast in-person payments."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Universal QR</div>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="h-36 w-36 rounded-2xl border border-white/10 bg-white/10" />
            <p className="text-sm text-white/60">Initialize your QR code for fast payments at any location.</p>
            <button className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black">
              Initialize QR Codes
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Usage</div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Print for countertop QR payments.</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Embed in invoices, receipts, and POS terminals.</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
