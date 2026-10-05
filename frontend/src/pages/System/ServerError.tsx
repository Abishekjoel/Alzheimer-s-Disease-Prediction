import { ServerCrash } from "lucide-react";

import { SystemStatePage } from "@/components/common/SystemStatePage";

export default function ServerError() {
  return (
    <SystemStatePage
      icon={ServerCrash}
      code="500"
      title="Something went wrong on our end"
      description="The server encountered an unexpected error. Please try again in a moment."
    />
  );
}
