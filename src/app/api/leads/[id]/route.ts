import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildLeadSnapshot, diffLeadChanges } from "@/lib/changes";
import { ensureDefaultStages } from "@/lib/stages";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      interacciones: { orderBy: { fecha: "desc" } },
      stage: true,
      tags: { include: { tag: true } },
      cambios: { orderBy: { creadoEn: "desc" } },
      deal: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...lead,
    tags: lead.tags.map((item) => item.tag),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();

  await ensureDefaultStages(prisma);
  const wonStage = await prisma.pipelineStage.findFirst({
    where: { key: "GANADO" },
  });

  const current = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { stage: true, tags: { include: { tag: true } } },
  });

  if (!current) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  if (wonStage && body.stageId === wonStage.id) {
    const existingDeal = await prisma.deal.findUnique({
      where: { leadId: params.id },
    });
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Debe registrar un deal antes de marcar GANADO" },
        { status: 400 }
      );
    }
    if (!existingDeal.currency || existingDeal.monthlyPriceCents <= 0) {
      return NextResponse.json(
        { error: "Deal invalido para GANADO" },
        { status: 400 }
      );
    }
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre ?? undefined,
      empresa: body.empresa ?? undefined,
      rubro: body.rubro ?? undefined,
      ciudad: body.ciudad ?? undefined,
      telefono: body.telefono ?? undefined,
      whatsapp: body.whatsapp ?? undefined,
      instagram: body.instagram ?? undefined,
      web: body.web ?? undefined,
      stageId: body.stageId ?? undefined,
      prioridad: body.prioridad ?? undefined,
      fuente: body.fuente ?? undefined,
      nota: body.nota ?? undefined,
      ultimoContacto: body.ultimoContacto
        ? new Date(body.ultimoContacto)
        : body.ultimoContacto === null
          ? null
          : undefined,
      proximoSeguimiento: body.proximoSeguimiento
        ? new Date(body.proximoSeguimiento)
        : body.proximoSeguimiento === null
          ? null
          : undefined,
      tags: Array.isArray(body.tagIds)
        ? {
            deleteMany: {},
            create: body.tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: {
      stage: true,
      tags: { include: { tag: true } },
      interacciones: { orderBy: { fecha: "desc" } },
      cambios: { orderBy: { creadoEn: "desc" } },
      deal: true,
    },
  });

  const beforeSnapshot = buildLeadSnapshot({
    ...current,
    tags: current.tags.map((item) => item.tag),
  } as unknown as any);
  const afterSnapshot = buildLeadSnapshot({
    ...lead,
    tags: lead.tags.map((item) => item.tag),
  } as unknown as any);

  const changes = diffLeadChanges(beforeSnapshot, afterSnapshot);

  if (changes.length > 0) {
    await prisma.leadChange.createMany({
      data: changes.map((change) => ({
        leadId: lead.id,
        campo: change.campo,
        valorAntes: change.valorAntes,
        valorDespues: change.valorDespues,
      })),
    });
  }

  return NextResponse.json({
    ...lead,
    tags: lead.tags.map((item) => item.tag),
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
