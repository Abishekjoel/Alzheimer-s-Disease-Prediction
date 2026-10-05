import { Brain, Calendar } from "lucide-react";

import { AnalysisStatusBadge, PredictionBadge, UncertaintyBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/Card";
import { formatDateTime, formatPercent } from "@/utils/format";
import type { MRIAnalysis } from "@/types/api";

export function AnalysisCard({ analysis, onClick }: { analysis: MRIAnalysis; onClick: () => void }) {
  return (
    <Card
      interactive
      padding="none"
      onClick={onClick}
      className="cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
        {analysis.image_url ? (
          <img src={analysis.image_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-subtle">
            <Brain className="size-8" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <AnalysisStatusBadge status={analysis.status} />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-ink">{analysis.case.full_name || analysis.case_id}</p>
            <span className="mono-tag truncate text-[11.5px] text-ink-subtle">{analysis.case_id}</span>
          </div>
          {analysis.predicted_class && <PredictionBadge predictedClass={analysis.predicted_class} />}
        </div>

        {analysis.confidence !== null && (
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-ink-subtle">Confidence</span>
            <span className="mono-tag font-medium text-ink">{formatPercent(analysis.confidence)}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-subtle">
            <Calendar className="size-3.5" /> {formatDateTime(analysis.created_at)}
          </span>
          {analysis.uncertainty_level && <UncertaintyBadge level={analysis.uncertainty_level} />}
        </div>
      </div>
    </Card>
  );
}
