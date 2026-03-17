export default function PageHeader({
  eyebrow = "StackPay Console",
  title,
  subtitle
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 space-y-3">
      <span className="text-xs uppercase tracking-[0.4em] text-white/40">{eyebrow}</span>
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      {subtitle ? <p className="text-sm text-white/60 md:text-base">{subtitle}</p> : null}
    </div>
  );
}
