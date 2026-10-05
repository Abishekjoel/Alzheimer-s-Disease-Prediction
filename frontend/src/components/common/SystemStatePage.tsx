import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

interface SystemStatePageProps {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function SystemStatePage({ icon: Icon, code, title, description, actionLabel = "Back to home", actionHref = "/" }: SystemStatePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg bg-grid px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full border border-border-strong bg-surface text-primary">
        <Icon className="size-7" />
      </span>
      {code && <span className="mono-tag mt-6 text-sm font-medium text-ink-subtle">{code}</span>}
      <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-muted">{description}</p>
      <Link to={actionHref} className="mt-6">
        <Button>{actionLabel}</Button>
      </Link>
    </div>
  );
}
