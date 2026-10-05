import { Link } from "react-router-dom";

import { AnalysisStatusBadge, PredictionBadge } from "@/components/common/StatusBadge";
import { formatDateTime, formatPercent } from "@/utils/format";
import type { MRIAnalysis } from "@/types/api";

/** Chronological record of analyses for one case. Deliberately labeled
 * "Analysis Timeline", not "Disease Progression" — differing predictions
 * across analyses are not evidence of clinical progression; each is an
 * independent model output for a separate scan. */
export function AnalysisTimeline({ analyses }: { analyses: MRIAnalysis[] }) {
  return (
    <div className="relative flex flex-col gap-6 pl-6">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden />
      {analyses.map((a) => (
        <div key={a.id} className="relative">
          <span className="absolute -left-6 top-1 size-3.5 rounded-full border-2 border-bg bg-primary" aria-hidden />
          <Link to={`/app/results/${a.id}`} className="block rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:border-border-accent">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-ink">{formatDateTime(a.created_at)}</span>
              <AnalysisStatusBadge status={a.status} />
            </div>
            {a.predicted_class && (
              <div className="mt-2 flex items-center gap-3">
                <PredictionBadge predictedClass={a.predicted_class} />
                <span className="mono-tag text-[12.5px] text-ink-muted">{formatPercent(a.confidence)} confidence</span>
              </div>
            )}
          </Link>
        </div>
      ))}
    </div>
  );
}
