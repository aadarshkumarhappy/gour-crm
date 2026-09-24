"use client";

import React from "react";

/* ------------------------------ Icons ------------------------------ */

export function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="11" y="3" width="6" height="7" rx="1.5" opacity=".45"/><rect x="3" y="11" width="8" height="6" rx="1.5" opacity=".3"/><rect x="12" y="11" width="5" height="6" rx="1.5" opacity=".15"/>',
    leads:
      '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="11" cy="12.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    pipeline:
      '<path d="M3 3 h14 v14 h-14 v-14" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 17 v-6 h4 v6 h4 v-6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 3 v6 h-4 v-6 h-4 v6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    tasks:
      '<rect x="3.5" y="3.5" width="5" height="5" rx="1"/><rect x="3.5" y="11.5" width="5" height="5" rx="1"/><path d="M3.5 6 L17 5.6 M3.5 14 L17 14.4" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    archive:
      '<path d="M4 5.5 h8 v11 h-8 z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 3 v3 M8 19 v3" stroke="currentColor" stroke-width="1.6"/>',
    plus: '<path d="M8 3 v14 M3 8 h14" stroke="currentColor" stroke-width="2.2"/>',
    link: '<path d="M5 5 c-1-4 2-4 1-4 2-4 0 0 0 0 0 5 0 4 0-2 0-2-3-1-1-1 0 0-4 0-4-2 1-2 1-3 2.5-3 4 1 4.5 1-2 0-1-3-3-5-3.5-3.5-2.5-1.5-2.5 0-6.5 0-6.5" stroke="currentColor" fill="none" transform="translate(0 2) scale(.85)"/>',
    phone: '<path d="M3 7 h7 M3 7 v6 h4 M12 4 a3 3 0 0 1 3 3 z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    mail: '<rect x="3" y="4" width="9" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 5.5 h4.5 M10 9.5 h4.5" stroke="currentColor" stroke-width="1.5"/>',
    trash: '<path d="M4 4 v8 h9 v-8 z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 7 h9" stroke="currentColor" stroke-width="1.5"/><path d="M7 4 v6.5 M11.5 4 v6.5" stroke="currentColor" stroke-width="1.8"/>',
    edit: '<path d="M4 4 h9 v2.5 M7 8.5 h4.5 M6.5 11 h1.5 M10.5 11 h1.5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
    check: '<path d="M5 6 l2.5 2.5 l2.5 2.5 l2.5 2.5 z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dashoffset="-3" stroke-dasharray="6 3"/>',
    clock: '<circle cx="9.5" cy="9.5" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 5.5 v4 M6.5 9.5 h6" stroke="currentColor" stroke-width="1.6"/>',
    logout: '<path d="M4 4 h7 v4 c-3-4 3-4 M7 4 h7 v4" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    chevron: '<path d="M5 8 l3 3 l3 3 l3 3 z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    search: '<circle cx="7" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 4.5 q1.6 2.4 3 4.2 M11 4.5 h3.4" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  };
  const d = paths[name] ?? paths.dashboard;
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g dangerouslySetInnerHTML={{ __html: d }} />
    </svg>
  );
}

/* --------------------------- Form controls --------------------------- */

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none";

export const labelCls = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "success";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm",
    ghost: "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${styles[variant]} disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Modal ------------------------------ */

export function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${wide ? "max-w-2xl" : "max-w-md"} w-full rounded-2xl bg-white shadow-2xl max-h-[88vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <svg viewBox="0 0 20 20" className="w-4.5 h-4.5" stroke="currentColor" strokeWidth="2">
              <path d="M5 5 h10 M5 5 v10" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------- Misc widgets --------------------------- */

export function Badge({ label, className = "bg-slate-200 text-slate-600" }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>{label}</span>
  );
}

export function EmptyState({ icon = "leads", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = "text-slate-900" }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}