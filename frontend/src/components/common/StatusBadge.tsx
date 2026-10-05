import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { PREDICTION_TONE, STATUS_LABELS, STATUS_TONE, UNCERTAINTY_TONE } from "@/utils/constants";
import type { AnalysisStatus, PredictedClass, UncertaintyLevel } from "@/types/api";

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  return (
    <Badge tone={STATUS_TONE[status] as BadgeTone} dot>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PredictionBadge({ predictedClass }: { predictedClass: PredictedClass }) {
  return (
    <Badge tone={PREDICTION_TONE[predictedClass]} dot>
      {predictedClass}
    </Badge>
  );
}

export function UncertaintyBadge({ level }: { level: UncertaintyLevel }) {
  return (
    <Badge tone={UNCERTAINTY_TONE[level]} dot>
      {level}
    </Badge>
  );
}

export function DemoBadge() {
  return <Badge tone="primary">DEMO</Badge>;
}
