import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

export async function GET() {
  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      nombre: true,
      empresa: true,
      telefono: true,
      whatsapp: true,
      instagram: true,
      web: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  const groups: Array<{ type: string; value: string; leads: typeof leads }> = [];

  const groupBy = (type: string, getKey: (lead: (typeof leads)[number]) => string) => {
    const map = new Map<string, (typeof leads)[number][]>();
    leads.forEach((lead) => {
      const key = getKey(lead);
      if (!key) return;
      map.set(key, [...(map.get(key) ?? []), lead]);
    });
    map.forEach((items, key) => {
      if (items.length > 1) {
        groups.push({ type, value: key, leads: items });
      }
    });
  };

  groupBy("Telefono", (lead) => normalize(lead.telefono));
  groupBy("WhatsApp", (lead) => normalize(lead.whatsapp));
  groupBy("Instagram", (lead) => normalize(lead.instagram));
  groupBy("Web", (lead) => normalize(lead.web));
  groupBy("Nombre + Empresa", (lead) =>
    `${normalize(lead.nombre)}|${normalize(lead.empresa)}`.replace(/\|$/, "")
  );

  return NextResponse.json(groups);
}
