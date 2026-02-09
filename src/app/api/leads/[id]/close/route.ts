import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const body = await request.json();

  const monthlyPriceCents = Number(body?.monthlyPriceCents ?? 0);
  const setupPriceCents = Number(body?.setupPriceCents ?? 0);
  const currency = (body?.currency ?? "").toString().trim();
  const closedAt = body?.closedAt ? new Date(body.closedAt) : new Date();
  const notes = body?.notes ?? null;

  if (!currency) {
    return NextResponse.json({ error: "Moneda requerida" }, { status: 400 });
  }
  if (Number.isNaN(monthlyPriceCents) || monthlyPriceCents <= 0) {
    return NextResponse.json(
      { error: "MRR debe ser mayor a 0" },
      { status: 400 }
    );
  }
  if (Number.isNaN(setupPriceCents) || setupPriceCents < 0) {
    return NextResponse.json(
      { error: "Setup invalido" },
      { status: 400 }
    );
  }

  await ensureDefaultStages(prisma);
  const wonStage = await prisma.pipelineStage.findFirst({
    where: { key: "GANADO" },
  });

  if (!wonStage) {
    return NextResponse.json(
      { error: "Etapa GANADO no existe" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const deal = await tx.deal.upsert({
      where: { leadId: lead.id },
      update: {
        currency,
        monthlyPriceCents,
        setupPriceCents,
        closedAt,
        notes,
      },
      create: {
        leadId: lead.id,
        currency,
        monthlyPriceCents,
        setupPriceCents,
        closedAt,
        notes,
      },
    });

    const updatedLead = await tx.lead.update({
      where: { id: lead.id },
      data: { stageId: wonStage.id },
      include: {
        stage: true,
        tags: { include: { tag: true } },
        deal: true,
      },
    });

    await tx.interaccion.create({
      data: {
        leadId: lead.id,
        canal: "OTRO",
        tipo: "CIERRE",
        contenido: `Cerrado: MRR ${monthlyPriceCents}, Setup ${setupPriceCents}, Moneda ${currency}`,
        fecha: closedAt,
      },
    });

    return { updatedLead, deal };
  });

  return NextResponse.json({
    ok: true,
    lead: {
      ...result.updatedLead,
      tags: result.updatedLead.tags.map((item) => item.tag),
    },
    deal: result.deal,
  });
}
