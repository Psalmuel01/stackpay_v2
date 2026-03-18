export default function QrPreview({
  label = "stackpay://pay/invoice/6E71A3",
}: {
  label?: string;
}) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_55%,transparent)] p-6">
      <div className="mx-auto grid w-[220px] grid-cols-7 gap-2 rounded-[28px] border border-white/10 bg-[#101010] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        {Array.from({ length: 49 }).map((_, index) => {
          const active = [
            0, 1, 2, 7, 9, 14, 15, 16, 4, 5, 6, 11, 13, 18, 19, 20, 28, 29, 30,
            35, 37, 42, 43, 44, 32, 33, 34, 39, 41, 46, 47, 48, 22, 24, 26, 31,
            38, 40, 10, 17, 21, 23, 25, 27,
          ].includes(index);

          const corner =
            index < 3 ||
            (index > 6 && index < 10) ||
            (index > 13 && index < 17) ||
            (index > 3 && index < 7) ||
            (index > 31 && index < 35) ||
            (index > 38 && index < 42) ||
            (index > 45 && index < 49);

          return (
            <div
              key={index}
              className={`aspect-square rounded-[4px] ${
                active ? "bg-white" : "bg-white/8"
              } ${corner && active ? "shadow-[0_0_12px_rgba(245,158,11,0.28)]" : ""}`}
            />
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
          Universal payment link
        </div>
        <div className="mt-2 font-mono text-xs text-white/70">{label}</div>
      </div>
    </div>
  );
}
