"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CalendarCheck, CheckSquare, Menu, X } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 font-medium"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-4 h-4" aria-hidden />
      {label}
    </Link>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className="hidden sm:flex gap-4"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={Icon}
              isActive={isActive}
            />
          );
        })}
      </nav>

      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" aria-hidden />
        </button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 sm:hidden flex flex-col"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-medium text-slate-900 dark:text-white">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <nav className="p-4 flex flex-col gap-1" aria-label="Main navigation">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                return (
                  <NavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={Icon}
                    isActive={isActive}
                    onClick={() => setMobileOpen(false)}
                  />
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
