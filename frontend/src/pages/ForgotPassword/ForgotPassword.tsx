import { CheckCircle2, Mail, MailWarning } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { authApi } from "@/api/auth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Status = "idle" | "loading" | "sent" | "unavailable";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await authApi.requestPasswordReset(email);
      setStatus("sent");
    } catch {
      // Backend endpoint doesn't exist yet (see api/auth.ts) — say so
      // plainly rather than pretending an email was sent.
      setStatus("unavailable");
    }
  }

  if (status === "sent") {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-success/25 bg-success-soft p-6 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="text-[13px] text-ink-muted">
            If an account exists for <span className="text-ink font-medium">{email}</span>, a reset link is on its way.
          </p>
        </div>
        <Link to="/login" className="mt-6 block text-center text-[13px] font-medium text-primary hover:text-primary-hover">
          Back to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          iconLeft={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {status === "unavailable" && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-warning/25 bg-warning-soft px-3 py-2.5">
            <MailWarning className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
              Password reset isn't connected to a backend endpoint in this build yet — this is a UI preview of the
              flow. No email was sent.
            </p>
          </div>
        )}

        <Button type="submit" size="lg" loading={status === "loading"} className="mt-1 w-full">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-ink-muted">
        Remembered your password?{" "}
        <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
