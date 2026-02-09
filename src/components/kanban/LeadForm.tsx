"use client";

import { useEffect, useMemo, useState } from "react";
import { LEAD_PRIORIDADES } from "@/lib/constants";
import type { Lead, PipelineStage } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toDateInputValue } from "@/lib/dates";

type LeadFormValues = Omit<Lead, "id" | "creadoEn" | "actualizadoEn">;

type LeadFormProps = {
  initial?: Lead | null;
  stages: PipelineStage[];
  wonStageId?: string;
  onCancel: () => void;
  onSave: (values: LeadFormValues, leadId?: string) => Promise<void>;
};

const emptyLead: LeadFormValues = {
  nombre: "",
  empresa: "",
  rubro: "",
  ciudad: "",
  telefono: "",
  whatsapp: "",
  instagram: "",
  web: "",
  stageId: null,
  prioridad: "MEDIA",
  fuente: "",
  nota: "",
  ultimoContacto: null,
  proximoSeguimiento: null,
};

export function LeadForm({ initial, stages, wonStageId, onCancel, onSave }: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>(() => {
    if (!initial) return emptyLead;
    const { id, creadoEn, actualizadoEn, ...rest } = initial;
    return {
      ...emptyLead,
      ...rest,
      ultimoContacto: toDateInputValue(rest.ultimoContacto),
      proximoSeguimiento: toDateInputValue(rest.proximoSeguimiento),
    };
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string }>({});

  useEffect(() => {
    if (!initial && !values.stageId && stages.length > 0) {
      setValues((prev) => ({ ...prev, stageId: stages[0].id }));
    }
  }, [initial, stages, values.stageId]);

  const title = useMemo(
    () => (initial ? "Editar lead" : "Nuevo lead"),
    [initial]
  );

  const handleChange = (
    field: keyof LeadFormValues,
    value: string | null
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { nombre?: string } = {};
    if (!values.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    await onSave(values, initial?.id);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">
          Completa los datos principales del lead para empezar a gestionarlo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Nombre"
          placeholder="Nombre del contacto"
          value={values.nombre}
          onChange={(event) => handleChange("nombre", event.target.value)}
          error={errors.nombre}
        />
        <Input
          label="Empresa"
          placeholder="Empresa"
          value={values.empresa ?? ""}
          onChange={(event) => handleChange("empresa", event.target.value)}
        />
        <Input
          label="Rubro"
          placeholder="Rubro"
          value={values.rubro ?? ""}
          onChange={(event) => handleChange("rubro", event.target.value)}
        />
        <Input
          label="Ciudad"
          placeholder="Ciudad"
          value={values.ciudad ?? ""}
          onChange={(event) => handleChange("ciudad", event.target.value)}
        />
        <Input
          label="Telefono"
          placeholder="Telefono"
          value={values.telefono ?? ""}
          onChange={(event) => handleChange("telefono", event.target.value)}
        />
        <Input
          label="WhatsApp"
          placeholder="WhatsApp"
          value={values.whatsapp ?? ""}
          onChange={(event) => handleChange("whatsapp", event.target.value)}
        />
        <Input
          label="Instagram"
          placeholder="Instagram"
          value={values.instagram ?? ""}
          onChange={(event) => handleChange("instagram", event.target.value)}
        />
        <Input
          label="Web"
          placeholder="Sitio web"
          value={values.web ?? ""}
          onChange={(event) => handleChange("web", event.target.value)}
        />
        <Select
          label="Etapa"
          value={values.stageId ?? ""}
          onChange={(event) =>
            handleChange("stageId", event.target.value || null)
          }
        >
          <option value="">Sin etapa</option>
          {stages.map((stage) => (
            <option
              key={stage.id}
              value={stage.id}
              disabled={stage.id === wonStageId}
            >
              {stage.id === wonStageId ? `${stage.nombre} (usar cierre)` : stage.nombre}
            </option>
          ))}
        </Select>
        <Select
          label="Prioridad"
          value={values.prioridad}
          onChange={(event) =>
            handleChange(
              "prioridad",
              event.target.value as LeadFormValues["prioridad"]
            )
          }
        >
          {LEAD_PRIORIDADES.map((prioridad) => (
            <option key={prioridad} value={prioridad}>
              {prioridad}
            </option>
          ))}
        </Select>
        <Input
          label="Fuente"
          placeholder="Fuente"
          value={values.fuente ?? ""}
          onChange={(event) => handleChange("fuente", event.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Ultimo contacto"
          type="date"
          value={values.ultimoContacto ?? ""}
          onChange={(event) =>
            handleChange("ultimoContacto", event.target.value || null)
          }
        />
        <Input
          label="Proximo seguimiento"
          type="date"
          value={values.proximoSeguimiento ?? ""}
          onChange={(event) =>
            handleChange("proximoSeguimiento", event.target.value || null)
          }
        />
      </div>
      <Textarea
        label="Nota"
        placeholder="Notas internas"
        value={values.nota ?? ""}
        onChange={(event) => handleChange("nota", event.target.value)}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
