"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { label: "Inicio", href: "/inicio" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Kanban", href: "/kanban" },
  { label: "Leads", href: "/leads" },
  { label: "Seguimientos", href: "/seguimientos" },
  { label: "Ajustes", href: "/ajustes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [pendingFollowUps, setPendingFollowUps] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { metrics?: { seguimientosPendientes?: number } };
      setPendingFollowUps(data.metrics?.seguimientosPendientes ?? 0);
    };
    void load();
  }, []);

  return (
    <aside className="flex h-fit w-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 px-5 py-6 backdrop-blur lg:h-full lg:max-w-[260px] lg:rounded-none lg:border-0 lg:border-r">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
          ⬤
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Prospect
          </p>
          <p className="text-lg font-semibold text-slate-900">Leadflow</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const showBadge = item.href === "/seguimientos" && (pendingFollowUps ?? 0) > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition",
                active
                  ? "bg-slate-900 text-white shadow-sm shadow-slate-900/15"
                  : "hover:bg-slate-100"
              )}
            >
              <span>{item.label}</span>
              {showBadge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    active ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                  )}
                >
                  {pendingFollowUps}
                </span>
              ) : (
                <span className={cn("text-xs", active ? "text-white/70" : "text-slate-400")}>
                  ›
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Focus
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Prioriza tu pipeline y da seguimiento diario.
        </p>
      </div>
    </aside>
  );
}
