"use client";

import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { FollowUpsBoard } from "@/components/seguimientos/FollowUpsBoard";
import { WeeklyAgenda } from "@/components/seguimientos/WeeklyAgenda";
import { LeadsTable } from "@/components/leads/LeadsTable";
import type { PipelineStage } from "@/lib/types";

type DashboardData = {
  metrics: {
    nuevos: number;
    contactadosHoy: number;
    seguimientosPendientes: number;
    respondieronSemana: number;
  };
  estados: { stageId: string | null; count: number }[];
};

export function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as DashboardData;
      setData(payload);
      const stageResponse = await fetch("/api/stages", { cache: "no-store" });
      if (stageResponse.ok) {
        const stagePayload = (await stageResponse.json()) as PipelineStage[];
        setStages(stagePayload);
      }
    };
    void load();
  }, []);

  const estadoMap = new Map(
    data?.estados.map((item) => [item.stageId, item.count]) ?? []
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Resumen</h1>
          <p className="text-sm text-slate-500">
            Todo tu pipeline en una sola vista.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Nuevos" value={data?.metrics.nuevos ?? 0} />
          <MetricCard title="Contactados hoy" value={data?.metrics.contactadosHoy ?? 0} />
          <MetricCard
            title="Seguimientos pendientes"
            value={data?.metrics.seguimientosPendientes ?? 0}
          />
          <MetricCard
            title="Respondieron esta semana"
            value={data?.metrics.respondieronSemana ?? 0}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Leads por etapa
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {stages.map((stage) => {
              const count = estadoMap.get(stage.id) ?? 0;
              const width = Math.max(6, Math.min(100, count * 12));
              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <span className="w-24 text-xs font-medium text-slate-500">
                    {stage.nombre}
                  </span>
                  <div className="flex-1 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Kanban</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Pipeline
          </span>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-3 sm:p-4">
          <KanbanBoard />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seguimientos</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Prioridades
          </span>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-3 sm:p-4">
          <FollowUpsBoard />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-3 sm:p-4">
          <WeeklyAgenda />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Tabla
          </span>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-3 sm:p-4">
          <LeadsTable />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
