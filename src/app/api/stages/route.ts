import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";

export async function GET() {
  await ensureDefaultStages(prisma);
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { orden: "asc" },
  });
  return NextResponse.json(stages);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.nombre || typeof body.nombre !== "string") {
    return NextResponse.json(
      { error: "Nombre es obligatorio" },
      { status: 400 }
    );
  }

  const last = await prisma.pipelineStage.findFirst({
    orderBy: { orden: "desc" },
  });

  const stage = await prisma.pipelineStage.create({
    data: {
      nombre: body.nombre,
      color: body.color || "bg-slate-100 text-slate-700 border-slate-200",
      orden: body.orden ?? (last?.orden ?? 0) + 1,
      key: body.key ?? null,
    },
  });

  return NextResponse.json(stage, { status: 201 });
}
