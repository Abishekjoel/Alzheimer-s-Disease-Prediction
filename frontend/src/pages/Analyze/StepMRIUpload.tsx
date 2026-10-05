import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { SimpleImageViewer } from "@/components/mri/SimpleImageViewer";
import { UploadZone } from "@/components/mri/UploadZone";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface StepMRIUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function StepMRIUpload({ file, onChange, onBack, onContinue }: StepMRIUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h2 className="text-[16px] font-semibold text-ink">Upload MRI Scan</h2>
        <p className="mt-1 text-[13px] text-ink-muted">Drag and drop your scan here or browse files.</p>
      </div>

      <UploadZone file={file} onFileSelected={onChange} />

      {previewUrl && (
        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Preview</p>
          <SimpleImageViewer src={previewUrl} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" iconLeft={<ArrowLeft />} onClick={onBack}>
          Back
        </Button>
        <Button iconRight={<ArrowRight />} disabled={!file} onClick={onContinue}>
          Continue to analysis
        </Button>
      </div>
    </Card>
  );
}
