import { Brain, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useAuth } from "@/context/AuthContext";
import { NAV_LINKS_PUBLIC } from "@/utils/constants";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <GlassPanel
        className={`flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-shadow duration-[var(--duration-base)] ${
          scrolled ? "shadow-[var(--shadow-lg)]" : "shadow-none"
        }`}
      >
        <Link to="/" className="flex items-center gap-2 pl-1.5">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Brain className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">NeuroVista</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS_PUBLIC.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-elevated hover:text-ink"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <Link to="/app/dashboard">
              <Button size="sm" variant="secondary">
                Go to dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </Link>
              <Link to="/app/analyze">
                <Button size="sm">Analyze an MRI</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="inline-flex size-9 items-center justify-center rounded-full text-ink lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </GlassPanel>

      {mobileOpen && (
        <div className="absolute inset-x-4 top-[calc(100%+0.5rem)] lg:hidden">
          <GlassPanel className="flex flex-col gap-1 rounded-2xl p-3">
            {NAV_LINKS_PUBLIC.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-elevated hover:text-ink"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link to="/app/analyze" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Analyze an MRI</Button>
              </Link>
            </div>
          </GlassPanel>
        </div>
      )}
    </header>
  );
}
