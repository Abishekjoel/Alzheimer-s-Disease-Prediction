import { Droplet, FileText, ScanSearch, User, Weight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { analysisApi } from "@/api/analysis";
import { patientsApi } from "@/api/patients";
import { AnalysisTimeline } from "@/components/analysis/AnalysisTimeline";
import { BackButton } from "@/components/common/BackButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SEX_LABELS } from "@/utils/constants";
import type { Case, MRIAnalysis } from "@/types/api";

function InfoTile({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-soft text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
        <p className="mt-0.5 text-[13.5px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Case | null>(null);
  const [analyses, setAnalyses] = useState<MRIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([patientsApi.getCase(Number(id)), analysisApi.history({ case: Number(id) })])
      .then(([caseData, history]) => {
        setPatient(caseData);
        setAnalyses(history.results);
      })
      .catch(() => setError("Couldn't load this user's record."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <SkeletonCard />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorState description={error ?? "User not found."} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <BackButton label="Back to users" to="/app/users" />

      <Card className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-elevated">
            {patient.photo_url ? (
              <img src={patient.photo_url} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-7 text-ink-subtle" />
            )}
          </span>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-ink">{patient.full_name || patient.case_id}</h1>
            <p className="mono-tag text-[12px] text-ink-subtle">{patient.case_id}</p>
          </div>
          <Link to="/app/analyze">
            <Button iconLeft={<ScanSearch />}>New analysis</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoTile icon={User} label="Age" value={patient.age_years ? `${patient.age_years} years` : "—"} />
          <InfoTile icon={User} label="Gender" value={SEX_LABELS[patient.sex]} />
          <InfoTile icon={Droplet} label="Blood group" value={patient.blood_group || "—"} />
          <InfoTile icon={Weight} label="Weight" value={patient.weight_kg ? `${patient.weight_kg} kg` : "—"} />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink">Analysis Timeline</h2>
          <Badge tone="muted">{analyses.length} {analyses.length === 1 ? "analysis" : "analyses"}</Badge>
        </div>
        {analyses.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No analyses yet"
            description="Run an analysis for this case to see it here."
            action={{ label: "Analyze an MRI", onClick: () => navigate("/app/analyze"), icon: <ScanSearch /> }}
          />
        ) : (
          <AnalysisTimeline analyses={analyses} />
        )}
      </Card>

      <p className="text-center text-[12px] text-ink-subtle">
        Multiple analyses over time reflect independent model predictions on separate scans — not a claim of
        diagnosed disease progression.
      </p>
    </div>
  );
}
