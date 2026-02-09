import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const body = await request.json();
  const action = body?.action as string | undefined;

  if (!action) {
    return NextResponse.json({ error: "Accion requerida" }, { status: 400 });
  }

  await ensureDefaultStages(prisma);

  if (action === "contactado") {
    const stage = await prisma.pipelineStage.findFirst({
      where: { key: "CONTACTADO" },
    });
    const proximo = body?.proximoSeguimiento
      ? new Date(body.proximoSeguimiento)
      : undefined;

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ultimoContacto: new Date(),
        proximoSeguimiento: proximo ?? undefined,
        stageId: stage?.id ?? undefined,
      },
    });

    await prisma.interaccion.create({
      data: {
        leadId: lead.id,
        canal: body?.canal ?? "OTRO",
        tipo: "PRIMER_CONTACTO",
        contenido: body?.contenido || null,
        fecha: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "followup") {
    if (!body?.proximoSeguimiento) {
      return NextResponse.json(
        { error: "Fecha de seguimiento requerida" },
        { status: 400 }
      );
    }

    const stage = await prisma.pipelineStage.findFirst({
      where: { key: "SEGUIMIENTO" },
    });

    await prisma.lead.update({
      where: { id: params.id },
      data: {
        proximoSeguimiento: new Date(body.proximoSeguimiento),
        stageId: stage?.id ?? undefined,
      },
    });

    await prisma.interaccion.create({
      data: {
        leadId: params.id,
        canal: body?.canal ?? "OTRO",
        tipo: "FOLLOW_UP",
        contenido: body?.contenido || null,
        fecha: new Date(body.proximoSeguimiento),
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "respondio") {
    const stage = await prisma.pipelineStage.findFirst({
      where: { key: "RESPONDIO" },
    });
    await prisma.lead.update({
      where: { id: params.id },
      data: {
        ultimoContacto: new Date(),
        stageId: stage?.id ?? undefined,
      },
    });

    await prisma.interaccion.create({
      data: {
        leadId: params.id,
        canal: body?.canal ?? "OTRO",
        tipo: "RESPUESTA",
        contenido: body?.contenido || null,
        fecha: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Accion no soportada" }, { status: 400 });
}
