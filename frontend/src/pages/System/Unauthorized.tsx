import { ShieldAlert } from "lucide-react";

import { SystemStatePage } from "@/components/common/SystemStatePage";

export default function Unauthorized() {
  return (
    <SystemStatePage
      icon={ShieldAlert}
      code="401"
      title="Sign in required"
      description="You need to be signed in to view this page."
      actionLabel="Log in"
      actionHref="/login"
    />
  );
}
