import { ReactNode } from "react";
import { cn } from "./cn";

export default function GlassCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("glass rounded-2xl p-6", className)}>{children}</div>;
}
