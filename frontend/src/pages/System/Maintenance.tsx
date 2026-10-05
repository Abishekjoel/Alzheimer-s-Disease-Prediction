import { Construction } from "lucide-react";

import { SystemStatePage } from "@/components/common/SystemStatePage";

export default function Maintenance() {
  return (
    <SystemStatePage
      icon={Construction}
      title="Scheduled maintenance"
      description="NeuroVista is undergoing scheduled maintenance. Please check back shortly."
    />
  );
}
