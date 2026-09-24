"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api, friendlyDate } from "@/lib/api";
import { Badge, Button, EmptyState, Field, Icon, Modal, PageHeader, StatCard, inputCls } from "@/components/ui";
import { LeadOption, localToday } from "@/components/TaskModal";

interface ArchiveItem {
  id: string;
  weekKey: string;
  kind: "deal" | "followup" | "note";
  leadId: string | null;
  title: string;
  result: string;
  notes: string;
  createdAt: string;
  leadName: string | null;
  leadCompany: string | null;
}

interface WeekGroup {
  weekKey: string;
  deals: number;
  followups: number;
  notes: number;
  items: ArchiveItem[];
}

const KIND_LABEL: Record<string, string> = { deal: "Deal", followup: "Follow-up", note: "Note" };

export default function CompletedPage() {
  const [weeks, setWeeks] = useState<WeekGroup[]>([]);
  const [currentWeek, setCurrentWeek] = useState("");
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Add-entry form
  const [kind, setKind] = useState("followup");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(localToday());
  const [leadId, setLeadId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await api<{ weeks: WeekGroup[]; currentWeek: string }>("/api/archive");
      setWeeks(res.weeks);
      setCurrentWeek(res.currentWeek);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load archive.");
    } finally {
      setLoading(false);
    }
    try {
      const l = await api<{ leads: LeadOption[] }>("/api/leads");
      setLeads(l.leads);
    } catch {
      /* optional */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addEntry() {
    setSaving(true);
    setError("");
    try {
      await api("/api/archive", {
        method: "POST",
        body: { kind, title, date, leadId: leadId || null, notes, result: "done" },
      });
      setShowNew(false);
      setTitle("");
      setNotes("");
      setLeadId("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the entry.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    await api(`/api/archive/${id}`, { method: "DELETE" });
    setConfirmId(null);
    load();
  }

  const totalDeals = weeks.reduce((sum, w) => sum + w.deals, 0);
  const totalFollowups = weeks.reduce((sum, w) => sum + w.followups, 0);
  const maxDeals = Math.max(1, ...weeks.map((w) => w.deals));

  return (
    <Shell>
      <PageHeader
        title="Completed Archive"
        subtitle="Weekly performance log — closed deals and finished follow-ups, so your workspace stays uncluttered."
        action={
          <Button variant="success" onClick={() => setShowNew(true)}>
            <Icon name="plus" className="h-4 w-4" /> Log entry
          </Button>
        }
      />

      {error && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Deals closed" value={String(totalDeals)} sub="All time" accent="text-emerald-600" />
        <StatCard label="Follow-ups done" value={String(totalFollowups)} sub="All time" accent="text-indigo-700" />
        <StatCard label="Weeks tracked" value={String(weeks.length)} sub="Rolling history" accent="text-sky-700" />
        <StatCard label="Best week" value={weeks.length ? String(Math.max(...weeks.map((w) => w.deals))) : "—"} sub="Deals in one week" accent="text-amber-600" />
      </div>

      {!loading && weeks.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon="archive"
            title="Nothing archived yet"
            hint="Closed deals are logged automatically. Use “Log entry” for anything else worth remembering."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {weeks.map((w) => (
            <section key={w.weekKey} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800">Week of {friendlyDate(w.weekKey)}</h2>
                    {w.weekKey === currentWeek && <Badge label="Current" className="bg-indigo-100 text-indigo-700" />}
                  </div>
                  <div className="mt-1 flex h-2 w-40 items-center">
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                        style={{ width: `${Math.max(6, (w.deals / maxDeals) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Badge label={`${w.deals} deals`} className="bg-emerald-100 text-emerald-700" />
                  <Badge label={`${w.followups} follow-ups`} className="bg-sky-100 text-sky-700" />
                  <Badge label={`${w.notes} notes`} className="bg-slate-200 text-slate-600" />
                </div>
              </header>

              <ul className="divide-y divide-slate-100">
                {w.items.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${kindBox(a.kind)}`}>
                      <Icon name={kindIcon(a.kind)} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{a.title}</p>
                      <p className="text-[11px] text-slate-400">
                        <span className="font-medium text-slate-500">{KIND_LABEL[a.kind]}</span>
                        {a.leadName ? ` · ${a.leadName}${a.leadCompany ? ` · ${a.leadCompany}` : ""}` : ""}
                        {a.notes ? ` · ${a.notes}` : ""}
                      </p>
                    </div>
                    {confirmId === a.id ? (
                      <button
                        onClick={() => removeEntry(a.id)}
                        className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmId(a.id)}
                        title="Delete entry"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Log an entry">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="deal">Deal closed</option>
              <option value="followup">Follow-up done</option>
              <option value="note">Note</option>
            </select>
          </Field>
          <Field label="Date">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Title *">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "deal" ? "Acme Inc signed" : "What happened?"} autoFocus />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Lead">
            <select className={inputCls} value={leadId || ""} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">None</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.company ? ` · ${l.company}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Result">
            <input className={inputCls} value={kind === "deal" ? "won" : "done"} disabled placeholder="won / done" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Notes">
            <textarea rows={2} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering next time…" />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowNew(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={addEntry} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Log entry"}
          </Button>
        </div>
      </Modal>
    </Shell>
  );
}

function kindIcon(kind: string): string {
  return kind === "deal" ? "check" : kind === "followup" ? "clock" : "archive";
}

function kindBox(kind: string): string {
  return {
    deal: "bg-emerald-100 text-emerald-700",
    followup: "bg-sky-100 text-sky-700",
    note: "bg-slate-200 text-slate-600",
  }[kind];
}