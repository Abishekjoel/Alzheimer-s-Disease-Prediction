import { Camera, User, X } from "lucide-react";
import { useRef, useState } from "react";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/cn";

interface PhotoPickerProps {
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  size?: "md" | "lg";
}

/** Circular photo upload/preview/replace/remove control — used for both
 * case photos (Analyze wizard) and profile pictures. */
export function PhotoPicker({ file, existingUrl, onChange, size = "lg" }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    onChange(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function onRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const dimension = size === "lg" ? "size-28" : "size-16";

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-full border border-border-strong bg-surface-elevated",
          dimension,
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Profile preview" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-ink-subtle">
            <User className={size === "lg" ? "size-9" : "size-6"} />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-5 text-white" />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onSelect} />
      <div className="flex flex-col gap-1.5">
        <p className="text-[12.5px] text-ink-muted">
          {previewUrl ? file?.name ?? "Current photo" : "Click to upload a photo (optional)"}
        </p>
        {previewUrl && (
          <IconButton
            icon={<X />}
            label="Remove photo"
            size="sm"
            variant="filled"
            onClick={onRemove}
            className="w-fit"
          />
        )}
      </div>
    </div>
  );
}
