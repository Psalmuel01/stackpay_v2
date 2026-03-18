import AppHeader from "@/components/app/AppHeader";
import MobileNav from "@/components/app/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="pt-10">
        <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
