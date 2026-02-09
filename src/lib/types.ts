import type { InteraccionCanal, InteraccionTipo, LeadPrioridad } from "@/lib/constants";

export type Lead = {
  id: string;
  nombre: string;
  empresa?: string | null;
  rubro?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  web?: string | null;
  stageId?: string | null;
  stage?: PipelineStage | null;
  tags?: Tag[];
  deal?: Deal | null;
  prioridad: LeadPrioridad;
  fuente?: string | null;
  nota?: string | null;
  ultimoContacto?: string | null;
  proximoSeguimiento?: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type PipelineStage = {
  id: string;
  key?: string | null;
  nombre: string;
  color: string;
  orden: number;
  creadoEn: string;
  actualizadoEn: string;
};

export type Tag = {
  id: string;
  nombre: string;
  color: string;
  creadoEn: string;
  actualizadoEn: string;
};

export type SavedSegment = {
  id: string;
  nombre: string;
  filtros: {
    search: string;
    stageId: string;
    prioridad: string;
    rubro: string;
    ciudad: string;
    fuente: string;
  };
  creadoEn: string;
  actualizadoEn: string;
};

export type LeadChange = {
  id: string;
  leadId: string;
  campo: string;
  valorAntes?: string | null;
  valorDespues?: string | null;
  creadoEn: string;
};

export type Deal = {
  id: string;
  leadId: string;
  currency: string;
  monthlyPriceCents: number;
  setupPriceCents: number;
  closedAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Interaccion = {
  id: string;
  leadId: string;
  canal: InteraccionCanal;
  tipo: InteraccionTipo;
  contenido?: string | null;
  fecha: string;
  creadoEn: string;
};

export type LeadDetalle = Lead & {
  interacciones: Interaccion[];
  cambios?: LeadChange[];
};
