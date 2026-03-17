import Link from "next/link";
import { ReactNode } from "react";

const appNav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Create Invoice", href: "/create-invoice" },
  { label: "Invoices", href: "/invoices" },
  { label: "Subscriptions", href: "/subscriptions" },
  { label: "Settlements", href: "/settlements" },
  { label: "Explorer", href: "/explorer" },
  { label: "Developer", href: "/developer" },
  { label: "Profile", href: "/profile" }
];

const mobileNav = [
  { label: "Dashboard", short: "Dashboard", href: "/dashboard" },
  { label: "Create Invoice", short: "Create", href: "/create-invoice" },
  { label: "Invoices", short: "Invoices", href: "/invoices" },
  { label: "Profile", short: "Profile", href: "/profile" }
];

export default function AppShell({
  active,
  title,
  subtitle,
  children
}: {
  active: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <div className="h-4 w-4 rotate-45 rounded-sm border border-white/60" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                StackPay
              </div>
              <div className="text-xs text-white/40">Bitcoin-native payments</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-[13px] text-white/70 xl:flex">
            {appNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 transition ${
                  active === item.label ? "pill-active text-white" : "hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button className="button-glow rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]">
            Connect Wallet
          </button>
        </div>
      </header>

      <main className="section-pad pt-10">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 space-y-3">
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">StackPay Console</span>
            <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
            {subtitle ? <p className="text-sm text-white/60 md:text-base">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </main>

      <nav className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/60 p-2 text-xs text-white/70 backdrop-blur xl:hidden">
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 transition ${
              active === item.label ? "pill-active text-white" : "hover:text-white"
            }`}
          >
            {item.short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
