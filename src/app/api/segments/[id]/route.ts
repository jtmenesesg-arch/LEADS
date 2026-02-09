import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const segment = await prisma.savedSegment.update({
    where: { id },
    data: {
      nombre: body.nombre ?? undefined,
      filtros: body.filtros ?? undefined,
    },
  });
  return NextResponse.json(segment);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.savedSegment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
