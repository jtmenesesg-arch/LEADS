"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Deal, Lead } from "@/lib/types";
import { formatMoney } from "@/lib/money";

type DealWizardProps = {
  open: boolean;
  lead: Lead | null;
  onCancel: () => void;
  onSaved: (deal: Deal) => void;
};

const CURRENCIES = ["CLP", "USD", "EUR"] as const;

export function DealWizard({ open, lead, onCancel, onSaved }: DealWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [currency, setCurrency] = useState("CLP");
  const [monthly, setMonthly] = useState("");
  const [setup, setSetup] = useState("");
  const [closedAt, setClosedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedMonthly = Number(monthly.replace(",", "."));
  const parsedSetup = Number(setup.replace(",", "."));
  const monthlyCents = Number.isFinite(parsedMonthly) ? Math.round(parsedMonthly * 100) : 0;
  const setupCents = Number.isFinite(parsedSetup) ? Math.round(parsedSetup * 100) : 0;

  const summary = useMemo(() => {
    return {
      monthly: formatMoney(monthlyCents, currency),
      setup: formatMoney(setupCents, currency),
      total: formatMoney(monthlyCents + setupCents, currency),
    };
  }, [monthlyCents, setupCents, currency]);

  const reset = () => {
    setStep(1);
    setCurrency(lead?.deal?.currency ?? "CLP");
    setMonthly(
      lead?.deal?.monthlyPriceCents != null
        ? String(lead.deal.monthlyPriceCents / 100)
        : ""
    );
    setSetup(
      lead?.deal?.setupPriceCents != null
        ? String(lead.deal.setupPriceCents / 100)
        : ""
    );
    setClosedAt(
      lead?.deal?.closedAt
        ? lead.deal.closedAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setNotes(lead?.deal?.notes ?? "");
    setError(null);
    setSaving(false);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const handleNext = () => {
    if (!currency.trim()) {
      setError("Moneda requerida.");
      return;
    }
    if (!Number.isFinite(parsedMonthly) || monthlyCents <= 0) {
      setError("MRR debe ser mayor a 0.");
      return;
    }
    if (!Number.isFinite(parsedSetup) || setupCents < 0) {
      setError("Setup invalido.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!lead) return;
    setSaving(true);
    const response = await fetch(`/api/leads/${lead.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency,
        monthlyPriceCents: monthlyCents,
        setupPriceCents: setupCents,
        closedAt,
        notes,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data?.error || "No se pudo cerrar el deal");
      return;
    }
    const data = await response.json();
    onSaved(data.deal as Deal);
    reset();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onCancel();
      }}
      title="Cierre de deal"
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-6">
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Registra los montos antes de cerrar como ganado.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Moneda"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Input
                label="MRR"
                placeholder="0"
                value={monthly}
                onChange={(event) => setMonthly(event.target.value)}
              />
              <Input
                label="Setup"
                placeholder="0"
                value={setup}
                onChange={(event) => setSetup(event.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">Confirma los detalles del cierre.</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>MRR</span>
                <span className="font-semibold text-slate-900">{summary.monthly}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                <span>Setup</span>
                <span className="font-semibold text-slate-900">{summary.setup}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                <span>Total</span>
                <span className="font-semibold text-slate-900">{summary.total}</span>
              </div>
            </div>
            <Input
              label="Fecha de cierre"
              type="date"
              value={closedAt}
              onChange={(event) => setClosedAt(event.target.value)}
            />
            <Textarea
              label="Notas"
              placeholder="Notas opcionales"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              onCancel();
            }}
          >
            Cancelar
          </Button>
          {step === 1 ? (
            <Button type="button" onClick={handleNext}>
              Continuar
            </Button>
          ) : (
            <Button type="button" onClick={handleConfirm} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar cierre"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
