"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation } from "@stackpay/ui";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 p-2 text-xs text-white/70 backdrop-blur xl:hidden">
      {mobileNavigation.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-2 transition ${
              active ? "pill-active text-white" : "hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
