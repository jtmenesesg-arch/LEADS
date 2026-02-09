import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const stage = await prisma.pipelineStage.update({
    where: { id },
    data: {
      nombre: body.nombre ?? undefined,
      color: body.color ?? undefined,
      orden: body.orden ?? undefined,
    },
  });
  return NextResponse.json(stage);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const moveToStageId = body?.moveToStageId as string | undefined;

  const leadCount = await prisma.lead.count({
    where: { stageId: id },
  });

  if (leadCount > 0 && !moveToStageId) {
    return NextResponse.json(
      { error: "Hay leads en esta etapa" },
      { status: 400 }
    );
  }

  if (leadCount > 0 && moveToStageId) {
    await prisma.lead.updateMany({
      where: { stageId: id },
      data: { stageId: moveToStageId },
    });
  }

  await prisma.pipelineStage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
