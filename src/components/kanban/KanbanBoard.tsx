"use client";

import { useEffect, useMemo, useState } from "react";
import type { PipelineStage } from "@/lib/types";
import type { Lead } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LeadCard } from "@/components/kanban/LeadCard";
import { LeadForm } from "@/components/kanban/LeadForm";
import { cn } from "@/lib/cn";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { DealWizard } from "@/components/deals/DealWizard";

type ToastState = { message: string; tone?: "success" | "danger" } | null;

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [closeLead, setCloseLead] = useState<Lead | null>(null);
  const [confirmMove, setConfirmMove] = useState<{
    lead: Lead;
    targetStageId: string;
  } | null>(null);
  const [keepDeal, setKeepDeal] = useState(true);

  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    stages.forEach((stage) => {
      map[stage.id] = leads.filter((lead) => {
        const targetStageId = lead.stageId ?? stages[0]?.id;
        return targetStageId === stage.id;
      });
    });
    return map;
  }, [leads, stages]);

  const showToast = (message: string, tone?: "success" | "danger") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2400);
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
      if (!response.ok) throw new Error("Error cargando leads");
      const data = (await response.json()) as Lead[];
      setLeads(data);
    } catch (err) {
      setError("No se pudieron cargar los leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
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

  const handleDrop = async (stageId: string, leadId: string) => {
    const wonStage = stages.find((stage) => stage.key === "GANADO");
    const stage = stages.find((item) => item.id === stageId) ?? null;
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    if (wonStage && stageId === wonStage.id) {
      if (lead.stageId === wonStage.id) return;
      setCloseLead(lead);
      return;
    }

    if (wonStage && lead.stageId === wonStage.id && stageId !== wonStage.id) {
      setConfirmMove({ lead, targetStageId: stageId });
      setKeepDeal(true);
      return;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, stageId, stage } : lead
      )
    );
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    if (!response.ok) {
      showToast("No se pudo actualizar la etapa.", "danger");
      await loadLeads();
      return;
    }
    showToast("Etapa actualizada.", "success");
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kanban de Prospeccion</h1>
          <p className="text-sm text-slate-500">
            Arrastra cada lead para cambiar su etapa y priorizar el seguimiento.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadLeads}>
            Recargar
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

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
          Cargando pipeline...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">
            Aun no hay leads
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Crea tu primer lead para empezar a ordenar el pipeline.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            Crear lead
          </Button>
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
          Configura tu pipeline antes de agregar leads.
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div
            className="grid gap-4"
            style={{
              minWidth: `${Math.max(220 * stages.length, 880)}px`,
              gridTemplateColumns: `repeat(${stages.length}, minmax(220px, 1fr))`,
            }}
          >
            {stages.map((stage) => (
              <div
                key={stage.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const leadId = event.dataTransfer.getData("text/plain");
                  if (leadId) void handleDrop(stage.id, leadId);
                }}
                className="flex min-h-[520px] flex-col rounded-2xl border border-slate-200 bg-white/80 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {stage.nombre}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {grouped[stage.id]?.length ?? 0}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {(grouped[stage.id] ?? []).map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData("text/plain", lead.id)
                      }
                    onEdit={(selected) => {
                      setEditing(selected);
                      setOpenForm(true);
                    }}
                    onView={(selected) => setDetailLeadId(selected.id)}
                    onDelete={handleDelete}
                  />
                  ))}
                  {grouped[stage.id]?.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Arrastra aqui
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        className="max-w-3xl"
      >
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

      <DealWizard
        open={Boolean(closeLead)}
        lead={closeLead}
        onCancel={() => setCloseLead(null)}
        onSaved={async () => {
          setCloseLead(null);
          await loadLeads();
        }}
      />

      {confirmMove && (
        <Modal
          open={Boolean(confirmMove)}
          onClose={() => setConfirmMove(null)}
          title="Salir de ganado"
          className="max-w-lg"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Este lead dejara de contar en MRR. Puedes conservar el deal o
              eliminarlo.
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={keepDeal}
                onChange={(event) => setKeepDeal(event.target.checked)}
              />
              Mantener deal registrado
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmMove(null)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  const { lead, targetStageId } = confirmMove;
                  const targetStage = stages.find(
                    (stage) => stage.id === targetStageId
                  );
                  setConfirmMove(null);
                  setLeads((prev) =>
                    prev.map((item) =>
                      item.id === lead.id
                        ? { ...item, stageId: targetStageId, stage: targetStage ?? null }
                        : item
                    )
                  );
                  const response = await fetch(`/api/leads/${lead.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stageId: targetStageId }),
                  });
                  if (!response.ok) {
                    showToast("No se pudo actualizar la etapa.", "danger");
                    await loadLeads();
                    return;
                  }
                  if (!keepDeal) {
                    await fetch(`/api/leads/${lead.id}/deal`, { method: "DELETE" });
                  }
                  showToast("Etapa actualizada.", "success");
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div
          className={cn(
            "fixed right-8 top-8 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
            toast.tone === "danger"
              ? "bg-rose-600 text-white"
              : "bg-slate-900 text-white"
          )}
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}
