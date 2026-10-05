import { Database } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { ModelVersion } from "@/types/api";

export function ModelBadge({ model }: { model: ModelVersion | null }) {
  if (!model) return <Badge tone="muted">No model version</Badge>;
  return (
    <Badge tone={model.is_demo ? "warning" : "primary"} icon={<Database />}>
      <span className="mono-tag">
        {model.name} v{model.version}
      </span>
    </Badge>
  );
}
