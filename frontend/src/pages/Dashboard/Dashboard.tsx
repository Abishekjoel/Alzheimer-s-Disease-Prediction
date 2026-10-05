import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  FileText,
  History as HistoryIcon,
  PlusCircle,
  ScanSearch,
  Users as UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";

import { AnalysisStatusBadge, PredictionBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatDateTime, formatPercent } from "@/utils/format";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface QuickLink {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const QUICK_LINKS: QuickLink[] = [
  { href: "/app/analyze", icon: ScanSearch, title: "Analyze MRI", description: "Upload and run a new analysis" },
  { href: "/app/users", icon: UsersIcon, title: "View Users", description: "Search and review analyzed cases" },
  { href: "/app/history", icon: HistoryIcon, title: "View History", description: "Every analysis, filterable" },
  { href: "/app/reports", icon: FileText, title: "View Reports", description: "Download PDF reports" },
];

const CHART_COLORS: Record<string, string> = { CN: "#16a34a", MCI: "#d97706", AD: "#dc2626" };

export default function Dashboard() {
  const { user } = useAuth();
  const { summary, loading, error } = useDashboardData();

  const chartData = summary
    ? (["CN", "MCI", "AD"] as const).map((cls) => ({ name: cls, count: summary.class_distribution[cls] }))
    : [];
  const hasAnyDistributionData = chartData.some((d) => d.count > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {greeting()}{user?.profile?.full_name ? `, ${user.profile.full_name}` : user?.username ? `, ${user.username}` : ""}.
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">Review previous analyses or start a new MRI analysis.</p>
        </div>
        <Link to="/app/analyze">
          <Button iconLeft={<PlusCircle />}>Analyze New MRI</Button>
        </Link>
      </div>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Analyses" value={loading ? "—" : summary?.total_analyses ?? 0} icon={Activity} tone="primary" />
        <MetricCard label="Today's Analyses" value={loading ? "—" : summary?.today_analyses ?? 0} icon={Calendar} tone="secondary" />
        <MetricCard label="Reports Generated" value={loading ? "—" : summary?.reports_generated ?? 0} icon={FileText} tone="muted" />
        <MetricCard label="Total Users" value={loading ? "—" : summary?.total_cases ?? 0} icon={UsersIcon} tone="success" />
      </div>

      <div>
        <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} to={link.href}>
              <Card interactive padding="sm" className="flex h-full flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary-soft text-primary">
                    <link.icon className="size-4" />
                  </span>
                  <ChevronRight className="size-4 text-ink-subtle" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{link.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">{link.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <CardTitle>Analysis Distribution</CardTitle>
          </div>
        </CardHeader>
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : !hasAnyDistributionData ? (
          <p className="py-10 text-center text-[13px] text-ink-subtle">No analysis data yet.</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "var(--surface-elevated)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={CHART_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card padding="none">
        <CardHeader className="p-6 pb-0">
          <CardTitle>Recent Analyses</CardTitle>
          <Link to="/app/history" className="text-[13px] font-medium text-primary hover:text-primary-hover">
            View all
          </Link>
        </CardHeader>
        <div className="p-6 pt-4">
          {loading ? (
            <SkeletonCard />
          ) : !summary || summary.recent_analyses.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No MRI analyses yet"
              description="Your first analysis will appear here."
              action={{ label: "Analyze an MRI", onClick: () => (window.location.href = "/app/analyze"), icon: <ScanSearch /> }}
            />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {summary.recent_analyses.map((a) => (
                <Link
                  key={a.id}
                  to={`/app/results/${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:bg-surface-elevated/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{a.full_name || a.case_id}</p>
                    <p className="text-[12px] text-ink-subtle">
                      {a.age_years ? `Age ${a.age_years}` : "Age —"} · {a.blood_group || "—"} · {formatDateTime(a.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.predicted_class ? <PredictionBadge predictedClass={a.predicted_class} /> : <span className="text-[12px] text-ink-subtle">—</span>}
                    <span className="mono-tag text-[12.5px] text-ink-muted">{formatPercent(a.confidence)}</span>
                    <AnalysisStatusBadge status={a.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
