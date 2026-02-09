"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TAG_COLOR_PRESETS } from "@/lib/constants";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/cn";

type ToastState = { message: string; tone?: "success" | "danger" } | null;

export function TagSettings() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(
    TAG_COLOR_PRESETS[0].value
  );
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, tone?: "success" | "danger") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2200);
  };

  const loadTags = async () => {
    setLoading(true);
    const response = await fetch("/api/tags", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as Tag[];
      setTags(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadTags();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      showToast("Nombre requerido.", "danger");
      return;
    }
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: newName.trim(), color: newColor }),
    });
    if (!response.ok) {
      showToast("No se pudo crear la etiqueta.", "danger");
      return;
    }
    setNewName("");
    await loadTags();
    showToast("Etiqueta creada.", "success");
  };

  const updateTag = async (id: string, data: Partial<Tag>) => {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      showToast("No se pudo actualizar.", "danger");
      return;
    }
    await loadTags();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Eliminar etiqueta?");
    if (!confirmed) return;
    const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!response.ok) {
      showToast("No se pudo borrar.", "danger");
      return;
    }
    await loadTags();
    showToast("Etiqueta eliminada.", "success");
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Etiquetas</h2>
        <p className="text-sm text-slate-500">
          Crea etiquetas con color para segmentar leads.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Input
            label="Nueva etiqueta"
            placeholder="Ej: VIP"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <Select
            label="Color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
          >
            {TAG_COLOR_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </Select>
          <Button onClick={handleAdd}>Agregar etiqueta</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando etiquetas...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center"
              >
                <span
                  className={cn(
                    "rounded-full border px-2 py-1 text-[11px] font-semibold",
                    tag.color
                  )}
                >
                  {tag.nombre}
                </span>
                <Input
                  value={tag.nombre}
                  onChange={(event) =>
                    updateTag(tag.id, { nombre: event.target.value })
                  }
                />
                <Select
                  value={tag.color}
                  onChange={(event) =>
                    updateTag(tag.id, { color: event.target.value })
                  }
                >
                  {TAG_COLOR_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </Select>
                <Button variant="danger" size="sm" onClick={() => handleDelete(tag.id)}>
                  Eliminar
                </Button>
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
