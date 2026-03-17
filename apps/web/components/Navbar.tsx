import Link from "next/link";

const navItems = [
  { label: "Home", href: "#top" },
  { label: "Product", href: "#product" },
  { label: "Developers", href: "#developers" },
  { label: "Docs", href: "#docs" }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/30 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link href="#top" className="flex items-center gap-3">
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

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm text-white/70 md:flex">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition ${
                index === 0 ? "pill-active text-white" : "hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="button-glow rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white">
            Get Started
          </button>
          <button className="button-glow rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]">
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
}
