import { AlertOctagon, Download, FileWarning, Loader2, ScanSearch } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { analysisApi } from "@/api/analysis";
import { ApiError } from "@/api/client";
import { AnalysisDetails } from "@/components/analysis/AnalysisDetails";
import { CaseSummaryCard } from "@/components/analysis/CaseSummaryCard";
import { MethodologyNote } from "@/components/analysis/MethodologyNote";
import { ModelBadge } from "@/components/analysis/ModelBadge";
import { ReportPreviewModal } from "@/components/analysis/ReportPreviewModal";
import { ProbabilityBar } from "@/components/charts/ProbabilityBar";
import { BackButton } from "@/components/common/BackButton";
import { DemoBadge, UncertaintyBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { HeatmapViewer } from "@/components/mri/HeatmapViewer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useAnalysis } from "@/hooks/useAnalysis";
import { CLASS_NAMES, PREDICTION_LABELS, PREDICTION_TONE } from "@/utils/constants";
import { formatPercent } from "@/utils/format";

// Tailwind's JIT scanner needs literal class strings, not `text-${var}`
// interpolation, or the color utility gets tree-shaken out of the build.
const PREDICTION_TEXT_CLASS: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

function ResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <BackButton label="Back to history" to="/app/history" />
      {children}
    </div>
  );
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { analysis, loading, error, refetch } = useAnalysis(Number(id));
  const { push } = useToast();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  if (loading) {
    return (
      <ResultsShell>
        <SkeletonCard />
      </ResultsShell>
    );
  }

  if (error || !analysis) {
    return (
      <ResultsShell>
        <ErrorState title="Couldn't load this analysis" description={error ?? undefined} onRetry={refetch} />
      </ResultsShell>
    );
  }

  async function onGenerateReport() {
    if (!analysis) return;
    setGeneratingReport(true);
    try {
      const { report_url } = await analysisApi.report(analysis.id);
      setReportUrl(report_url);
      setPreviewOpen(true);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't generate the report.", "danger");
    } finally {
      setGeneratingReport(false);
    }
  }

  if (analysis.status === "quality_rejected") {
    return (
      <ResultsShell>
        <Card className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-12 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
            <FileWarning className="size-6" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-ink">Image quality rejected</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              Quality score: {analysis.quality_score !== null ? formatPercent(analysis.quality_score) : "—"}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-left text-[13px] text-ink-muted">
            {analysis.quality_issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warning" /> {issue}
              </li>
            ))}
          </ul>
          <Link to="/app/analyze" className="mt-2">
            <Button iconLeft={<ScanSearch />}>Try another image</Button>
          </Link>
        </Card>
      </ResultsShell>
    );
  }

  if (analysis.status === "failed") {
    return (
      <ResultsShell>
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
          <ErrorState icon={AlertOctagon} title="Analysis failed" description={analysis.error_message || "The pipeline could not complete for this image."} />
          <Link to="/app/analyze">
            <Button iconLeft={<ScanSearch />}>Try another image</Button>
          </Link>
        </div>
      </ResultsShell>
    );
  }

  if (analysis.status === "pending") {
    return (
      <ResultsShell>
        <Card className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 py-12 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-[13px] text-ink-muted">Still processing…</p>
        </Card>
      </ResultsShell>
    );
  }

  const predictedClass = analysis.predicted_class!;

  return (
    <ResultsShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Case {analysis.case_id}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Analysis results</h1>
        </div>
        <div className="flex items-center gap-2">
          {analysis.is_demo && <DemoBadge />}
          <ModelBadge model={analysis.model_version} />
          <Button variant="secondary" iconLeft={<Download />} loading={generatingReport} onClick={onGenerateReport}>
            Generate Report
          </Button>
        </div>
      </div>

      <CaseSummaryCard patient={analysis.case} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="flex flex-col gap-6">
          <div>
            <span className="text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Model output</span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className={`text-4xl font-semibold ${PREDICTION_TEXT_CLASS[PREDICTION_TONE[predictedClass]]}`}>{predictedClass}</span>
              {analysis.confidence !== null && (
                <span className="mono-tag text-sm text-ink-muted">{formatPercent(analysis.confidence)} confidence</span>
              )}
            </div>
            <p className="mt-1.5 text-[13px] text-ink-muted">{PREDICTION_LABELS[predictedClass]}</p>
          </div>

          {analysis.probabilities && (
            <div className="flex flex-col gap-2.5">
              {CLASS_NAMES.map((cls) => (
                <ProbabilityBar
                  key={cls}
                  label={cls}
                  value={analysis.probabilities![cls]}
                  tone={cls === "CN" ? "success" : cls === "MCI" ? "warning" : "danger"}
                  highlighted={cls === predictedClass}
                />
              ))}
            </div>
          )}

          {analysis.uncertainty_level && (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3">
              <div>
                <p className="text-[12.5px] font-medium text-ink">Model uncertainty</p>
                <p className="mt-0.5 text-[11.5px] text-ink-subtle">Reflects the model's own consistency — not a clinical probability.</p>
              </div>
              <UncertaintyBadge level={analysis.uncertainty_level} />
            </div>
          )}

          <AnalysisDetails analysis={analysis} />
        </Card>

        <Card padding="md">
          <h2 className="mb-4 text-[13px] font-semibold text-ink">Explainability</h2>
          <HeatmapViewer imageUrl={analysis.image_url} gradcamUrl={analysis.gradcam_url} attentionUrl={analysis.attention_map_url} />
        </Card>
      </div>

      <MethodologyNote />

      <p className="text-center text-[12px] text-ink-subtle">
        Research and educational use only — not a substitute for professional medical diagnosis.
      </p>

      <ReportPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} analysisId={analysis.id} reportUrl={reportUrl} />
    </ResultsShell>
  );
}
