import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TAG_COLOR_PRESETS } from "@/lib/constants";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.nombre || typeof body.nombre !== "string") {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    );
  }

  const tag = await prisma.tag.create({
    data: {
      nombre: body.nombre.trim(),
      color: body.color || TAG_COLOR_PRESETS[0].value,
    },
  });

  return NextResponse.json(tag, { status: 201 });
}
