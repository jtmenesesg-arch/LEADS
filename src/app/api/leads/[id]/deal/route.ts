import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

export async function DELETE(_request: Request, { params }: Params) {
  await prisma.deal.delete({ where: { leadId: params.id } });
  return NextResponse.json({ ok: true });
}
