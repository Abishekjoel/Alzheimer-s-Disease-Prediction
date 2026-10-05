import { Brain, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Analyze an MRI", href: "/app/analyze" },
      { label: "Dashboard", href: "/app/dashboard" },
      { label: "Reports", href: "/app/reports" },
    ],
  },
  {
    title: "Technology",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Attention fusion", href: "/#technology" },
      { label: "Explainability", href: "/#explainability" },
    ],
  },
  {
    title: "Research",
    links: [{ label: "Methodology", href: "/research" }],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 flex flex-col gap-3 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Brain className="size-3.5" />
              </span>
              <span className="text-sm font-semibold text-ink">NeuroVista</span>
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-ink-muted">
              Built for research in explainable neuroimaging.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-1.5 text-[13px] text-ink-subtle hover:text-ink"
            >
              <ExternalLink className="size-4" /> GitHub
            </a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">{col.title}</span>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-[13px] text-ink-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-[12px] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} NeuroVista. Research &amp; educational use only.</span>
          <span>Not a substitute for professional medical diagnosis.</span>
        </div>
      </div>
    </footer>
  );
}
