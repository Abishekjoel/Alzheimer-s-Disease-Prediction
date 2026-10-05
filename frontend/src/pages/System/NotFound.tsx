import { Compass } from "lucide-react";

import { SystemStatePage } from "@/components/common/SystemStatePage";

export default function NotFound() {
  return (
    <SystemStatePage
      icon={Compass}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
    />
  );
}
