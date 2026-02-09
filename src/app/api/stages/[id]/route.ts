import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();
  const stage = await prisma.pipelineStage.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre ?? undefined,
      color: body.color ?? undefined,
      orden: body.orden ?? undefined,
    },
  });
  return NextResponse.json(stage);
}

export async function DELETE(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const moveToStageId = body?.moveToStageId as string | undefined;

  const leadCount = await prisma.lead.count({
    where: { stageId: params.id },
  });

  if (leadCount > 0 && !moveToStageId) {
    return NextResponse.json(
      { error: "Hay leads en esta etapa" },
      { status: 400 }
    );
  }

  if (leadCount > 0 && moveToStageId) {
    await prisma.lead.updateMany({
      where: { stageId: params.id },
      data: { stageId: moveToStageId },
    });
  }

  await prisma.pipelineStage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
