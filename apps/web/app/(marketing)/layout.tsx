import MarketingHeader from "@/components/marketing/MarketingHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      {children}
    </div>
  );
}
