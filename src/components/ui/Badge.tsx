import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "border-slate-200 bg-slate-100 text-slate-700",
        tone === "success" && "border-emerald-200 bg-emerald-100 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-100 text-amber-700",
        tone === "danger" && "border-rose-200 bg-rose-100 text-rose-700",
        tone === "info" && "border-blue-200 bg-blue-100 text-blue-700",
        className
      )}
      {...props}
    />
  );
}
