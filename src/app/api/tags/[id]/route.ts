import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const tag = await prisma.tag.update({
    where: { id },
    data: {
      nombre: body.nombre ?? undefined,
      color: body.color ?? undefined,
    },
  });
  return NextResponse.json(tag);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.leadTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
