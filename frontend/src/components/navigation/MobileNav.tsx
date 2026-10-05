import { FileText, History, LayoutDashboard, Menu, ScanSearch, Settings, Users } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/utils/cn";

const PRIMARY_ITEMS = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Analyze", href: "/app/analyze", icon: ScanSearch },
  { label: "Users", href: "/app/users", icon: Users },
  { label: "History", href: "/app/history", icon: History },
];

const MORE_ITEMS = [
  { label: "Reports", href: "/app/reports", icon: FileText },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-bg-elevated/95 backdrop-blur px-2 py-2 md:hidden">
        {PRIMARY_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-sm)] py-1.5 text-[11px] font-medium",
                isActive ? "text-primary" : "text-ink-subtle",
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-sm)] py-1.5 text-[11px] font-medium text-ink-subtle"
        >
          <Menu className="size-5" />
          More
        </button>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More" side="right">
        <div className="flex flex-col gap-1 p-2">
          {MORE_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-elevated hover:text-ink"
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </Drawer>
    </>
  );
}
