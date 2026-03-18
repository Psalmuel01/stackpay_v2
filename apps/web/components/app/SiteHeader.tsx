import Link from "next/link";
import Logo from "@/components/Logo";
import { sitePrimaryActions } from "@stackpay/ui";

export default function SiteHeader() {
  return (
    <header className="relative z-30 w-full">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="StackPay home">
          <Logo size={42} />
        </Link>

        <div className="flex items-center gap-3">
          {sitePrimaryActions.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                index === 0
                  ? "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
                  : "button-glow inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
