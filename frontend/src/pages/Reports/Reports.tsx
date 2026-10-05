import { Download, Eye, FileText, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { analysisApi } from "@/api/analysis";
import { ApiError } from "@/api/client";
import { reportsApi } from "@/api/reports";
import { ReportPreviewModal } from "@/components/analysis/ReportPreviewModal";
import { PredictionBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/utils/format";
import type { MRIAnalysis } from "@/types/api";

export default function Reports() {
  const [analyses, setAnalyses] = useState<MRIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ analysisId: number; reportUrl: string } | null>(null);
  const { push } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    reportsApi
      .list()
      .then(setAnalyses)
      .catch(() => setError("Couldn't load completed analyses."))
      .finally(() => setLoading(false));
  }, []);

  async function onView(id: number) {
    setPendingId(id);
    try {
      const { report_url } = await analysisApi.report(id);
      setPreview({ analysisId: id, reportUrl: report_url });
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't generate the report.", "danger");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading eyebrow="Reports" title="Research reports" description="Generate a PDF report for any completed analysis." />

      {loading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      ) : analyses.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No reports generated yet."
            description="Reports become available once an analysis completes."
            action={{ label: "Analyze an MRI", onClick: () => navigate("/app/analyze"), icon: <ScanSearch /> }}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {analyses.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                  <FileText className="size-4.5" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ink">{a.case.full_name || a.case_id}</p>
                  <p className="text-[12px] text-ink-subtle">
                    {a.case_id} · {formatDateTime(a.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.predicted_class && <PredictionBadge predictedClass={a.predicted_class} />}
                <Button size="sm" variant="secondary" iconLeft={<Eye />} loading={pendingId === a.id} onClick={() => onView(a.id)}>
                  View
                </Button>
                {a.report_url && (
                  <a href={a.report_url} target="_blank" rel="noreferrer" download>
                    <Button size="sm" iconLeft={<Download />}>
                      Download
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <ReportPreviewModal
          open
          onClose={() => setPreview(null)}
          analysisId={preview.analysisId}
          reportUrl={preview.reportUrl}
        />
      )}
    </div>
  );
}
