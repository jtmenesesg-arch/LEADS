"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { DealWizard } from "@/components/deals/DealWizard";
import { formatMoney } from "@/lib/money";
import {
  INTERACCION_CANAL_LABELS,
  INTERACCION_CANALES,
  INTERACCION_TIPO_LABELS,
  INTERACCION_TIPOS,
  PRIORIDAD_COLOR,
  PRIORIDAD_LABELS,
  TAG_COLOR_PRESETS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import type { LeadDetalle, Tag } from "@/lib/types";

type LeadDetailModalProps = {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  onEdit?: (leadId: string) => void;
  onUpdated?: () => void;
};

type InteractionForm = {
  canal: (typeof INTERACCION_CANALES)[number];
  tipo: (typeof INTERACCION_TIPOS)[number];
  contenido: string;
  fecha: string;
};

const emptyInteraction: InteractionForm = {
  canal: "WHATSAPP",
  tipo: "FOLLOW_UP",
  contenido: "",
  fecha: new Date().toISOString(),
};

export function LeadDetailModal({
  open,
  leadId,
  onClose,
  onEdit,
  onUpdated,
}: LeadDetailModalProps) {
  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<InteractionForm>(emptyInteraction);
  const [saving, setSaving] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(
    TAG_COLOR_PRESETS[0].value
  );
  const [tagLoading, setTagLoading] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [actionChannel, setActionChannel] = useState<InteractionForm["canal"]>(
    "WHATSAPP"
  );
  const [actionFollowup, setActionFollowup] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openDealWizard, setOpenDealWizard] = useState(false);

  const title = useMemo(() => lead?.nombre ?? "Ficha del lead", [lead]);

  const loadLead = async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("error");
      const data = (await response.json()) as LeadDetalle;
      setLead(data);
    } catch (err) {
      setError("No se pudo cargar la ficha del lead.");
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    const response = await fetch("/api/tags", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as Tag[];
      setAllTags(data);
    }
  };

  useEffect(() => {
    if (open && leadId) {
      void loadLead();
      void loadTags();
      setForm({ ...emptyInteraction, fecha: new Date().toISOString() });
    }
  }, [open, leadId]);

  const handleSaveInteraction = async () => {
    if (!leadId) return;
    setSaving(true);
    const response = await fetch(`/api/leads/${leadId}/interacciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canal: form.canal,
        tipo: form.tipo,
        contenido: form.contenido,
        fecha: form.fecha,
      }),
    });
    setSaving(false);
    if (!response.ok) return;
    setForm({ ...emptyInteraction, fecha: new Date().toISOString() });
    await loadLead();
    onUpdated?.();
  };

  const runAction = async (action: "contactado" | "followup" | "respondio") => {
    if (!leadId) return;
    if (action === "followup" && !actionFollowup) {
      setActionError("Selecciona una fecha de seguimiento.");
      return;
    }
    setActionError(null);
    setActionLoading(true);
    const response = await fetch(`/api/leads/${leadId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        canal: actionChannel,
        contenido: actionNote || null,
        proximoSeguimiento: actionFollowup || null,
      }),
    });
    setActionLoading(false);
    if (!response.ok) return;
    setActionNote("");
    setActionFollowup("");
    setActionError(null);
    await loadLead();
    onUpdated?.();
  };

  const saveLeadTags = async (tagIds: string[]) => {
    if (!leadId) return;
    setTagLoading(true);
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds }),
    });
    setTagLoading(false);
    if (!response.ok) return;
    const data = (await response.json()) as LeadDetalle;
    setLead(data);
  };

  const addExistingTag = async () => {
    if (!lead || !selectedTagId) return;
    const current = lead.tags ?? [];
    if (current.some((tag) => tag.id === selectedTagId)) return;
    await saveLeadTags([...current.map((tag) => tag.id), selectedTagId]);
    setSelectedTagId("");
    await loadTags();
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    setTagLoading(true);
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: newTagName.trim(), color: newTagColor }),
    });
    setTagLoading(false);
    if (!response.ok) return;
    const tag = (await response.json()) as Tag;
    setNewTagName("");
    await saveLeadTags([...(lead?.tags ?? []).map((item) => item.id), tag.id]);
    await loadTags();
  };

  const removeTag = async (tagId: string) => {
    if (!lead) return;
    const next = (lead.tags ?? []).filter((tag) => tag.id !== tagId);
    await saveLeadTags(next.map((tag) => tag.id));
  };

  return (
    <>
      <Modal open={open} onClose={onClose} className="max-w-4xl">
        <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Ficha
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lead && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${lead.stage?.color ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
              >
                {lead.stage?.nombre ?? "Sin etapa"}
              </span>
            )}
            {lead && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${PRIORIDAD_COLOR[lead.prioridad]}`}
              >
                {PRIORIDAD_LABELS[lead.prioridad]}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
            Cargando detalles...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : lead ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_360px]">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
                <Info label="Empresa" value={lead.empresa} />
                <Info label="Rubro" value={lead.rubro} />
                <Info label="Ciudad" value={lead.ciudad} />
                <Info label="Telefono" value={lead.telefono} />
                <Info label="WhatsApp" value={lead.whatsapp} />
                <Info label="Instagram" value={lead.instagram} />
                <Info label="Web" value={lead.web} />
                <Info label="Fuente" value={lead.fuente} />
              </div>
              {lead.nota && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Nota</h3>
                  <p className="mt-2 text-sm text-slate-600">{lead.nota}</p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Interacciones</h3>
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={() => onEdit(lead.id)}>
                      Editar lead
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {lead.interacciones.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Aun no hay interacciones registradas.
                    </div>
                  ) : (
                    lead.interacciones.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                              {INTERACCION_TIPO_LABELS[item.tipo]}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                              {INTERACCION_CANAL_LABELS[item.canal]}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatDateTime(item.fecha)}
                          </span>
                        </div>
                        {item.contenido && (
                          <p className="mt-2 text-sm text-slate-600">
                            {item.contenido}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Historial de cambios</h3>
                <div className="mt-3 flex flex-col gap-3">
                  {(lead.cambios ?? []).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Aun no hay cambios registrados.
                    </div>
                  ) : (
                    lead.cambios?.slice(0, 6).map((change) => (
                      <div
                        key={change.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {change.campo}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDateTime(change.creadoEn)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {change.valorAntes || "-"} → {change.valorDespues || "-"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Etiquetas</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(lead.tags ?? []).length === 0 && (
                    <span className="text-xs text-slate-400">Sin etiquetas</span>
                  )}
                  {(lead.tags ?? []).map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        tag.color
                      )}
                    >
                      {tag.nombre}
                      <span className="text-[10px]">×</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Select
                    label="Agregar existente"
                    value={selectedTagId}
                    onChange={(event) => setSelectedTagId(event.target.value)}
                  >
                    <option value="">Selecciona etiqueta</option>
                    {allTags
                      .filter(
                        (tag) => !(lead.tags ?? []).some((t) => t.id === tag.id)
                      )
                      .map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.nombre}
                        </option>
                      ))}
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={tagLoading || !selectedTagId}
                    onClick={addExistingTag}
                  >
                    Agregar etiqueta
                  </Button>
                  <Input
                    label="Nueva etiqueta"
                    placeholder="Ej: VIP"
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                  />
                  <Select
                    label="Color"
                    value={newTagColor}
                    onChange={(event) => setNewTagColor(event.target.value)}
                  >
                    {TAG_COLOR_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    disabled={tagLoading || !newTagName.trim()}
                    onClick={createTag}
                  >
                    Crear etiqueta
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Ultimo contacto</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDateTime(lead.ultimoContacto)}
                </p>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  Proximo seguimiento
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDateTime(lead.proximoSeguimiento)}
                </p>
              </div>
              {lead.deal && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <h3 className="text-sm font-semibold text-emerald-800">Deal</h3>
                  <div className="mt-2 text-sm text-emerald-700">
                    <p>
                      MRR: {formatMoney(lead.deal.monthlyPriceCents, lead.deal.currency)}
                    </p>
                    <p>
                      Setup: {formatMoney(lead.deal.setupPriceCents, lead.deal.currency)}
                    </p>
                    <p>Moneda: {lead.deal.currency}</p>
                    <p>Cierre: {formatDateTime(lead.deal.closedAt)}</p>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Acciones rapidas</h3>
                <div className="mt-4 flex flex-col gap-3">
                  <Select
                    label="Canal"
                    value={actionChannel}
                    onChange={(event) =>
                      setActionChannel(
                        event.target.value as InteractionForm["canal"]
                      )
                    }
                  >
                    {INTERACCION_CANALES.map((canal) => (
                      <option key={canal} value={canal}>
                        {INTERACCION_CANAL_LABELS[canal]}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Proximo seguimiento"
                    type="date"
                    value={actionFollowup}
                    onChange={(event) => setActionFollowup(event.target.value)}
                  />
                  <Textarea
                    label="Nota"
                    placeholder="Resumen de la accion"
                    value={actionNote}
                    onChange={(event) => setActionNote(event.target.value)}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={actionLoading}
                      onClick={() => runAction("contactado")}
                    >
                      Marcar como contactado
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => runAction("followup")}
                    >
                      Agendar follow-up
                    </Button>
                    <Button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => runAction("respondio")}
                    >
                      Marcar respondio
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenDealWizard(true)}
                    >
                      Cerrar como ganado
                    </Button>
                  </div>
                  {actionError && (
                    <p className="text-xs text-rose-600">{actionError}</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Nueva interaccion</h3>
                <div className="mt-4 flex flex-col gap-3">
                  <Select
                    label="Canal"
                    value={form.canal}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        canal: event.target.value as InteractionForm["canal"],
                      }))
                    }
                  >
                    {INTERACCION_CANALES.map((canal) => (
                      <option key={canal} value={canal}>
                        {INTERACCION_CANAL_LABELS[canal]}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Tipo"
                    value={form.tipo}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        tipo: event.target.value as InteractionForm["tipo"],
                      }))
                    }
                  >
                    {INTERACCION_TIPOS.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {INTERACCION_TIPO_LABELS[tipo]}
                      </option>
                    ))}
                  </Select>
                  <Textarea
                    label="Contenido"
                    placeholder="Resumen de la interaccion"
                    value={form.contenido}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, contenido: event.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    onClick={handleSaveInteraction}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Registrar interaccion"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </Modal>
      {lead && (
        <DealWizard
          open={openDealWizard}
          lead={lead}
          onCancel={() => setOpenDealWizard(false)}
          onSaved={async () => {
            setOpenDealWizard(false);
            await loadLead();
            onUpdated?.();
          }}
        />
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value || "-"}</p>
    </div>
  );
}
