"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, clearToken } from "@/lib/api";
import { Icon } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/completed", label: "Completed", icon: "archive" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api("/api/me");
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled && typeof window !== "undefined") window.location.href = "/login";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const user = (localStorage.getItem("gour_crm_user") || "Admin").replace(/"/g, "");

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-slate-900 text-slate-200 shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white">G</div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Gour CRM</p>
            <p className="text-[11px] text-slate-400">Startup workspace</p>
          </div>
        </div>

        <nav className="mt-2 px-3 py-2 space-y-1">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-indigo-500/90 text-white shadow" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon name={n.icon} className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white uppercase">{user[0] || "A"}</div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold text-slate-200">{user}</p>
              <p className="text-[10px] text-emerald-400">● Signed in</p>
            </div>
            <button
              onClick={() => {
                clearToken();
                localStorage.removeItem("gour_crm_user");
                window.location.href = "/login";
              }}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-300"
            >
              <Icon name="logout" className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-slate-900 px-4 text-slate-100 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">G</div>
          <span className="text-sm font-bold">Gour CRM</span>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-800" aria-label="Open menu">
          <svg viewBox="0 0 20 20" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path d="M4 4 h12 M4 10 h12 M4 16 h12" /></svg>
        </button>
      </header>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Content */}
      <main className="lg:ml-60 px-4 lg:px-8 py-6 lg:py-8 pt-20 lg:pt-8">{children}</main>
    </div>
  );
}