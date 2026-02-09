import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { creadoEn: "asc" },
    include: { stage: true, tags: { include: { tag: true } } },
  });

  const rows = leads.map((lead: (typeof leads)[number]) => ({
    id: lead.id,
    nombre: lead.nombre,
    empresa: lead.empresa ?? "",
    rubro: lead.rubro ?? "",
    ciudad: lead.ciudad ?? "",
    telefono: lead.telefono ?? "",
    whatsapp: lead.whatsapp ?? "",
    instagram: lead.instagram ?? "",
    web: lead.web ?? "",
    estado: lead.stage?.nombre ?? "",
    prioridad: lead.prioridad,
    etiquetas: lead.tags.map((item) => item.tag.nombre).join("|"),
    fuente: lead.fuente ?? "",
    nota: lead.nota ?? "",
    ultimoContacto: lead.ultimoContacto?.toISOString() ?? "",
    proximoSeguimiento: lead.proximoSeguimiento?.toISOString() ?? "",
    creadoEn: lead.creadoEn.toISOString(),
    actualizadoEn: lead.actualizadoEn.toISOString(),
  }));

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads.csv",
    },
  });
}
