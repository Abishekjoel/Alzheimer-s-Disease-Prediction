import { ArrowRight, Droplet, User } from "lucide-react";
import { Link } from "react-router-dom";

import { PredictionBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/Card";
import { formatDate, formatPercent } from "@/utils/format";
import type { Case } from "@/types/api";

export function PatientCard({ patient }: { patient: Case }) {
  return (
    <Link to={`/app/users/${patient.id}`}>
      <Card interactive className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-elevated">
            {patient.photo_url ? (
              <img src={patient.photo_url} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-5 text-ink-subtle" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">{patient.full_name || patient.case_id}</p>
            <p className="mono-tag flex items-center gap-1 text-[12px] text-ink-subtle">
              {patient.age_years ? `Age ${patient.age_years}` : "Age —"}
              {patient.blood_group && (
                <>
                  <span aria-hidden>·</span>
                  <Droplet className="size-3" /> {patient.blood_group}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-border bg-bg px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">Latest prediction</p>
          {patient.latest_analysis?.predicted_class ? (
            <div className="mt-1.5 flex items-center justify-between">
              <PredictionBadge predictedClass={patient.latest_analysis.predicted_class} />
              <span className="mono-tag text-[12.5px] text-ink-muted">
                {formatPercent(patient.latest_analysis.confidence)}
              </span>
            </div>
          ) : (
            <p className="mt-1.5 text-[12.5px] text-ink-subtle">No analysis yet</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between text-[12px] text-ink-subtle">
          <span>
            {patient.latest_analysis ? `Last analyzed ${formatDate(patient.latest_analysis.created_at)}` : "—"}
          </span>
          <span className="flex items-center gap-1 font-medium text-primary">
            View <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
