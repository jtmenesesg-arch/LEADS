import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-slate-700">
      {label && <span className="font-medium text-slate-700">{label}</span>}
      <input
        className={cn(
          "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900",
          "placeholder:text-slate-400 focus:border-slate-400 focus:outline-none",
          error && "border-rose-300 focus:border-rose-400",
          className
        )}
        {...props}
      />
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : (
        hint && <span className="text-xs text-slate-400">{hint}</span>
      )}
    </label>
  );
}
