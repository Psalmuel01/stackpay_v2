export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
            StackPay
          </div>
          <p className="mt-2 text-sm text-white/40">
            Bitcoin-native payments on Stacks. Invoices, subscriptions, and
            automated settlements for modern businesses.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-white/50">
          <span>Product</span>
          <span>Developers</span>
          <span>Security</span>
          <span>Status</span>
        </div>
      </div>
    </footer>
  );
}
