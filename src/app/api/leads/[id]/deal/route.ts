import { NextResponse, type NextRequest } from "next/server";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.deal.delete({ where: { leadId: id } });
  return NextResponse.json({ ok: true });
}
