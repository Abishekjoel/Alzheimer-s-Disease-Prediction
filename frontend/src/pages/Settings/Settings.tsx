import { Bell, Info, Server, Shield, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { API_BASE, apiClient } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useTheme } from "@/context/ThemeContext";

function SettingsSection({ icon: Icon, title, description, children }: { icon: typeof Sun; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="mb-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary-soft text-primary">
            <Icon className="size-4.5" />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-0">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

function useApiStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    apiClient
      .get("/api/models/")
      .then(() => {
        setLatencyMs(Math.round(performance.now() - start));
        setStatus("online");
      })
      .catch(() => setStatus("offline"));
  }, []);

  return { status, latencyMs };
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { status, latencyMs } = useApiStatus();
  const [notifyCompletion, setNotifyCompletion] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <SectionHeading eyebrow="Preferences" title="Settings" />

      <SettingsSection icon={Sun} title="Theme" description="Choose how NeuroVista looks on this device.">
        <div className="flex gap-3">
          {(["dark", "light"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setTheme(opt)}
              className={`flex-1 rounded-[var(--radius-md)] border px-4 py-3 text-left text-[13px] font-medium capitalize transition-colors ${
                theme === opt ? "border-primary bg-primary-soft text-primary" : "border-border-strong text-ink-muted hover:border-border-strong hover:text-ink"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications" description="Local preview only — not yet wired to a notification backend.">
        <div className="flex flex-col gap-3">
          <Checkbox label="Notify me when an analysis completes" checked={notifyCompletion} onChange={(e) => setNotifyCompletion(e.target.checked)} />
          <Checkbox label="Weekly research digest" checked={notifyDigest} onChange={(e) => setNotifyDigest(e.target.checked)} />
        </div>
      </SettingsSection>

      <SettingsSection icon={Shield} title="Security" description="Account credentials and sessions.">
        <p className="text-[12.5px] text-ink-subtle">
          Password changes aren't available yet — there's no account/change-password endpoint on the backend today.
          This section is a placeholder for that future flow.
        </p>
      </SettingsSection>

      <SettingsSection icon={Server} title="API status" description="Connectivity to the Django backend.">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink-muted">Status</span>
          <Badge tone={status === "online" ? "success" : status === "offline" ? "danger" : "muted"} dot>
            {status === "checking" ? "Checking…" : status === "online" ? "Online" : "Offline"}
          </Badge>
        </div>
        {latencyMs !== null && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] text-ink-muted">Latency</span>
            <span className="mono-tag text-[13px] text-ink">{latencyMs} ms</span>
          </div>
        )}
      </SettingsSection>

      <SettingsSection icon={Info} title="System information" description="Build details for this session.">
        <div className="flex flex-col gap-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">API base URL</span>
            <span className="mono-tag text-ink">{API_BASE || window.location.origin}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Frontend</span>
            <span className="mono-tag text-ink">React 19 + Vite</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
