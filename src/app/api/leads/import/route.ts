import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { parseCsv } from "@/lib/csv";
import { LEAD_PRIORIDADES, type LeadPrioridad } from "@/lib/constants";
import { ensureDefaultStages } from "@/lib/stages";

type Mapping = Record<string, string | null | undefined>;

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toPrioridad(value?: string): LeadPrioridad | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return LEAD_PRIORIDADES.includes(normalized as LeadPrioridad)
    ? (normalized as LeadPrioridad)
    : null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const csvText = body?.csv as string | undefined;
  const mapping = (body?.mapping ?? {}) as Mapping;

  if (!csvText) {
    return NextResponse.json({ error: "CSV requerido" }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV sin datos" }, { status: 400 });
  }

  await ensureDefaultStages(prisma);
  const stages = await prisma.pipelineStage.findMany();

  const getValue = (row: Record<string, string>, field: string) => {
    const header = mapping[field];
    if (!header) return "";
    return row[header] ?? "";
  };

  const existing = await prisma.lead.findMany({
    select: {
      nombre: true,
      empresa: true,
      telefono: true,
      whatsapp: true,
      instagram: true,
      web: true,
    },
  });

  const normalize = (value?: string | null) =>
    (value ?? "").trim().toLowerCase();

  const existingPhones = new Set(
    existing.map((lead) => normalize(lead.telefono)).filter(Boolean)
  );
  const existingWhatsapps = new Set(
    existing.map((lead) => normalize(lead.whatsapp)).filter(Boolean)
  );
  const existingInstagrams = new Set(
    existing.map((lead) => normalize(lead.instagram)).filter(Boolean)
  );
  const existingWebs = new Set(
    existing.map((lead) => normalize(lead.web)).filter(Boolean)
  );
  const existingNameCompany = new Set(
    existing
      .map((lead) => `${normalize(lead.nombre)}|${normalize(lead.empresa)}`)
      .filter((key) => key !== "|")
  );

  let skipped = 0;

  const leads = rows
    .map((row) => {
      const nombre = getValue(row, "nombre");
      if (!nombre) return null;

      const empresa = getValue(row, "empresa");
      const telefono = getValue(row, "telefono");
      const whatsapp = getValue(row, "whatsapp");
      const instagram = getValue(row, "instagram");
      const web = getValue(row, "web");

      const nameKey = `${normalize(nombre)}|${normalize(empresa)}`;
      const phoneKey = normalize(telefono);
      const whatsappKey = normalize(whatsapp);
      const instagramKey = normalize(instagram);
      const webKey = normalize(web);

      const duplicated =
        (phoneKey && existingPhones.has(phoneKey)) ||
        (whatsappKey && existingWhatsapps.has(whatsappKey)) ||
        (instagramKey && existingInstagrams.has(instagramKey)) ||
        (webKey && existingWebs.has(webKey)) ||
        (nameKey && existingNameCompany.has(nameKey));

      if (duplicated) {
        skipped += 1;
        return null;
      }

      const estado = getValue(row, "estado");
      const stage = stages.find((item: (typeof stages)[number]) => {
        const normalized = estado?.trim().toLowerCase();
        if (!normalized) return false;
        return (
          item.nombre.toLowerCase() === normalized ||
          item.key?.toLowerCase() === normalized
        );
      });
      const defaultStage = stages[0];
      const prioridad = toPrioridad(getValue(row, "prioridad")) ?? "MEDIA";

      if (phoneKey) existingPhones.add(phoneKey);
      if (whatsappKey) existingWhatsapps.add(whatsappKey);
      if (instagramKey) existingInstagrams.add(instagramKey);
      if (webKey) existingWebs.add(webKey);
      if (nameKey) existingNameCompany.add(nameKey);

      return {
        nombre,
        empresa: empresa || null,
        rubro: getValue(row, "rubro") || null,
        ciudad: getValue(row, "ciudad") || null,
        telefono: telefono || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        web: web || null,
        stageId: stage?.id ?? defaultStage?.id ?? null,
        prioridad,
        fuente: getValue(row, "fuente") || null,
        nota: getValue(row, "nota") || null,
        ultimoContacto: parseDate(getValue(row, "ultimoContacto")),
        proximoSeguimiento: parseDate(getValue(row, "proximoSeguimiento")),
      };
    })
    .filter(Boolean) as Prisma.LeadCreateManyInput[];

  if (leads.length === 0) {
    return NextResponse.json(
      { error: "No se encontro ningun lead valido" },
      { status: 400 }
    );
  }

  await prisma.lead.createMany({ data: leads });

  return NextResponse.json({ ok: true, count: leads.length, skipped });
}
