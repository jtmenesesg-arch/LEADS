import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const segments = await prisma.savedSegment.findMany({
    orderBy: { creadoEn: "desc" },
  });
  return NextResponse.json(segments);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.nombre || typeof body.nombre !== "string") {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    );
  }

  const segment = await prisma.savedSegment.create({
    data: {
      nombre: body.nombre.trim(),
      filtros: body.filtros ?? {},
    },
  });

  return NextResponse.json(segment, { status: 201 });
}
