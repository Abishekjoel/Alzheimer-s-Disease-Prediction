import { Download, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { analysisApi } from "@/api/analysis";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

interface ReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  analysisId: number;
  reportUrl: string | null;
}

/** Shows the real generated PDF inline (browsers render PDFs natively in
 * an <iframe>/<object>) — not a mocked-up preview image. "Generate Again"
 * re-requests the report, which the backend regenerates fresh each time
 * it's requested without a cached report_path. */
export function ReportPreviewModal({ open, onClose, analysisId, reportUrl: propUrl }: ReportPreviewModalProps) {
  const [reportUrl, setReportUrl] = useState(propUrl);
  const [regenerating, setRegenerating] = useState(false);
  const { push } = useToast();

  // The modal is mounted once and toggled via `open`, so its own state
  // wouldn't otherwise notice the parent generating a URL after mount —
  // sync whenever the parent hands us a new one.
  useEffect(() => {
    setReportUrl(propUrl);
  }, [propUrl]);

  async function regenerate() {
    setRegenerating(true);
    try {
      const { report_url } = await analysisApi.report(analysisId);
      setReportUrl(`${report_url}${report_url.includes("?") ? "&" : "?"}t=${Date.now()}`);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't regenerate the report.", "danger");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report Preview" size="xl">
      <div className="flex flex-col gap-4">
        <div className="h-[70vh] overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-white">
          {reportUrl ? (
            <object data={reportUrl} type="application/pdf" className="size-full">
              <div className="flex size-full items-center justify-center p-6 text-center text-[13px] text-ink-muted">
                Your browser can't preview PDFs inline.{" "}
                <a href={reportUrl} target="_blank" rel="noreferrer" className="ml-1 font-medium text-primary">
                  Open the report directly
                </a>
                .
              </div>
            </object>
          ) : (
            <div className="flex size-full items-center justify-center text-[13px] text-ink-subtle">No report available</div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" iconLeft={<RotateCw />} onClick={regenerate} loading={regenerating}>
            Generate Again
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {reportUrl && (
              <a href={reportUrl} target="_blank" rel="noreferrer" download>
                <Button iconLeft={<Download />}>Download PDF</Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
