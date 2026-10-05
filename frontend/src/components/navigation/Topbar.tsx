import { LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/utils/cn";

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-bg/80 px-5 backdrop-blur">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <input
          type="search"
          placeholder="Search cases, analyses, models…"
          className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <IconButton
        icon={theme === "dark" ? <Sun /> : <Moon />}
        label="Toggle theme"
        variant="filled"
        onClick={toggleTheme}
      />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 hover:border-border-strong"
        >
          <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[12px] font-semibold text-primary">
            {user?.profile?.profile_picture_url ? (
              <img src={user.profile.profile_picture_url} alt="" className="size-full object-cover" />
            ) : (
              user?.username.slice(0, 2).toUpperCase()
            )}
          </span>
          <span className="hidden text-[13px] font-medium text-ink sm:inline">{user?.username}</span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-[var(--radius-md)] border border-border-strong bg-surface-elevated p-1.5 shadow-[var(--shadow-lg)] animate-[modal-in_var(--duration-fast)_var(--ease-premium)]">
              <div className="px-2.5 py-2 text-[12px] text-ink-subtle truncate">{user?.email}</div>
              <Link
                to="/app/profile"
                onClick={() => setMenuOpen(false)}
                className={cn("flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] text-ink-muted hover:bg-surface-overlay hover:text-ink")}
              >
                <User className="size-4" /> Profile
              </Link>
              <Link
                to="/app/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] text-ink-muted hover:bg-surface-overlay hover:text-ink"
              >
                <Settings className="size-4" /> Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[13px] text-danger hover:bg-danger-soft"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
