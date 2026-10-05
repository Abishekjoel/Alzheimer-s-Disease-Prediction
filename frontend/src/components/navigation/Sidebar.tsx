import {
  Brain,
  ChevronsLeft,
  ChevronsRight,
  History,
  LayoutDashboard,
  ScanSearch,
  Settings,
  FileText,
  Users,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Analyze MRI", href: "/app/analyze", icon: ScanSearch },
  { label: "Users", href: "/app/users", icon: Users },
  { label: "History", href: "/app/history", icon: History },
  { label: "Reports", href: "/app/reports", icon: FileText },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-bg-elevated transition-[width] duration-[var(--duration-base)] ease-[var(--ease-premium)] md:flex",
        collapsed ? "w-[76px]" : "w-64",
        className,
      )}
    >
      <div className={cn("flex h-16 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Brain className="size-4" />
          </span>
          {!collapsed && <span className="text-[15px] font-semibold text-ink">NeuroVista</span>}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const link = (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium transition-colors duration-[var(--duration-fast)]",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-ink-muted hover:bg-surface-elevated hover:text-ink",
                )
              }
            >
              <item.icon className="size-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
          return collapsed ? (
            <Tooltip key={item.href} content={item.label} side="top">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border px-3 py-3">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium",
              collapsed && "justify-center px-0",
              isActive ? "bg-primary-soft text-primary" : "text-ink-muted hover:bg-surface-elevated hover:text-ink",
            )
          }
        >
          <Settings className="size-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium text-ink-subtle hover:bg-surface-elevated hover:text-ink",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export const SIDEBAR_NAV_ITEMS = NAV_ITEMS;
