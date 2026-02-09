"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { parseCsv } from "@/lib/csv";

type ImportCsvModalProps = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
};

const FIELDS = [
  { key: "nombre", label: "Nombre" },
  { key: "empresa", label: "Empresa" },
  { key: "rubro", label: "Rubro" },
  { key: "ciudad", label: "Ciudad" },
  { key: "telefono", label: "Telefono" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "web", label: "Web" },
  { key: "estado", label: "Etapa" },
  { key: "prioridad", label: "Prioridad" },
  { key: "fuente", label: "Fuente" },
  { key: "nota", label: "Nota" },
  { key: "ultimoContacto", label: "Ultimo contacto" },
  { key: "proximoSeguimiento", label: "Proximo seguimiento" },
] as const;

type Mapping = Record<(typeof FIELDS)[number]["key"], string | null>;

export function ImportCsvModal({ open, onClose, onImported }: ImportCsvModalProps) {
  const [csvText, setCsvText] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>(() =>
    FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: null }), {} as Mapping)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number; skipped: number } | null>(null);

  const sampleRows = useMemo(() => {
    if (!csvText) return [];
    const rows = parseCsv(csvText);
    return rows.slice(0, 3);
  }, [csvText]);

  useEffect(() => {
    if (open) {
      setError(null);
      setResult(null);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setError("CSV sin datos.");
      return;
    }
    const headerList = Object.keys(rows[0]);
    setHeaders(headerList);
    setCsvText(text);
    setError(null);

    const nextMapping = { ...mapping } as Mapping;
    FIELDS.forEach((field) => {
      const match = headerList.find(
        (header) => header.toLowerCase() === field.key.toLowerCase()
      );
      if (match) nextMapping[field.key] = match;
    });
    setMapping(nextMapping);
  };

  const handleImport = async () => {
    if (!csvText) {
      setError("Sube un archivo CSV.");
      return;
    }
    if (!mapping.nombre) {
      setError("El campo Nombre es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);
    const response = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText, mapping }),
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data?.error || "Error importando CSV");
      return;
    }
    const data = await response.json();
    setResult({ count: data?.count ?? 0, skipped: data?.skipped ?? 0 });
    onImported?.();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-4xl">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Importar CSV</h2>
          <p className="text-sm text-slate-500">
            Sube tu archivo y asigna columnas a los campos del lead.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <input
            type="file"
            accept=".csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>

        {headers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map((field) => (
              <Select
                key={field.key}
                label={field.label}
                value={mapping[field.key] ?? ""}
                onChange={(event) =>
                  setMapping((prev) => ({
                    ...prev,
                    [field.key]: event.target.value || null,
                  }))
                }
              >
                <option value="">Sin asignar</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </Select>
            ))}
          </div>
        )}

        {sampleRows.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vista previa</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-3 gap-0 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                {Object.keys(sampleRows[0]).slice(0, 3).map((header) => (
                  <span key={header}>{header}</span>
                ))}
              </div>
              {sampleRows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-0 border-b border-slate-100 px-4 py-2 text-xs text-slate-500"
                >
                  {Object.keys(sampleRows[0]).slice(0, 3).map((header) => (
                    <span key={header}>{row[header]}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Importados: {result.count}. Duplicados omitidos: {result.skipped}.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          <Button type="button" onClick={handleImport} disabled={loading}>
            {loading ? "Importando..." : "Importar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
