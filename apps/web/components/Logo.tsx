export default function Logo({ size = 40 }: { size?: number }) {
  const markSize = Math.max(18, Math.round(size * 0.52));
  const lineHeight = Math.max(3, Math.round(markSize * 0.11));
  const radius = Math.max(10, Math.round(size * 0.22));

  return (
    <div className="flex items-center gap-">
      <div
        className="relative flex items-center justify-center bg-[#0b0b0b]"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M10 16H54V28H10V16Z" fill="white" />
          <path d="M10 30H42V42H10V30Z" fill="white" fillOpacity="0.92" />
          <path d="M22 44H54V56H22V44Z" fill="white" fillOpacity="0.84" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
          StackPay
        </div>
      </div>
    </div>
  );
}
