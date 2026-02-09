import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";
import type { PipelineStage } from "@/lib/types";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const trendStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  await ensureDefaultStages(prisma);
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { orden: "asc" },
  });
  const firstStage = stages[0];
  const wonStage = stages.find((stage: PipelineStage) => stage.key === "GANADO");

  const [
    nuevos,
    contactadosHoy,
    seguimientosPendientes,
    respondieronSemana,
    stageCounts,
    totalLeads,
    ganados,
    trendLeads,
    revenue,
    deals,
  ] = await Promise.all([
      prisma.lead.count({ where: { stageId: firstStage?.id } }),
      prisma.lead.count({ where: { ultimoContacto: { gte: startToday } } }),
      prisma.lead.count({ where: { proximoSeguimiento: { lt: startToday } } }),
      prisma.interaccion.count({
        where: { tipo: "RESPUESTA", fecha: { gte: startWeek } },
      }),
      prisma.lead.groupBy({ by: ["stageId"], _count: { _all: true } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { stageId: wonStage?.id } }),
      prisma.lead.findMany({
        where: { creadoEn: { gte: trendStart } },
        select: { creadoEn: true },
      }),
      prisma.deal.aggregate({
        where: { lead: { stageId: wonStage?.id } },
        _sum: { monthlyPriceCents: true, setupPriceCents: true },
      }),
      prisma.deal.findMany({
        where: { lead: { stageId: wonStage?.id } },
        include: { lead: true },
        orderBy: { closedAt: "desc" },
      }),
    ]);

  const stageMap = new Map<string, number>(
    stageCounts
      .filter((item: (typeof stageCounts)[number]) => Boolean(item.stageId))
      .map((item: (typeof stageCounts)[number]) => [
        item.stageId as string,
        item._count._all,
      ])
  );

  const trendMap = new Map<string, number>();
  trendLeads.forEach((lead) => {
    const key = lead.creadoEn.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  });
  const trend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: trendMap.get(key) ?? 0 };
  });
  const maxTrend = Math.max(1, ...trend.map((item) => item.count));
  const conversion = totalLeads > 0 ? Math.round((ganados / totalLeads) * 100) : 0;
  const mrrTotal = revenue._sum.monthlyPriceCents ?? 0;
  const setupTotal = revenue._sum.setupPriceCents ?? 0;
  const totalRevenue = mrrTotal + setupTotal;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Vista general del pipeline y prioridades del dia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Nuevos" value={nuevos} hint="Leads sin contacto" />
        <MetricCard
          title="Contactados hoy"
          value={contactadosHoy}
          hint="Ultimo contacto en el dia"
        />
        <MetricCard
          title="Seguimientos pendientes"
          value={seguimientosPendientes}
          hint="Proximo seguimiento vencido"
        />
        <MetricCard
          title="Respondieron esta semana"
          value={respondieronSemana}
          hint="Respuestas registradas"
        />
        <MetricCard title="Total leads" value={totalLeads} hint="Pipeline total" />
        <MetricCard
          title="Conversion"
          value={conversion}
          hint={`Ganados: ${ganados}`}
          suffix="%"
        />
        <MetricCard
          title="MRR total"
          value={mrrTotal / 100}
          hint="Leads ganados"
          currency
        />
        <MetricCard
          title="Setup total"
          value={setupTotal / 100}
          hint="Acumulado"
          currency
        />
        <MetricCard
          title="Total revenue"
          value={totalRevenue / 100}
          hint="MRR + Setup"
          currency
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Leads por etapa
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {stages.map((stage: PipelineStage) => {
              const count = stageMap.get(stage.id) ?? 0;
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tendencia 7 dias
          </h2>
          <div className="mt-6 flex items-end gap-3">
            {trend.map((item) => (
              <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end justify-center rounded-xl bg-slate-50">
                  <div
                    className="w-6 rounded-full bg-slate-900"
                    style={{ height: `${Math.max(8, (item.count / maxTrend) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{item.date.slice(8, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Deals
        </h2>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr] gap-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>Lead</span>
              <span>Rubro</span>
              <span>Moneda</span>
              <span>MRR</span>
              <span>Setup</span>
              <span>Cierre</span>
            </div>
            {deals.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                Aun no hay deals cerrados.
              </div>
            ) : (
              deals.map((deal) => (
                <div
                  key={deal.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr] gap-0 border-b border-slate-100 px-4 py-3 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{deal.lead.nombre}</p>
                    <p className="text-xs text-slate-400">{deal.lead.empresa ?? "Sin empresa"}</p>
                  </div>
                  <span>{deal.lead.rubro ?? "-"}</span>
                  <span>{deal.currency}</span>
                  <span>{formatMoney(deal.monthlyPriceCents, deal.currency)}</span>
                  <span>{formatMoney(deal.setupPriceCents, deal.currency)}</span>
                  <span>{new Date(deal.closedAt).toLocaleDateString("es-CL")}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  hint,
  suffix,
  currency,
}: {
  title: string;
  value: number;
  hint: string;
  suffix?: string;
  currency?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">
        {currency ? formatMoney(value * 100) : value}
        {suffix ? <span className="text-lg text-slate-400">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
