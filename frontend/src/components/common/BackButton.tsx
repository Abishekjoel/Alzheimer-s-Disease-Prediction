import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  label?: string;
  to?: string;
  className?: string;
}

/** Explicit `to` navigates there directly; otherwise falls back to browser
 * history (`navigate(-1)`), matching what a "back" control usually means. */
export function BackButton({ label = "Back", to, className }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink ${className ?? ""}`}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}
