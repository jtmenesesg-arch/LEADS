import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();
  const segment = await prisma.savedSegment.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre ?? undefined,
      filtros: body.filtros ?? undefined,
    },
  });
  return NextResponse.json(segment);
}

export async function DELETE(_request: Request, { params }: Params) {
  await prisma.savedSegment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
