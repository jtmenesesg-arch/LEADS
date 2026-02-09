import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";

export async function GET() {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const trendStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  await ensureDefaultStages(prisma);
  const firstStage = await prisma.pipelineStage.findFirst({
    orderBy: { orden: "asc" },
  });
  const wonStage = await prisma.pipelineStage.findFirst({
    where: { key: "GANADO" },
  });

  const [
    nuevos,
    contactadosHoy,
    seguimientosPendientes,
    respondieronSemana,
    estadoCounts,
    totalLeads,
    ganados,
    trendLeads,
    revenue,
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
    ]);

  const trendMap = new Map<string, number>();
  trendLeads.forEach((lead) => {
    const dateKey = lead.creadoEn.toISOString().slice(0, 10);
    trendMap.set(dateKey, (trendMap.get(dateKey) ?? 0) + 1);
  });

  const trend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      count: trendMap.get(key) ?? 0,
    };
  });

  return NextResponse.json({
    metrics: {
      nuevos,
      contactadosHoy,
      seguimientosPendientes,
      respondieronSemana,
      totalLeads,
      ganados,
      conversion:
        totalLeads > 0 ? Math.round((ganados / totalLeads) * 100) : 0,
      mrrTotalCents: revenue._sum.monthlyPriceCents ?? 0,
      setupTotalCents: revenue._sum.setupPriceCents ?? 0,
    },
    estados: estadoCounts.map((item: (typeof estadoCounts)[number]) => ({
      stageId: item.stageId,
      count: item._count._all,
    })),
    trend,
  });
}
