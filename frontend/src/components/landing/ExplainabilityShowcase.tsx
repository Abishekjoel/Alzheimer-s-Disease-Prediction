import { useState } from "react";

import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/utils/cn";

type ViewMode = "original" | "gradcam" | "attention" | "overlay";

const TABS = [
  { value: "original" as const, label: "Original" },
  { value: "gradcam" as const, label: "Grad-CAM" },
  { value: "attention" as const, label: "Attention" },
  { value: "overlay" as const, label: "Overlay" },
];

/**
 * Schematic illustration only — this is the public landing page, so there
 * is no real per-user analysis to display. The shapes below are an
 * abstract stand-in for slice geometry, not a real MRI or real model
 * output; the actual Grad-CAM/attention renderer (fed by real
 * gradcam_url/attention_map_url from the API) lives in
 * components/mri/HeatmapViewer for the authenticated Results page.
 */
export function ExplainabilityShowcase() {
  const [mode, setMode] = useState<ViewMode>("original");

  return (
    <div className="flex flex-col items-center gap-6">
      <Tabs items={TABS} value={mode} onChange={(v) => setMode(v as ViewMode)} />

      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-border-strong bg-bg shadow-[var(--shadow-lg)]">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="baseTissue" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#1a2138" />
              <stop offset="100%" stopColor="#070a12" />
            </radialGradient>
            <radialGradient id="heatHot" cx="38%" cy="40%" r="35%">
              <stop offset="0%" stopColor="#f0554c" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#f5a524" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f5a524" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="attnCool" cx="62%" cy="55%" r="38%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#7c5cff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="100" cy="102" rx="72" ry="82" fill="url(#baseTissue)" stroke="var(--border-strong)" strokeWidth="1" />
          <path d="M60 60 C 80 40, 120 40, 140 60 C 155 90, 150 140, 100 160 C 50 140, 45 90, 60 60 Z" fill="none" stroke="rgba(139,92,246,0.25)" strokeWidth="1.2" />
          <path d="M75 75 C 90 65, 110 65, 125 75 C 132 95, 128 125, 100 138 C 72 125, 68 95, 75 75 Z" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />

          <g className={cn("transition-opacity duration-500", mode === "gradcam" || mode === "overlay" ? "opacity-100" : "opacity-0")}>
            <circle cx="76" cy="86" r="40" fill="url(#heatHot)" />
          </g>
          <g className={cn("transition-opacity duration-500", mode === "attention" || mode === "overlay" ? "opacity-100" : "opacity-0")}>
            <circle cx="122" cy="112" r="38" fill="url(#attnCool)" />
          </g>
        </svg>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="mono-tag rounded-full border border-border-strong bg-surface/80 px-2.5 py-1 text-[10px] text-ink-subtle backdrop-blur">
            SLICE 84 / 160
          </span>
          <span className="mono-tag rounded-full border border-border-strong bg-surface/80 px-2.5 py-1 text-[10px] text-ink-subtle backdrop-blur">
            SCHEMATIC
          </span>
        </div>
      </div>

      <p className="max-w-md text-center text-[12.5px] text-ink-subtle">
        Illustrative example — connect a real analysis in the app to view actual Grad-CAM and Swin attention output for
        that image.
      </p>
    </div>
  );
}
