"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/types";
import { PRIORIDAD_COLOR, PRIORIDAD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

type DayColumn = {
  date: Date;
  label: string;
  leads: Lead[];
};

const weekdayFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = (day + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function WeeklyAgenda() {
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
      setError("No se pudo cargar la agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  const days = useMemo<DayColumn[]>(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const columns: DayColumn[] = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      date.setHours(0, 0, 0, 0);
      return {
        date,
        label: weekdayFormatter.format(date),
        leads: [],
      };
    });

    leads.forEach((lead) => {
      if (!lead.proximoSeguimiento) return;
      const follow = new Date(lead.proximoSeguimiento);
      if (Number.isNaN(follow.getTime())) return;
      const dayIndex = Math.floor(
        (new Date(follow.getFullYear(), follow.getMonth(), follow.getDate()).getTime() -
          weekStart.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (dayIndex >= 0 && dayIndex < 7) {
        columns[dayIndex].leads.push(lead);
      }
    });

    return columns;
  }, [leads]);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Agenda semanal</h2>
        <p className="text-sm text-slate-500">
          Seguimientos programados para la semana actual.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
          Cargando agenda...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid gap-4"
            style={{
              minWidth: "980px",
              gridTemplateColumns: "repeat(7, minmax(180px, 1fr))",
            }}
          >
            {days.map((day) => {
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const isPastDay = day.date < todayStart;
              return (
              <div
                key={day.label}
                className="flex min-h-[280px] flex-col rounded-2xl border border-slate-200 bg-white/90 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {day.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {isPastDay && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        Pasado
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {day.leads.length}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {day.leads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Sin seguimientos
                    </div>
                  ) : (
                    day.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {lead.nombre}
                        </p>
                        <p className="text-xs text-slate-400">
                          {lead.empresa || lead.rubro || "Sin empresa"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
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
                          <span
                            className={cn(
                              "rounded-full border px-2 py-1 text-[11px] font-semibold",
                              PRIORIDAD_COLOR[lead.prioridad]
                            )}
                          >
                            {PRIORIDAD_LABELS[lead.prioridad]}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
