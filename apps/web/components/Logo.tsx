export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full border border-white/20 bg-white/5"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 20.5C12 15.8056 15.8056 12 20.5 12H43.5C48.1944 12 52 15.8056 52 20.5V43.5C52 48.1944 48.1944 52 43.5 52H20.5C15.8056 52 12 48.1944 12 43.5V20.5Z"
            stroke="white"
            strokeOpacity="0.6"
            strokeWidth="3"
          />
          <path
            d="M22 23H42"
            stroke="white"
            strokeOpacity="0.9"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M22 32H38"
            stroke="white"
            strokeOpacity="0.7"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M22 41H34"
            stroke="white"
            strokeOpacity="0.5"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
          StackPay
        </div>
        <div className="text-xs text-white/40">Bitcoin-native payments</div>
      </div>
    </div>
  );
}
