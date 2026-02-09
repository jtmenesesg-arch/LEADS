"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { LeadForm } from "@/components/kanban/LeadForm";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { ImportCsvModal } from "@/components/leads/ImportCsvModal";
import {
  LEAD_PRIORIDADES,
  PRIORIDAD_COLOR,
  PRIORIDAD_LABELS,
} from "@/lib/constants";
import { formatShortDate } from "@/lib/dates";
import type { Lead, PipelineStage, SavedSegment, Tag } from "@/lib/types";
import { cn } from "@/lib/cn";

type ToastState = { message: string; tone?: "success" | "danger" } | null;

type DuplicateLead = {
  id: string;
  nombre: string;
  empresa?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  web?: string | null;
  creadoEn: string;
};

type DuplicateGroup = {
  type: string;
  value: string;
  leads: DuplicateLead[];
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [openImport, setOpenImport] = useState(false);
  const [segments, setSegments] = useState<SavedSegment[]>([]);
  const [segmentName, setSegmentName] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagFilter, setTagFilter] = useState("TODAS");
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [prioridad, setPrioridad] = useState("TODAS");
  const [rubro, setRubro] = useState("TODOS");
  const [ciudad, setCiudad] = useState("TODAS");
  const [fuente, setFuente] = useState("TODAS");

  const showToast = (message: string, tone?: "success" | "danger") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2200);
  };

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const stageResponse = await fetch("/api/stages", { cache: "no-store" });
      if (stageResponse.ok) {
        const stageData = (await stageResponse.json()) as PipelineStage[];
        setStages(stageData);
      }
      const response = await fetch("/api/leads", { cache: "no-store" });
      if (!response.ok) throw new Error("error");
      const data = (await response.json()) as Lead[];
      setLeads(data);
    } catch (err) {
      setError("No se pudieron cargar los leads.");
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    const response = await fetch("/api/segments", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as SavedSegment[];
      setSegments(data);
    }
  };

  const loadTags = async () => {
    const response = await fetch("/api/tags", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as Tag[];
      setTags(data);
    }
  };

  const loadDuplicates = async () => {
    const response = await fetch("/api/leads/duplicates", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as DuplicateGroup[];
      setDuplicates(data);
    }
  };

  useEffect(() => {
    void loadLeads();
    void loadSegments();
    void loadTags();
    void loadDuplicates();
  }, []);

  const handleSave = async (values: Omit<Lead, "id" | "creadoEn" | "actualizadoEn">, id?: string) => {
    const url = id ? `/api/leads/${id}` : "/api/leads";
    const method = id ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      showToast("No se pudo guardar el lead.", "danger");
      return;
    }
    setOpenForm(false);
    setEditing(null);
    showToast(id ? "Lead actualizado." : "Lead creado.", "success");
    await loadLeads();
  };

  const handleDelete = async (lead: Lead) => {
    const confirmed = window.confirm(`Eliminar a ${lead.nombre}?`);
    if (!confirmed) return;
    const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (!response.ok) {
      showToast("No se pudo borrar el lead.", "danger");
      return;
    }
    showToast("Lead eliminado.", "success");
    await loadLeads();
  };

  const currentFilters = {
    search,
    stageId: estado,
    prioridad,
    rubro,
    ciudad,
    fuente,
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      showToast("Nombre del segmento requerido.", "danger");
      return;
    }
    const response = await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: segmentName.trim(), filtros: currentFilters }),
    });
    if (!response.ok) {
      showToast("No se pudo guardar.", "danger");
      return;
    }
    setSegmentName("");
    await loadSegments();
    showToast("Segmento guardado.", "success");
  };

  const handleApplySegment = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    const segment = segments.find((item) => item.id === segmentId);
    if (!segment) return;
    setSearch(segment.filtros.search || "");
    setEstado(segment.filtros.stageId || "TODOS");
    setPrioridad(segment.filtros.prioridad || "TODAS");
    setRubro(segment.filtros.rubro || "TODOS");
    setCiudad(segment.filtros.ciudad || "TODAS");
    setFuente(segment.filtros.fuente || "TODAS");
  };

  const handleDeleteSegment = async () => {
    if (!selectedSegmentId) return;
    const response = await fetch(`/api/segments/${selectedSegmentId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      showToast("No se pudo eliminar.", "danger");
      return;
    }
    setSelectedSegmentId("");
    await loadSegments();
    showToast("Segmento eliminado.", "success");
  };

  const handleExport = async () => {
    const response = await fetch("/api/leads/export");
    if (!response.ok) {
      showToast("No se pudo exportar.", "danger");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const filters = useMemo(() => {
    const rubros = Array.from(new Set(leads.map((lead) => lead.rubro).filter(Boolean))) as string[];
    const ciudades = Array.from(new Set(leads.map((lead) => lead.ciudad).filter(Boolean))) as string[];
    const fuentes = Array.from(new Set(leads.map((lead) => lead.fuente).filter(Boolean))) as string[];
    return { rubros, ciudades, fuentes };
  }, [leads]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return leads.filter((lead) => {
      if (estado !== "TODOS" && (lead.stageId ?? "") !== estado) return false;
      if (tagFilter !== "TODAS") {
        const hasTag = (lead.tags ?? []).some((tag) => tag.id === tagFilter);
        if (!hasTag) return false;
      }
      if (prioridad !== "TODAS" && lead.prioridad !== prioridad) return false;
      if (rubro !== "TODOS" && lead.rubro !== rubro) return false;
      if (ciudad !== "TODAS" && lead.ciudad !== ciudad) return false;
      if (fuente !== "TODAS" && lead.fuente !== fuente) return false;
      if (!term) return true;
      const haystack = [
        lead.nombre,
        lead.empresa,
        lead.rubro,
        lead.ciudad,
        lead.telefono,
        lead.whatsapp,
        lead.instagram,
        lead.web,
        lead.fuente,
        ...(lead.tags ?? []).map((tag) => tag.nombre),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [leads, search, estado, tagFilter, prioridad, rubro, ciudad, fuente]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">
            Filtra y encuentra oportunidades rapidamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadLeads}>
            Recargar
          </Button>
          <Button variant="outline" onClick={() => setOpenImport(true)}>
            Importar CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Exportar CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            Nuevo lead
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[2fr_repeat(6,_minmax(140px,_1fr))]">
        <Input
          label="Busqueda"
          placeholder="Nombre, empresa, ciudad, fuente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select label="Etapa" value={estado} onChange={(event) => setEstado(event.target.value)}>
          <option value="TODOS">Todos</option>
          {stages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </Select>
        <Select
          label="Prioridad"
          value={prioridad}
          onChange={(event) => setPrioridad(event.target.value)}
        >
          <option value="TODAS">Todas</option>
          {LEAD_PRIORIDADES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select label="Rubro" value={rubro} onChange={(event) => setRubro(event.target.value)}>
          <option value="TODOS">Todos</option>
          {filters.rubros.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          label="Ciudad"
          value={ciudad}
          onChange={(event) => setCiudad(event.target.value)}
        >
          <option value="TODAS">Todas</option>
          {filters.ciudades.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select label="Etiqueta" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
          <option value="TODAS">Todas</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.nombre}
            </option>
          ))}
        </Select>
        <Select label="Fuente" value={fuente} onChange={(event) => setFuente(event.target.value)}>
          <option value="TODAS">Todas</option>
          {filters.fuentes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.4fr_1fr_auto_auto]">
        <Select
          label="Segmentos"
          value={selectedSegmentId}
          onChange={(event) => handleApplySegment(event.target.value)}
        >
          <option value="">Selecciona segmento</option>
          {segments.map((segment) => (
            <option key={segment.id} value={segment.id}>
              {segment.nombre}
            </option>
          ))}
        </Select>
        <Input
          label="Guardar como"
          placeholder="Ej: Hot leads"
          value={segmentName}
          onChange={(event) => setSegmentName(event.target.value)}
        />
        <Button variant="outline" onClick={handleSaveSegment}>
          Guardar segmento
        </Button>
        <Button variant="secondary" onClick={handleDeleteSegment}>
          Eliminar segmento
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Duplicados detectados</h3>
            <p className="text-xs text-slate-500">Basado en telefono, WhatsApp, Instagram, web o nombre+empresa.</p>
          </div>
          <Button variant="secondary" onClick={loadDuplicates}>Refrescar</Button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {duplicates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              No hay duplicados.
            </div>
          ) : (
            duplicates.map((group) => (
              <DuplicateGroupCard
                key={`${group.type}-${group.value}`}
                group={group}
                onMerged={async () => {
                  await loadLeads();
                  await loadDuplicates();
                }}
              />
            ))
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
          Cargando leads...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">
            No hay leads con esos filtros
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Prueba ajustando los criterios de busqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div className="min-w-[1100px]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>Lead</span>
            <span>Etapa</span>
              <span>Prioridad</span>
              <span>Ciudad</span>
              <span>Rubro</span>
            <span>Seguimiento</span>
            <span>Tags</span>
            <span>Acciones</span>
          </div>
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 border-b border-slate-100 px-4 py-3 text-sm text-slate-700"
            >
                <button
                  type="button"
                  onClick={() => setDetailLeadId(lead.id)}
                  className="flex flex-col items-start text-left"
                >
                  <span className="font-semibold text-slate-900">{lead.nombre}</span>
                  <span className="text-xs text-slate-400">
                    {lead.empresa || "Sin empresa"}
                  </span>
                </button>
                {lead.stage ? (
                  <span
                    className={cn(
                      "h-fit w-fit rounded-full border px-2 py-1 text-[11px] font-semibold",
                      lead.stage.color
                    )}
                  >
                    {lead.stage.nombre}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Sin etapa</span>
                )}
                <span
                  className={cn(
                    "h-fit w-fit rounded-full border px-2 py-1 text-[11px] font-semibold",
                    PRIORIDAD_COLOR[lead.prioridad]
                  )}
                >
                  {PRIORIDAD_LABELS[lead.prioridad]}
                </span>
                <span>{lead.ciudad || "-"}</span>
              <span>{lead.rubro || "-"}</span>
              <div className="flex items-center gap-2">
                <span>{formatShortDate(lead.proximoSeguimiento)}</span>
                {lead.proximoSeguimiento &&
                  new Date(lead.proximoSeguimiento) <
                    new Date(new Date().setHours(0, 0, 0, 0)) && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      Vencido
                    </span>
                  )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(lead.tags ?? []).slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px] font-medium",
                      tag.color
                    )}
                  >
                    {tag.nombre}
                  </span>
                ))}
                {(lead.tags?.length ?? 0) > 2 && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                    +{(lead.tags?.length ?? 0) - 2}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(lead);
                      setOpenForm(true);
                    }}
                    className="rounded-full px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead)}
                    className="rounded-full px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={openForm} onClose={() => setOpenForm(false)} className="max-w-3xl">
        <LeadForm
          initial={editing}
          stages={stages}
          wonStageId={stages.find((stage) => stage.key === "GANADO")?.id}
          onCancel={() => setOpenForm(false)}
          onSave={handleSave}
        />
      </Modal>

      <LeadDetailModal
        open={Boolean(detailLeadId)}
        leadId={detailLeadId}
        onClose={() => setDetailLeadId(null)}
        onEdit={(leadId) => {
          const lead = leads.find((item) => item.id === leadId);
          if (lead) {
            setEditing(lead);
            setOpenForm(true);
          }
        }}
        onUpdated={loadLeads}
      />

      <ImportCsvModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        onImported={loadLeads}
      />

      {toast && (
        <div
          className={cn(
            "fixed right-8 top-8 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
            toast.tone === "danger" ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
          )}
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}

function DuplicateGroupCard({
  group,
  onMerged,
}: {
  group: DuplicateGroup;
  onMerged: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);

  const handleMerge = async () => {
    const primary = group.leads[0];
    const mergeIds = group.leads.slice(1).map((lead) => lead.id);
    if (!primary || mergeIds.length === 0) return;
    const confirmed = window.confirm(
      `Fusionar ${mergeIds.length} leads en ${primary.nombre}?`
    );
    if (!confirmed) return;
    setLoading(true);
    const response = await fetch("/api/leads/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryId: primary.id, mergeIds }),
    });
    setLoading(false);
    if (!response.ok) return;
    await onMerged();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{group.type}</p>
          <p className="text-sm font-semibold text-slate-900">{group.value}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleMerge} disabled={loading}>
          {loading ? "Fusionando..." : "Fusionar grupo"}
        </Button>
      </div>
      <div className="mt-3 grid gap-2">
        {group.leads.map((lead, index) => (
          <div key={lead.id} className="flex items-center justify-between text-xs text-slate-600">
            <span>
              {lead.nombre} {lead.empresa ? `(${lead.empresa})` : ""}
            </span>
            <span className={index === 0 ? "font-semibold text-slate-900" : "text-slate-400"}>
              {index === 0 ? "Principal" : "Duplicado"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
