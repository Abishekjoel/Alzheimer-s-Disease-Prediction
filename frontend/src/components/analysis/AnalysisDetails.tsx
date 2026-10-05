import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { formatDateTime, formatDuration, formatPercent } from "@/utils/format";
import type { MRIAnalysis } from "@/types/api";
import { cn } from "@/utils/cn";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className="mono-tag text-[12.5px] text-ink">{value}</span>
    </div>
  );
}

export function AnalysisDetails({ analysis }: { analysis: MRIAnalysis }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold text-ink">Technical details</span>
        <ChevronDown className={cn("size-4 text-ink-muted transition-transform duration-[var(--duration-fast)]", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-4">
          <Row label="Case ID" value={analysis.case_id} />
          <Row label="Analysis date" value={formatDateTime(analysis.created_at)} />
          <Row label="Model version" value={analysis.model_version ? `${analysis.model_version.name} v${analysis.model_version.version}` : "—"} />
          <Row label="CNN backbone" value={analysis.model_version?.cnn_architecture ?? "—"} />
          <Row label="Swin backbone" value={analysis.model_version?.swin_architecture ?? "—"} />
          <Row label="Fusion method" value={analysis.model_version?.fusion_method ?? "—"} />
          <Row label="Processing time" value={formatDuration(analysis.processing_time_ms)} />
          <Row label="Image quality score" value={analysis.quality_score !== null ? formatPercent(analysis.quality_score) : "—"} />
          <Row label="Uncertainty score" value={analysis.uncertainty_score !== null ? analysis.uncertainty_score.toFixed(4) : "—"} />
        </div>
      )}
    </div>
  );
}
