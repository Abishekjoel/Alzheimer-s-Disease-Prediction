import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/cn";

/** Single-image medical-viewer-style preview: zoom, reset, fullscreen, pan
 * when zoomed. Used for the raw MRI upload preview (Analyze wizard step
 * 2) — the tabbed original/Grad-CAM/attention viewer lives separately in
 * components/mri/HeatmapViewer.tsx for the Results page. */
export function SimpleImageViewer({ src, alt = "MRI preview" }: { src: string; alt?: string }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

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
    setPan({
      x: dragState.current.panX + (e.clientX - dragState.current.startX),
      y: dragState.current.panY + (e.clientY - dragState.current.startY),
    });
  }

  const canvas = (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-bg",
        zoom > 1 && "cursor-grab active:cursor-grabbing",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (dragState.current = null)}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute inset-0 size-full object-contain transition-transform duration-150"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      />
    </div>
  );

  const controls = (
    <div className="flex items-center justify-end gap-1">
      <IconButton icon={<Minus />} label="Zoom out" size="sm" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} />
      <span className="mono-tag w-10 text-center text-[11px] text-ink-subtle">{Math.round(zoom * 100)}%</span>
      <IconButton icon={<Plus />} label="Zoom in" size="sm" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} />
      <IconButton icon={<RotateCcw />} label="Reset view" size="sm" onClick={resetView} />
      <IconButton
        icon={fullscreen ? <X /> : <Maximize2 />}
        label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        size="sm"
        onClick={() => setFullscreen((v) => !v)}
      />
    </div>
  );

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[150] flex flex-col gap-4 bg-bg/95 p-6 backdrop-blur">
        {controls}
        <div className="min-h-0 flex-1">{canvas}</div>
      </div>,
      document.body,
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {controls}
      {canvas}
    </div>
  );
}
