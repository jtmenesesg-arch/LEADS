import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-900">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.15),_transparent_70%)]" />
        <div className="absolute right-[-120px] top-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(14,116,144,0.14),_transparent_70%)]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(148,163,184,0.16),_transparent_70%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row">
        <Sidebar />
        <main className="w-full flex-1 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
