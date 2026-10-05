import { AlertCircle, FileImage, UploadCloud, X } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent } from "react";

import { formatFileSize } from "@/utils/format";
import { cn } from "@/utils/cn";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

interface UploadZoneProps {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

function validate(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a JPG or PNG image.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is 15 MB.`;
  }
  return null;
}

export function UploadZone({ file, onFileSelected, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((candidate: File) => {
    const validationError = validate(candidate);
    if (validationError) {
      setError(validationError);
      onFileSelected(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    onFileSelected(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  }, [onFileSelected]);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  function clear() {
    onFileSelected(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file && previewUrl) {
    return (
      <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-success/30 bg-success-soft p-4">
        <img src={previewUrl} alt="Selected MRI preview" className="size-16 shrink-0 rounded-[var(--radius-sm)] object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{file.name}</p>
          <p className="text-[12px] text-ink-muted">{formatFileSize(file.size)}</p>
        </div>
        {!disabled && (
          <button
            onClick={clear}
            aria-label="Remove selected file"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        aria-label="Upload MRI image"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-14 text-center transition-colors duration-[var(--duration-fast)]",
          disabled ? "cursor-not-allowed opacity-50 border-border" : "cursor-pointer border-border-strong hover:border-primary/50 hover:bg-primary-soft/30",
          dragOver && "border-primary bg-primary-soft/40",
          error && "border-danger/50 bg-danger-soft/20",
        )}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-elevated text-primary">
          {error ? <AlertCircle className="size-5 text-danger" /> : <UploadCloud className="size-5" />}
        </span>
        <div>
          <p className="text-[14px] font-medium text-ink">Drag &amp; drop an MRI image</p>
          <p className="mt-1 text-[13px] text-ink-muted">or click to browse — JPG or PNG, up to 15 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) handleFile(selected);
          }}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-danger">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      )}
      <p className="flex items-center gap-1.5 text-[11.5px] text-ink-subtle">
        <FileImage className="size-3.5" /> Images are validated and quality-checked before analysis.
      </p>
    </div>
  );
}
