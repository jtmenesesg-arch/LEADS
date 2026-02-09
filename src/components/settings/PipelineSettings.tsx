"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STAGE_COLOR_PRESETS } from "@/lib/constants";
import type { PipelineStage } from "@/lib/types";
import { cn } from "@/lib/cn";

type ToastState = { message: string; tone?: "success" | "danger" } | null;

export function PipelineSettings() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(STAGE_COLOR_PRESETS[0].value);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, tone?: "success" | "danger") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2200);
  };

  const loadStages = async () => {
    setLoading(true);
    const response = await fetch("/api/stages", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as PipelineStage[];
      setStages(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadStages();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      showToast("Nombre requerido.", "danger");
      return;
    }
    const response = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: newName.trim(), color: newColor }),
    });
    if (!response.ok) {
      showToast("No se pudo crear la etapa.", "danger");
      return;
    }
    setNewName("");
    await loadStages();
    showToast("Etapa creada.", "success");
  };

  const updateStage = async (id: string, data: Partial<PipelineStage>) => {
    const response = await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      showToast("No se pudo actualizar.", "danger");
      return;
    }
    await loadStages();
  };

  const handleDelete = async (stageId: string, moveToStageId?: string) => {
    const response = await fetch(`/api/stages/${stageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moveToStageId }),
    });
    if (!response.ok) {
      const data = await response.json();
      showToast(data?.error || "No se pudo borrar.", "danger");
      return;
    }
    await loadStages();
    showToast("Etapa eliminada.", "success");
  };

  const moveStage = async (fromIndex: number, toIndex: number) => {
    const next = [...stages];
    const target = next[toIndex];
    const current = next[fromIndex];
    if (!target || !current) return;
    await Promise.all([
      updateStage(current.id, { orden: target.orden }),
      updateStage(target.id, { orden: current.orden }),
    ]);
  };

  const stageOptions = useMemo(
    () => stages.map((stage) => ({ value: stage.id, label: stage.nombre })),
    [stages]
  );

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline</h1>
        <p className="text-sm text-slate-500">
          Ajusta las etapas del Kanban y su orden.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Input
            label="Nueva etapa"
            placeholder="Ej: Demo"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <Select
            label="Color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
          >
            {STAGE_COLOR_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </Select>
          <Button onClick={handleAdd}>Agregar etapa</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando etapas...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px] font-semibold",
                      stage.color
                    )}
                  >
                    {stage.nombre}
                  </span>
                  <Input
                    value={stage.nombre}
                    onChange={(event) =>
                      updateStage(stage.id, { nombre: event.target.value })
                    }
                  />
                </div>
                <Select
                  value={stage.color}
                  onChange={(event) =>
                    updateStage(stage.id, { color: event.target.value })
                  }
                >
                  {STAGE_COLOR_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </Select>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveStage(index, index - 1)}
                  >
                    Subir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === stages.length - 1}
                    onClick={() => moveStage(index, index + 1)}
                  >
                    Bajar
                  </Button>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <Select
                    value={moveTargets[stage.id] ?? stageOptions[0]?.value ?? ""}
                    onChange={(event) =>
                      setMoveTargets((prev) => ({
                        ...prev,
                        [stage.id]: event.target.value,
                      }))
                    }
                  >
                    {stageOptions
                      .filter((option) => option.value !== stage.id)
                      .map((option) => (
                      <option key={option.value} value={option.value}>
                        Mover leads a {option.label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={stages.length === 1}
                    onClick={() =>
                      handleDelete(
                        stage.id,
                        moveTargets[stage.id] ??
                          stageOptions.find(
                            (option) => option.value !== stage.id
                          )?.value
                      )
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
