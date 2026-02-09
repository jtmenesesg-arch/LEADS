import { NextResponse, type NextRequest } from "next/server";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body?.canal || !body?.tipo) {
    return NextResponse.json(
      { error: "Canal y tipo son obligatorios" },
      { status: 400 }
    );
  }

  const interaccion = await prisma.interaccion.create({
    data: {
      leadId: id,
      canal: body.canal,
      tipo: body.tipo,
      contenido: body.contenido || null,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
    },
  });

  return NextResponse.json(interaccion, { status: 201 });
}
