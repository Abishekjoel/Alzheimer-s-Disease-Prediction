import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { IconButton } from "@/components/ui/IconButton";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/utils/cn";

type ViewMode = "original" | "gradcam" | "attention" | "overlay";

interface HeatmapViewerProps {
  imageUrl: string | null;
  gradcamUrl: string | null;
  attentionUrl: string | null;
}

/**
 * Real explainability viewer — every image shown is an actual URL
 * returned by the API for this specific analysis (image_url / gradcam_url
 * / attention_map_url), never a placeholder. "Overlay" blends the
 * Grad-CAM and attention images over the original using CSS opacity,
 * which keeps spatial alignment automatic since all three assets share
 * the original image's dimensions.
 */
export function HeatmapViewer({ imageUrl, gradcamUrl, attentionUrl }: HeatmapViewerProps) {
  const [mode, setMode] = useState<ViewMode>("original");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const tabs = [
    { value: "original" as const, label: "Original" },
    { value: "gradcam" as const, label: "Grad-CAM", icon: undefined },
    { value: "attention" as const, label: "Attention" },
    { value: "overlay" as const, label: "Overlay" },
  ].filter((t) => t.value === "original" || (t.value === "gradcam" && gradcamUrl) || (t.value === "attention" && attentionUrl) || (t.value === "overlay" && (gradcamUrl || attentionUrl)));

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (zoom <= 1) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }
  function onPointerUp() {
    dragState.current = null;
  }

  const canvas = (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-bg",
        zoom > 1 && "cursor-grab active:cursor-grabbing",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {!imageUrl ? (
        <div className="flex h-full items-center justify-center text-[13px] text-ink-subtle">No image available</div>
      ) : (
        <div
          className="relative h-full w-full transition-transform duration-150"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img src={imageUrl} alt="MRI slice" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
          {(mode === "gradcam" || mode === "overlay") && gradcamUrl && (
            <img
              src={gradcamUrl}
              alt="Grad-CAM overlay"
              draggable={false}
              className={cn("absolute inset-0 h-full w-full object-contain transition-opacity duration-300", mode === "overlay" ? "opacity-60" : "opacity-100")}
            />
          )}
          {(mode === "attention" || mode === "overlay") && attentionUrl && (
            <img
              src={attentionUrl}
              alt="Swin attention overlay"
              draggable={false}
              className={cn("absolute inset-0 h-full w-full object-contain transition-opacity duration-300", mode === "overlay" ? "opacity-60" : "opacity-100")}
            />
          )}
        </div>
      )}
    </div>
  );

  const controls = (
    <div className="flex items-center justify-between">
      <Tabs items={tabs} value={mode} onChange={(v) => setMode(v as ViewMode)} />
      <div className="flex items-center gap-1">
        <IconButton icon={<Minus />} label="Zoom out" size="sm" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} />
        <span className="mono-tag w-10 text-center text-[11px] text-ink-subtle">{Math.round(zoom * 100)}%</span>
        <IconButton icon={<Plus />} label="Zoom in" size="sm" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} />
        <IconButton icon={<RotateCcw />} label="Reset view" size="sm" onClick={resetView} />
        <IconButton icon={fullscreen ? <X /> : <Maximize2 />} label={fullscreen ? "Exit fullscreen" : "Fullscreen"} size="sm" onClick={() => setFullscreen((v) => !v)} />
      </div>
    </div>
  );

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[150] flex flex-col gap-4 bg-bg/95 p-6 backdrop-blur">
        {controls}
        <div className="flex-1 min-h-0">{canvas}</div>
      </div>,
      document.body,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {controls}
      {canvas}
    </div>
  );
}
