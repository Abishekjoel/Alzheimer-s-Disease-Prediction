import { Droplet, User, Weight } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { SEX_LABELS } from "@/utils/constants";
import type { CasePatientSummary } from "@/types/api";

export function CaseSummaryCard({ patient }: { patient: CasePatientSummary }) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-elevated">
        {patient.photo_url ? (
          <img src={patient.photo_url} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-6 text-ink-subtle" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <Link to={`/app/users/${patient.id}`} className="truncate text-[14.5px] font-semibold text-ink hover:text-primary">
          {patient.full_name || patient.case_id}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
          <span>{patient.age_years ? `Age ${patient.age_years}` : "Age —"}</span>
          <span>{SEX_LABELS[patient.sex]}</span>
          {patient.blood_group && (
            <span className="flex items-center gap-1">
              <Droplet className="size-3.5" /> {patient.blood_group}
            </span>
          )}
          {patient.weight_kg && (
            <span className="flex items-center gap-1">
              <Weight className="size-3.5" /> {patient.weight_kg} kg
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
