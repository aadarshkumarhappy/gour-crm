"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api, friendlyDate } from "@/lib/api";
import { Badge, EmptyState, Icon, Modal, Button, PageHeader, inputCls } from "@/components/ui";
import LeadModal, { LeadItem } from "@/components/LeadModal";
import TaskModal, { LeadOption, TaskItem } from "@/components/TaskModal";
import { STAGES, STAGE } from "@/lib/constants";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const [editing, setEditing] = useState<LeadItem | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [taskFor, setTaskFor] = useState<{ open: boolean; leadId: string }>({ open: false, leadId: "" });
  const [confirmLead, setConfirmLead] = useState<LeadItem | null>(null);

  async function load() {
    try {
      const res = await api<{ leads: LeadItem[] }>("/api/leads");
      setLeads(res.leads);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = leads.filter((l) => {
    const okStage = stageFilter === "all" || l.stage === Number(stageFilter);
    const hay = `${l.name} ${l.company} ${l.email} ${l.phone} ${l.link} ${l.source} ${l.notes}`.toLowerCase();
    return okStage && (!q || hay.includes(q));
  });

  function onSaved(lead: LeadItem) {
    load();
    void lead;
  }

  async function deleteLead() {
    if (!confirmLead) return;
    await api(`/api/leads/${confirmLead.id}`, { method: "DELETE" });
    setConfirmLead(null);
    load();
  }

  return (
    <Shell>
      <PageHeader
        title="Leads Directory"
        subtitle="Every contact and link in one place — no more scattered notes."
        action={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" className="h-4 w-4" /> New lead
          </Button>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search name, company, email, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={`${inputCls} w-44`} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="all">All stages</option>
          {STAGES.map((s, i) => (
            <option key={s} value={i + 1}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs font-medium text-slate-400">
          {filtered.length} of {leads.length} contacts
        </span>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Next follow-up</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="leads"
                    title={leads.length === 0 ? "No leads yet" : "Nothing matches your filter"}
                    hint={leads.length === 0 ? "Add your first contact to start tracking deals." : "Try a different search or stage."}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 uppercase">
                        {initials(l.name)}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-semibold text-slate-800">{l.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {l.company || "—"}
                          {l.source ? ` · ${l.source}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.email ? (
                      <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline">
                        <Icon name="mail" className="h-3.5 w-3.5" />
                        <span className="max-w-[150px] truncate">{l.email}</span>
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.phone ? (
                      <a href={`tel:${l.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline">
                        <Icon name="phone" className="h-3.5 w-3.5" />
                        {l.phone}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {l.link ? (
                      <a
                        href={normalizeUrl(l.link)}
                        target="_blank"
                        rel="noreferrer"
                        title={l.link}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600"
                      >
                        <Icon name="link" className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={STAGES[l.stage - 1] || STAGES[0]} className={STAGE[l.stage - 1]} />
                  </td>
                  <td className="px-4 py-3">
                    {l.activeTask ? (
                      <Badge label={`Overdue · ${friendlyDate(l.activeTask.dueDate)}`} className="bg-rose-100 text-rose-600" />
                    ) : l.nextTask ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Icon name="clock" className="h-3.5 w-3.5" />
                        {friendlyDate(l.nextTask.dueDate)}
                        <span className="text-slate-300">· {l.openTaskCount ?? 0} open</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">{l.openTaskCount ? `${l.openTaskCount} open` : "None"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTaskFor({ open: true, leadId: l.id })}
                        title="Add follow-up task"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                      >
                        <Icon name="plus" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditing(l)}
                        title="Edit lead"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmLead(l)}
                        title="Delete lead"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LeadModal open={showNew} onClose={() => setShowNew(false)} onSaved={onSaved} />
      <LeadModal key={editing ? `edit-${editing.id}` : "edit-none"} open={!!editing} lead={editing} onClose={() => setEditing(null)} onSaved={onSaved} />

      <TaskModal
        open={taskFor.open}
        onClose={() => setTaskFor({ open: false, leadId: "" })}
        onSaved={() => load()}
        leads={leads as LeadOption[]}
        defaultLeadId={taskFor.leadId}
      />

      <Modal open={!!confirmLead} onClose={() => setConfirmLead(null)} title="Delete lead?">
        <p className="text-sm text-slate-600">
          {confirmLead ? (
            <>
              Delete <span className="font-semibold">{confirmLead.name}</span>
              {confirmLead.company ? ` · ${confirmLead.company}` : ""}? Its open tasks are removed too. This cannot be undone.
            </>
          ) : (
            ""
          )}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmLead(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteLead}>
            Delete lead
          </Button>
        </div>
      </Modal>
    </Shell>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}