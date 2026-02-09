export const LEAD_PRIORIDADES = ["ALTA", "MEDIA", "BAJA"] as const;

export type LeadPrioridad = (typeof LEAD_PRIORIDADES)[number];

export const STAGE_COLOR_PRESETS = [
  {
    label: "Neutral",
    value: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    label: "Azul",
    value: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    label: "Verde",
    value: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    label: "Ambar",
    value: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    label: "Indigo",
    value: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    label: "Rosa",
    value: "bg-rose-100 text-rose-700 border-rose-200",
  },
  {
    label: "Gris",
    value: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
] as const;

export const TAG_COLOR_PRESETS = [
  {
    label: "Slate",
    value: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    label: "Blue",
    value: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    label: "Emerald",
    value: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    label: "Amber",
    value: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    label: "Indigo",
    value: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    label: "Rose",
    value: "bg-rose-100 text-rose-700 border-rose-200",
  },
  {
    label: "Zinc",
    value: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
] as const;

export const DEFAULT_STAGES = [
  {
    key: "NUEVO",
    nombre: "Nuevo",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    orden: 1,
  },
  {
    key: "CONTACTADO",
    nombre: "Contactado",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    orden: 2,
  },
  {
    key: "RESPONDIO",
    nombre: "Respondio",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    orden: 3,
  },
  {
    key: "SEGUIMIENTO",
    nombre: "Seguimiento",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    orden: 4,
  },
  {
    key: "REUNION",
    nombre: "Reunion",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    orden: 5,
  },
  {
    key: "GANADO",
    nombre: "Ganado",
    color: "bg-emerald-200 text-emerald-800 border-emerald-300",
    orden: 6,
  },
  {
    key: "PERDIDO",
    nombre: "Perdido",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    orden: 7,
  },
  {
    key: "NO_CALIFICA",
    nombre: "No califica",
    color: "bg-zinc-100 text-zinc-700 border-zinc-200",
    orden: 8,
  },
] as const;

export const INTERACCION_CANALES = [
  "WHATSAPP",
  "LLAMADA",
  "INSTAGRAM",
  "EMAIL",
  "OTRO",
] as const;

export const INTERACCION_TIPOS = [
  "PRIMER_CONTACTO",
  "FOLLOW_UP",
  "RESPUESTA",
  "REUNION",
  "CIERRE",
  "NOTA",
] as const;

export type InteraccionCanal = (typeof INTERACCION_CANALES)[number];
export type InteraccionTipo = (typeof INTERACCION_TIPOS)[number];

export const PRIORIDAD_LABELS: Record<LeadPrioridad, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const INTERACCION_CANAL_LABELS: Record<InteraccionCanal, string> = {
  WHATSAPP: "WhatsApp",
  LLAMADA: "Llamada",
  INSTAGRAM: "Instagram",
  EMAIL: "Email",
  OTRO: "Otro",
};

export const INTERACCION_TIPO_LABELS: Record<InteraccionTipo, string> = {
  PRIMER_CONTACTO: "Primer contacto",
  FOLLOW_UP: "Follow-up",
  RESPUESTA: "Respuesta",
  REUNION: "Reunion",
  CIERRE: "Cierre",
  NOTA: "Nota",
};

export const PRIORIDAD_COLOR: Record<LeadPrioridad, string> = {
  ALTA: "bg-rose-100 text-rose-700 border-rose-200",
  MEDIA: "bg-amber-100 text-amber-700 border-amber-200",
  BAJA: "bg-slate-100 text-slate-700 border-slate-200",
};
