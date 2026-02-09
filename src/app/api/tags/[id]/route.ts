import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();
  const tag = await prisma.tag.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre ?? undefined,
      color: body.color ?? undefined,
    },
  });
  return NextResponse.json(tag);
}

export async function DELETE(_request: Request, { params }: Params) {
  await prisma.leadTag.deleteMany({ where: { tagId: params.id } });
  await prisma.tag.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
