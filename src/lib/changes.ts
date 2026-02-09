import type { Lead, PipelineStage, Tag } from "@/lib/types";

type LeadSnapshot = {
  nombre: string;
  empresa?: string | null;
  rubro?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  web?: string | null;
  prioridad: string;
  fuente?: string | null;
  nota?: string | null;
  ultimoContacto?: string | null;
  proximoSeguimiento?: string | null;
  stage?: PipelineStage | null;
  tags?: Tag[];
};

const TRACK_FIELDS: Array<keyof LeadSnapshot> = [
  "nombre",
  "empresa",
  "rubro",
  "ciudad",
  "telefono",
  "whatsapp",
  "instagram",
  "web",
  "prioridad",
  "fuente",
  "nota",
  "ultimoContacto",
  "proximoSeguimiento",
  "stage",
  "tags",
];

export function diffLeadChanges(before: LeadSnapshot, after: LeadSnapshot) {
  return TRACK_FIELDS.flatMap((field) => {
    const beforeValue = before[field];
    const afterValue = after[field];

    if (field === "stage") {
      const beforeStage = beforeValue as PipelineStage | null | undefined;
      const afterStage = afterValue as PipelineStage | null | undefined;
      if ((beforeStage?.id ?? "") === (afterStage?.id ?? "")) return [];
      return [
        {
          campo: "Etapa",
          valorAntes: beforeStage?.nombre ?? "",
          valorDespues: afterStage?.nombre ?? "",
        },
      ];
    }

    if (field === "tags") {
      const beforeTags = (beforeValue as Tag[] | undefined) ?? [];
      const afterTags = (afterValue as Tag[] | undefined) ?? [];
      const beforeNames = beforeTags.map((tag) => tag.nombre).sort().join(", ");
      const afterNames = afterTags.map((tag) => tag.nombre).sort().join(", ");
      if (beforeNames === afterNames) return [];
      return [
        {
          campo: "Etiquetas",
          valorAntes: beforeNames,
          valorDespues: afterNames,
        },
      ];
    }

    const beforeText = beforeValue == null ? "" : String(beforeValue);
    const afterText = afterValue == null ? "" : String(afterValue);
    if (beforeText === afterText) return [];

    const label = field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());

    return [
      {
        campo: label,
        valorAntes: beforeText,
        valorDespues: afterText,
      },
    ];
  });
}

export function buildLeadSnapshot(lead: Lead) {
  return {
    nombre: lead.nombre,
    empresa: lead.empresa ?? null,
    rubro: lead.rubro ?? null,
    ciudad: lead.ciudad ?? null,
    telefono: lead.telefono ?? null,
    whatsapp: lead.whatsapp ?? null,
    instagram: lead.instagram ?? null,
    web: lead.web ?? null,
    prioridad: lead.prioridad,
    fuente: lead.fuente ?? null,
    nota: lead.nota ?? null,
    ultimoContacto: lead.ultimoContacto ?? null,
    proximoSeguimiento: lead.proximoSeguimiento ?? null,
    stage: lead.stage ?? null,
    tags: lead.tags ?? [],
  };
}
