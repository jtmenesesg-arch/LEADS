"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Lead } from "@/lib/types";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { PRIORIDAD_COLOR, PRIORIDAD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Group = {
  title: string;
  description: string;
  leads: Lead[];
};

export function FollowUpsBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      if (!response.ok) throw new Error("error");
      const data = (await response.json()) as Lead[];
      setLeads(data.filter((lead) => lead.proximoSeguimiento));
    } catch (err) {
      setError("No se pudieron cargar los seguimientos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  const groups = useMemo<Group[]>(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const endNextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

    const overdue: Lead[] = [];
    const today: Lead[] = [];
    const next: Lead[] = [];

    leads.forEach((lead) => {
      if (!lead.proximoSeguimiento) return;
      const date = new Date(lead.proximoSeguimiento);
      if (Number.isNaN(date.getTime())) return;
      if (date < startToday) {
        overdue.push(lead);
      } else if (date >= startToday && date < endToday) {
        today.push(lead);
      } else if (date >= endToday && date <= endNextWeek) {
        next.push(lead);
      }
    });

    return [
      {
        title: "Vencidos",
        description: "Seguimientos pendientes antes de hoy.",
        leads: overdue,
      },
      {
        title: "Hoy",
        description: "Contactos que requieren atencion hoy.",
        leads: today,
      },
      {
        title: "Proximos 7 dias",
        description: "Agenda el trabajo de la semana.",
        leads: next,
      },
    ];
  }, [leads]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Seguimientos</h1>
          <p className="text-sm text-slate-500">
            Organiza el dia con foco en contactos pendientes.
          </p>
        </div>
        <Button variant="secondary" onClick={loadLeads}>
          Recargar
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
          Cargando seguimientos...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">
            No hay seguimientos agendados
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Agenda un proximo contacto desde la ficha del lead.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.title}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {group.title}
                </h2>
                <p className="mt-1 text-xs text-slate-400">{group.description}</p>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {group.leads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    Sin leads
                  </div>
                ) : (
                  group.leads.map((lead) => {
                    const isOverdue = lead.proximoSeguimiento
                      ? new Date(lead.proximoSeguimiento) < new Date(new Date().setHours(0, 0, 0, 0))
                      : false;
                    return (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {lead.nombre}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {lead.empresa || lead.rubro || "Sin empresa"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-1 text-[11px] font-semibold",
                              PRIORIDAD_COLOR[lead.prioridad]
                            )}
                          >
                            {PRIORIDAD_LABELS[lead.prioridad]}
                          </span>
                          {isOverdue && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                              Vencido
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {lead.stage && (
                          <span
                            className={cn(
                              "rounded-full border px-2 py-1 text-[11px] font-semibold",
                              lead.stage.color
                            )}
                          >
                            {lead.stage.nombre}
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                          {formatShortDate(lead.proximoSeguimiento)}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        {formatDateTime(lead.proximoSeguimiento)}
                      </p>
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
