import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";

export async function GET() {
  await ensureDefaultStages(prisma);
  const leads = await prisma.lead.findMany({
    orderBy: { actualizadoEn: "desc" },
    include: { stage: true, tags: { include: { tag: true } }, deal: true },
  });
  return NextResponse.json(
    leads.map((lead) => ({
      ...lead,
      tags: lead.tags.map((item) => item.tag),
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.nombre || typeof body.nombre !== "string") {
    return NextResponse.json(
      { error: "Nombre es obligatorio" },
      { status: 400 }
    );
  }

  await ensureDefaultStages(prisma);
  const wonStage = await prisma.pipelineStage.findFirst({
    where: { key: "GANADO" },
  });
  if (wonStage && body.stageId === wonStage.id) {
    return NextResponse.json(
      { error: "Debe registrar un deal para cerrar GANADO" },
      { status: 400 }
    );
  }
  const defaultStage = body.stageId
    ? null
    : await prisma.pipelineStage.findFirst({
        orderBy: { orden: "asc" },
      });

  const lead = await prisma.lead.create({
    data: {
      nombre: body.nombre,
      empresa: body.empresa || null,
      rubro: body.rubro || null,
      ciudad: body.ciudad || null,
      telefono: body.telefono || null,
      whatsapp: body.whatsapp || null,
      instagram: body.instagram || null,
      web: body.web || null,
      stageId: body.stageId ?? defaultStage?.id ?? null,
      prioridad: body.prioridad ?? undefined,
      fuente: body.fuente || null,
      nota: body.nota || null,
      ultimoContacto: body.ultimoContacto ? new Date(body.ultimoContacto) : null,
      proximoSeguimiento: body.proximoSeguimiento
        ? new Date(body.proximoSeguimiento)
        : null,
      tags: Array.isArray(body.tagIds)
        ? {
            create: body.tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: { stage: true, tags: { include: { tag: true } } },
  });

  return NextResponse.json(
    {
      ...lead,
      tags: lead.tags.map((item) => item.tag),
    },
    { status: 201 }
  );
}
