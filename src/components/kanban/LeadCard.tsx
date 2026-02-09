import { cn } from "@/lib/cn";
import { PRIORIDAD_COLOR, PRIORIDAD_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import type { Lead } from "@/lib/types";

type LeadCardProps = {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>, lead: Lead) => void;
};

export function LeadCard({
  lead,
  onEdit,
  onDelete,
  onView,
  draggable,
  onDragStart,
}: LeadCardProps) {
  return (
    <div
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, lead)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{lead.nombre}</h3>
          {lead.empresa && (
            <p className="text-xs text-slate-500">{lead.empresa}</p>
          )}
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-[11px] font-semibold",
            PRIORIDAD_COLOR[lead.prioridad]
          )}
        >
          {PRIORIDAD_LABELS[lead.prioridad]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {lead.ciudad && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
            {lead.ciudad}
          </span>
        )}
        {lead.rubro && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
            {lead.rubro}
          </span>
        )}
        {lead.fuente && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
            {lead.fuente}
          </span>
        )}
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
      {lead.stage?.key === "GANADO" && lead.deal && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white">
            MRR {formatMoney(lead.deal.monthlyPriceCents, lead.deal.currency)}
          </span>
          <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
            Setup {formatMoney(lead.deal.setupPriceCents, lead.deal.currency)}
          </span>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        {lead.stage && (
          <span
            className={cn(
              "rounded-full border px-2 py-1 text-[11px] font-semibold",
              lead.stage.color
            )}
          >
            {lead.stage.nombre}
          </span>
        )}
        <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onView(lead)}
            className="rounded-full px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Detalle
          </button>
          <button
            type="button"
            onClick={() => onEdit(lead)}
            className="rounded-full px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(lead)}
            className="rounded-full px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
