import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const normalize = (value?: string | null) => (value ?? "").trim();

const priorityRank: Record<string, number> = { BAJA: 1, MEDIA: 2, ALTA: 3 };

export async function POST(request: Request) {
  const body = await request.json();
  const primaryId = body?.primaryId as string | undefined;
  const mergeIds = body?.mergeIds as string[] | undefined;

  if (!primaryId || !Array.isArray(mergeIds) || mergeIds.length === 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const [primary, others, deals] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: primaryId },
      include: { tags: true, deal: true },
    }),
    prisma.lead.findMany({
      where: { id: { in: mergeIds } },
      include: { tags: true, deal: true },
    }),
    prisma.deal.findMany({
      where: { leadId: { in: mergeIds } },
    }),
  ]);

  if (!primary) {
    return NextResponse.json({ error: "Lead principal no encontrado" }, { status: 404 });
  }

  const merged = { ...primary } as typeof primary;

  const fill = (key: keyof typeof merged, value?: string | null) => {
    if (!normalize(merged[key] as string | null)) {
      merged[key] = value as never;
    }
  };

  let latestContacto = primary.ultimoContacto ?? null;
  let latestSeguimiento = primary.proximoSeguimiento ?? null;

  others.forEach((lead) => {
    fill("empresa", lead.empresa);
    fill("rubro", lead.rubro);
    fill("ciudad", lead.ciudad);
    fill("telefono", lead.telefono);
    fill("whatsapp", lead.whatsapp);
    fill("instagram", lead.instagram);
    fill("web", lead.web);
    fill("fuente", lead.fuente);
    fill("nota", lead.nota);
    if (!merged.stageId && lead.stageId) merged.stageId = lead.stageId;

    const currentRank = priorityRank[merged.prioridad] ?? 0;
    const otherRank = priorityRank[lead.prioridad] ?? 0;
    if (otherRank > currentRank) merged.prioridad = lead.prioridad;

    if (lead.ultimoContacto && (!latestContacto || lead.ultimoContacto > latestContacto)) {
      latestContacto = lead.ultimoContacto;
    }
    if (
      lead.proximoSeguimiento &&
      (!latestSeguimiento || lead.proximoSeguimiento > latestSeguimiento)
    ) {
      latestSeguimiento = lead.proximoSeguimiento;
    }
  });

  const tagIds = new Set([
    ...primary.tags.map((tag) => tag.tagId),
    ...others.flatMap((lead) => lead.tags.map((tag) => tag.tagId)),
  ]);

  const targetDeal = primary.deal ?? deals[0] ?? null;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: primary.id },
      data: {
        empresa: merged.empresa,
        rubro: merged.rubro,
        ciudad: merged.ciudad,
        telefono: merged.telefono,
        whatsapp: merged.whatsapp,
        instagram: merged.instagram,
        web: merged.web,
        fuente: merged.fuente,
        nota: merged.nota,
        stageId: merged.stageId,
        prioridad: merged.prioridad,
        ultimoContacto: latestContacto,
        proximoSeguimiento: latestSeguimiento,
        tags: {
          deleteMany: {},
          create: Array.from(tagIds).map((tagId) => ({ tagId })),
        },
        deal: targetDeal
          ? {
              upsert: {
                create: {
                  currency: targetDeal.currency,
                  monthlyPriceCents: targetDeal.monthlyPriceCents,
                  setupPriceCents: targetDeal.setupPriceCents,
                  closedAt: targetDeal.closedAt,
                  notes: targetDeal.notes,
                },
                update: {
                  currency: targetDeal.currency,
                  monthlyPriceCents: targetDeal.monthlyPriceCents,
                  setupPriceCents: targetDeal.setupPriceCents,
                  closedAt: targetDeal.closedAt,
                  notes: targetDeal.notes,
                },
              },
            }
          : undefined,
      },
    }),
    prisma.interaccion.updateMany({
      where: { leadId: { in: mergeIds } },
      data: { leadId: primary.id },
    }),
    prisma.leadChange.updateMany({
      where: { leadId: { in: mergeIds } },
      data: { leadId: primary.id },
    }),
    prisma.leadTag.deleteMany({ where: { leadId: { in: mergeIds } } }),
    prisma.deal.deleteMany({ where: { leadId: { in: mergeIds } } }),
    prisma.lead.deleteMany({ where: { id: { in: mergeIds } } }),
  ]);

  return NextResponse.json({ ok: true });
}
