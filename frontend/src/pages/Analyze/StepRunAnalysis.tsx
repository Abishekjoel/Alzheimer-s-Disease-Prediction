import { AlertTriangle, ArrowLeft, Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { analysisApi } from "@/api/analysis";
import { ApiError } from "@/api/client";
import { AnalysisProgress } from "@/components/analysis/AnalysisProgress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PersonalDetails } from "@/pages/Analyze/StepPersonalDetails";

interface StepRunAnalysisProps {
  details: PersonalDetails;
  caseId: number;
  file: File;
  onBack: () => void;
  onQualityRejected: () => void;
}

export function StepRunAnalysis({ details, caseId, file, onBack, onQualityRejected }: StepRunAnalysisProps) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [rejection, setRejection] = useState<{ score: number | null; issues: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function runAnalysis() {
    setRunning(true);
    setDone(false);
    setRejection(null);
    setError(null);
    try {
      const analysis = await analysisApi.upload(caseId, file);
      if (analysis.status === "quality_rejected") {
        setDone(true);
        setRejection({ score: analysis.quality_score, issues: analysis.quality_issues });
        setRunning(false);
        return;
      }
      setDone(true);
      window.setTimeout(() => navigate(`/app/results/${analysis.id}`), 400);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Analysis failed. Please try again.");
      setRunning(false);
    }
  }

  if (rejection) {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
          <AlertTriangle className="size-6" />
        </span>
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Image quality requires review</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Quality score: {rejection.score !== null ? `${Math.round(rejection.score * 100)}%` : "—"}
          </p>
        </div>
        <ul className="flex flex-col gap-1.5 text-left text-[13px] text-ink-muted">
          {rejection.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warning" /> {issue}
            </li>
          ))}
        </ul>
        <Button onClick={onQualityRejected}>Upload a different scan</Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h2 className="text-[16px] font-semibold text-ink">Ready to analyze</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Reviewing details for <span className="font-medium text-ink">{details.full_name}</span> before running the
          hybrid CNN + Swin Transformer pipeline.
        </p>
      </div>

      {running ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-5">
          <AnalysisProgress active={running} done={done} />
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" iconLeft={<ArrowLeft />} onClick={onBack}>
              Back
            </Button>
            <Button size="lg" iconLeft={<Play />} onClick={runAnalysis}>
              Run AI Analysis
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
